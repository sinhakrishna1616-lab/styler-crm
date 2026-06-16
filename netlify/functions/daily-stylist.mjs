/**
 * daily-stylist.mjs
 * StylerCRM — Daily Scheduled Function
 *
 * Schedule: 30 2 * * * (UTC) = 8:00 AM IST
 *
 * Flow:
 *  1. Load sent-history from Netlify Blobs (handles sent in last 30 days)
 *  2. Call Apify instagram-hashtag-scraper for styling hashtags
 *  3. Collect unique post owners, filter out already-sent handles
 *  4. For each candidate, call Apify instagram-profile-scraper
 *  5. Filter: active (posted ≤30d), male-celebrity stylist, ≥50K followers
 *  6. Assign designation, extract celeb collabs from captions
 *  7. Pick top 50, save to Blobs, update sent-history
 *  8. Send Telegram message
 *  9. Fallback: if Apify fails, use last cached list
 */

import { getStore } from "@netlify/blobs";

// ── Config ────────────────────────────────────────────────────────────────────

const TELEGRAM_TOKEN  = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const APIFY_TOKEN     = process.env.APIFY_TOKEN;

const APIFY_BASE = "https://api.apify.com/v2/acts";

// Hashtags to scrape
const HASHTAGS = [
  "bollywoodstylist",
  "celebritystylist",
  "menswearstylist",
  "fashionstylist",
  "stylistlife",
  "bollywoodfashion",
  "menstyle",
  "bollywoodstyle",
];

// Known Indian male celebrities (used to detect collabs in captions)
const MALE_CELEBS = [
  "Ranveer Singh","Shah Rukh Khan","Salman Khan","Aamir Khan","Hrithik Roshan",
  "Ranbir Kapoor","Varun Dhawan","Sidharth Malhotra","Vicky Kaushal","Tiger Shroff",
  "Kartik Aaryan","Aditya Roy Kapoor","Shahid Kapoor","Arjun Kapoor","John Abraham",
  "Akshay Kumar","Ayushmann Khurrana","Rajkummar Rao","Vikrant Massey","Ishaan Khattar",
  "Adarsh Gourav","Vijay Varma","Jaideep Ahlawat","Nawazuddin Siddiqui","Manoj Bajpayee",
  "Pankaj Tripathi","Farhan Akhtar","Irrfan Khan","Sanjay Dutt","Suniel Shetty",
  "Bobby Deol","Arbaaz Khan","Sohail Khan","Varun Sharma","Aparshakti Khurana",
  "Siddhanth Chaturvedi","Karan Johar","Abhishek Bachchan","Amitabh Bachchan",
  "Rohit Sharma","Virat Kohli","KL Rahul","Hardik Pandya","Shubman Gill",
  "Ishan Kishan","MS Dhoni","Rishabh Pant","Diljit Dosanjh","AP Dhillon",
  "Guru Randhawa","Badshah","Harrdy Sandhu","B Praak","Jubin Nautiyal",
  "Armaan Malik","Arijit Singh","Darshan Raval","Mohanlal","Mammootty",
  "Dulquer Salmaan","Tovino Thomas","Fahadh Faasil","Vijay Deverakonda",
  "Ram Charan","NTR Jr","Allu Arjun","Prabhas","Mahesh Babu","Rana Daggubati",
  "Nani","Siddharth","Dhanush","Vijay","Ajith Kumar","Suriya","Kamal Haasan",
  "Rajinikanth","Karthi","Vikram","Jayam Ravi","Nivin Pauly","Prithviraj Sukumaran",
  "Asif Ali","Kunchacko Boban","Joju George","Biju Menon","Indrajith Sukumaran",
  "Kapil Sharma","Sunil Grover","Krushna Abhishek","Kiku Sharda",
  "Riteish Deshmukh","Shreyas Talpade","Kunal Kemmu","Imran Khan",
  "Anil Kapoor","Arjun Rampal","Chunky Panday","Zayed Khan","Uday Chopra",
  "Govinda","Mithun Chakraborty","Jackie Shroff","Sunny Deol","Dharmendra",
  "Harsh Varrdhan Kapoor","Ahaan Panday","Ibrahim Ali Khan","Junaid Khan",
  "Karan Aujla","Sidhu Moosewala","Honey Singh","Raftaar","Divine",
  "King","MC Stan","Seedhe Maut","Karma","Hanumankind",
  "Tiger Baby","Zaheer Iqbal","Aayush Sharma","Sooraj Pancholi",
];

// Regex patterns to detect male-stylist context
const MALE_KEYWORDS = [
  /\bmen\b/i, /\bmenswear\b/i, /\bgents\b/i, /\bboys?\b/i,
  /bollywood/i, /\bactor\b/i, /\bceleb/i, /\bhim\b/i, /\bhis\b/i,
  /\bking\b/i, /\bgroom/i, /\bsuit\b/i, /\bsherwani\b/i, /\bkurta\b/i,
];

// Female-only keywords (exclusion heuristic)
const FEMALE_EXCL = [
  /\bbridal\b/i, /\bsaree\b/i, /\blehenga\b/i, /\bshe\b/i,
  /\bher\b/i, /\bwoman\b/i, /\bwomen\b/i, /\bgirl\b/i, /\bqueen\b/i,
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n) =>
  n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + "M"
  : n >= 1_000   ? Math.round(n / 1_000) + "K"
  : String(n);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Call an Apify actor synchronously and return dataset items */
async function runApify(actorId, input, timeoutSecs = 120) {
  if (!APIFY_TOKEN) throw new Error("APIFY_TOKEN not set");

  const url = `${APIFY_BASE}/${encodeURIComponent(actorId)}/run-sync-get-dataset-items` +
    `?token=${APIFY_TOKEN}&timeout=${timeoutSecs}&memory=256`;

  console.log(`[Apify] Calling ${actorId} …`);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Apify ${actorId} HTTP ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  console.log(`[Apify] ${actorId} returned ${Array.isArray(data) ? data.length : "?"} items`);
  return Array.isArray(data) ? data : [];
}

/** Extract celeb names mentioned in a text string */
function extractCelebCollabs(texts) {
  const found = new Set();
  const combined = texts.join(" ");
  for (const celeb of MALE_CELEBS) {
    if (combined.toLowerCase().includes(celeb.toLowerCase())) {
      found.add(celeb);
    }
    if (found.size >= 5) break;
  }
  return [...found].slice(0, 5);
}

/** Decide designation by follower count */
function getDesignation(followers) {
  if (followers >= 100_000) return "Senior";
  if (followers >= 50_000) return "Junior";
  return "Intern";
}

/** Check if account looks like a real person (not a bot/brand/spam) */
function isRealPerson(profile) {
  const bio = (profile.biography || "");
  const username = (profile.username || "").toLowerCase();
  const fullName = (profile.fullName || "");

  // Reject if no posts at all
  if ((profile.postsCount || 0) < 6) return false;

  // Reject obvious bots: username has excessive numbers/underscores
  if (/[0-9]{5,}/.test(username)) return false;
  if ((username.match(/_/g) || []).length > 4) return false;

  // Reject if following way more than followers (ratio > 5:1 with >1000 following) — spam signal
  const followers = profile.followersCount || 0;
  const following = profile.followingCount || 0;
  if (following > 1000 && following > followers * 5) return false;

  // Reject accounts with zero bio — real stylists always have bios
  if (bio.trim().length < 10) return false;

  // Reject if fullName looks auto-generated (all numbers or very short)
  if (!fullName || fullName.length < 3) return false;

  return true;
}

/** Check if the profile is likely a male-celebrity stylist */
function isMaleStylist(profile) {
  const bio = (profile.biography || "").toLowerCase();
  const username = (profile.username || "").toLowerCase();
  const captions = (profile.latestIgtvVideos || []).concat(profile.latestPosts || [])
    .map((p) => (p.caption || "").toLowerCase())
    .join(" ");
  const combined = bio + " " + username + " " + captions;

  // Must have at least one male keyword
  const hasMale = MALE_KEYWORDS.some((rx) => rx.test(combined));
  if (!hasMale) return false;

  // Reject if heavily female-focused (more than 3 female markers)
  const femaleHits = FEMALE_EXCL.filter((rx) => rx.test(combined)).length;
  if (femaleHits >= 3) return false;

  return true;
}

/** Check if profile has posted in the last 30 days */
function isActive(profile) {
  try {
    const posts = profile.latestPosts || [];
    if (!posts.length) return false;
    const latest = posts[0];
    const ts = latest.timestamp || latest.takenAtTimestamp;
    if (!ts) return true; // assume active if we can't tell
    const posted = new Date(typeof ts === "number" ? ts * 1000 : ts);
    const days = (Date.now() - posted) / 86_400_000;
    return days <= 30;
  } catch {
    return true;
  }
}

/** Send a Telegram message (splits if >4096 chars) */
async function sendTelegram(text) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("[Telegram] Missing TELEGRAM_TOKEN or TELEGRAM_CHAT_ID — skipping send");
    return;
  }

  const chunks = [];
  for (let i = 0; i < text.length; i += 4000) {
    chunks.push(text.slice(i, i + 4000));
  }

  for (const chunk of chunks) {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: chunk,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }
    );
    const json = await res.json().catch(() => ({}));
    if (!json.ok) {
      // If HTML mode fails, retry as plain text
      console.error("[Telegram] HTML send failed, retrying plain:", JSON.stringify(json));
      const res2 = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: chunk.replace(/<[^>]+>/g, ""),
            disable_web_page_preview: true,
          }),
        }
      );
      const j2 = await res2.json().catch(() => ({}));
      if (j2.ok) console.log("[Telegram] Fallback plain send OK");
    } else {
      console.log("[Telegram] Chunk sent OK");
    }
    if (chunks.length > 1) await sleep(500);
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export const config = {
  schedule: "30 2 * * *",
};

export default async (req, context) => {
  const runAt = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  console.log(`\n=== StylerCRM daily run started at ${runAt} IST ===`);

  // ── Step 1: Load sent-history ───────────────────────────────────────────────
  const historyStore = getStore("sent-history");
  const dataStore    = getStore("stylist-data");

  let sentHistory = { handles: [], timestamps: [] };
  try {
    const saved = await historyStore.getJSON("sent_handles");
    if (saved) sentHistory = saved;
    console.log(`[History] ${sentHistory.handles.length} handles in sent history`);
  } catch (e) {
    console.warn("[History] Could not load sent history:", e.message);
  }

  // Remove entries older than 30 days
  const cutoff = Date.now() - 30 * 86_400_000;
  const freshIdx = sentHistory.timestamps
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => t > cutoff)
    .map(({ i }) => i);
  sentHistory.handles    = freshIdx.map((i) => sentHistory.handles[i]);
  sentHistory.timestamps = freshIdx.map((i) => sentHistory.timestamps[i]);
  const alreadySent = new Set(sentHistory.handles);

  let stylists = [];
  let apifyWorked = false;

  try {
    // ── Step 2: Scrape hashtag posts ─────────────────────────────────────────
    if (!APIFY_TOKEN) throw new Error("APIFY_TOKEN environment variable is not set");

    const hashtagItems = await runApify("apify/instagram-hashtag-scraper", {
      hashtags: HASHTAGS,
      resultsLimit: 150,
      proxy: { useApifyProxy: true, apifyProxyGroups: ["RESIDENTIAL"] },
    }, 180);

    // ── Step 3: Collect unique post owners ───────────────────────────────────
    const ownerMap = new Map(); // username → { id, username, fullName }
    for (const item of hashtagItems) {
      const owner = item.ownerUsername || item.ownerId;
      if (!owner) continue;
      if (alreadySent.has(owner)) continue;
      if (!ownerMap.has(owner)) {
        ownerMap.set(owner, {
          username: item.ownerUsername || "",
          fullName: item.ownerFullName || "",
        });
      }
    }
    console.log(`[Filter] ${ownerMap.size} unique owners found (after history exclusion)`);

    if (ownerMap.size === 0) throw new Error("No new owners from hashtag scrape");

    // Take up to 120 candidates for profile scraping
    const candidates = [...ownerMap.keys()].slice(0, 120);

    // ── Step 4: Profile scrape ───────────────────────────────────────────────
    console.log(`[Apify] Profile scraping ${candidates.length} accounts …`);
    const profiles = await runApify("apify/instagram-profile-scraper", {
      usernames: candidates,
      resultsType: "posts",
      resultsLimit: 12,
      proxy: { useApifyProxy: true, apifyProxyGroups: ["RESIDENTIAL"] },
    }, 240);

    const profileMap = new Map();
    for (const p of profiles) {
      if (p.username) profileMap.set(p.username.toLowerCase(), p);
    }
    console.log(`[Apify] Got ${profileMap.size} profiles back`);

    // ── Step 5–7: Filter + designate ────────────────────────────────────────
    const results = [];

    for (const username of candidates) {
      const profile = profileMap.get(username.toLowerCase());
      if (!profile) continue;

      const followers = profile.followersCount || 0;
      if (followers < 50_000) continue;            // Must have 50K+ followers
      if (!isRealPerson(profile)) continue;         // Must look like a real human account
      if (!isActive(profile)) continue;             // Must have posted in 30 days
      if (!isMaleStylist(profile)) continue;        // Must look like male stylist

      const captions = (profile.latestPosts || []).map((p) => p.caption || "");
      const collabs  = extractCelebCollabs(captions);

      // Require at least 1 detected celeb collab OR bio mentions celeb styling
      const bio = (profile.biography || "").toLowerCase();
      const hasCelebRef =
        collabs.length > 0 ||
        MALE_CELEBS.some((c) => bio.includes(c.toLowerCase())) ||
        /stylist|styling|styled/i.test(bio);

      if (!hasCelebRef) continue;

      results.push({
        id:        results.length + 1,
        name:      profile.fullName || ownerMap.get(username)?.fullName || username,
        handle:    profile.username || username,
        followers: followers,
        des:       getDesignation(followers),
        collabs:   collabs.length > 0 ? collabs : ["Celebrity Stylist"],
        bio:       (profile.biography || "").slice(0, 120),
        scrapedAt: Date.now(),
      });

      if (results.length >= 80) break; // collect extras, pick top 50 later
    }

    console.log(`[Filter] ${results.length} stylists passed all filters`);

    // Sort by followers descending, pick top 50
    results.sort((a, b) => b.followers - a.followers);
    stylists = results.slice(0, 50).map((s, i) => ({ ...s, id: i + 1 }));
    apifyWorked = stylists.length > 0;

    if (!apifyWorked) throw new Error("All candidates filtered out — none passed criteria");

  } catch (err) {
    console.error("[Apify] Scrape failed:", err.message);
    // ── Fallback: use last cached list ───────────────────────────────────────
    try {
      const cached = await dataStore.getJSON("today");
      if (cached && Array.isArray(cached.stylists) && cached.stylists.length) {
        stylists = cached.stylists;
        console.log(`[Fallback] Using cached list of ${stylists.length} stylists`);
      }
    } catch (e2) {
      console.warn("[Fallback] No cache available either:", e2.message);
    }
  }

  // If still empty, use a minimal hardcoded safety net
  if (stylists.length === 0) {
    console.warn("[Safety] Using built-in emergency list");
    stylists = EMERGENCY_LIST;
  }

  // ── Step 7: Save to Blobs ─────────────────────────────────────────────────
  try {
    await dataStore.setJSON("today", {
      stylists,
      updatedAt: Date.now(),
      source:    apifyWorked ? "apify" : "fallback",
    });
    console.log("[Blobs] Saved today's stylist list");
  } catch (e) {
    console.error("[Blobs] Failed to save stylist list:", e.message);
  }

  // Update sent-history only if Apify worked
  if (apifyWorked) {
    const newHandles = stylists.map((s) => s.handle);
    sentHistory.handles    = [...sentHistory.handles, ...newHandles];
    sentHistory.timestamps = [...sentHistory.timestamps, ...newHandles.map(() => Date.now())];
    try {
      await historyStore.setJSON("sent_handles", sentHistory);
      console.log(`[History] Updated — now ${sentHistory.handles.length} handles tracked`);
    } catch (e) {
      console.error("[History] Failed to save sent history:", e.message);
    }
  }

  // ── Step 8: Build & send Telegram message ─────────────────────────────────
  const dateStr = new Date().toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const sourceNote = apifyWorked
    ? "🟢 Live scraped from Instagram"
    : "🟡 Cached list (Apify unavailable today — will retry tomorrow)";

  let msg = `✨ <b>StylerCRM — Daily Stylist List</b>\n`;
  msg += `📅 ${dateStr}\n`;
  msg += `${sourceNote}\n`;
  msg += `${"-".repeat(28)}\n\n`;

  stylists.forEach((s, i) => {
    const igLink = `https://www.instagram.com/${s.handle}/`;
    msg += `<b>${i + 1}. ${s.name}</b>  ·  ${s.des}\n`;
    msg += `   📱 <a href="${igLink}">instagram.com/${s.handle}</a>\n`;
    msg += `   👥 ${fmt(s.followers)} followers\n`;
    if (s.collabs && s.collabs.filter((c) => c !== "Celebrity Stylist").length > 0) {
      msg += `   🎬 ${s.collabs.slice(0, 3).join(" · ")}\n`;
    }
    msg += `\n`;
  });

  msg += `\n📊 Total: ${stylists.length} stylists\n`;
  msg += `🔗 View CRM: https://boisterous-empanada-fc858b.netlify.app/`;

  await sendTelegram(msg);
  console.log(`=== Run complete. Sent ${stylists.length} stylists ===\n`);
};

// ── Emergency fallback list (used only if Apify AND cache both fail) ──────────
const EMERGENCY_LIST = [
  {id:1,name:"Abhilasha Devnani",handle:"abhilashadevnani",followers:124000,des:"Senior",collabs:["Vicky Kaushal","Sidharth Malhotra","Aditya Roy Kapoor","Shahid Kapoor","Ranveer Singh"]},
  {id:2,name:"Edward Lalrempuia",handle:"edwardlalr",followers:210000,des:"Senior",collabs:["Salman Khan","Shah Rukh Khan","Akshay Kumar","Varun Dhawan","John Abraham"]},
  {id:3,name:"Mohit Rai",handle:"mohitraistylist",followers:67000,des:"Junior",collabs:["Salman Khan","Sanjay Dutt","Suniel Shetty","Bobby Deol","Arbaaz Khan"]},
  {id:4,name:"Tanya Ghavri",handle:"tanyaghavri",followers:156000,des:"Senior",collabs:["Karan Johar","Vicky Kaushal","Sidharth Malhotra","Kartik Aaryan","Aditya Roy Kapoor"]},
  {id:5,name:"Krishnaraj Rai",handle:"krishnaraj_rai",followers:89000,des:"Junior",collabs:["Ranveer Singh","Ranbir Kapoor","Ayushmann Khurrana","Kartik Aaryan","Tiger Shroff"]},
  {id:6,name:"Priya Dewan",handle:"priyadewan.style",followers:145000,des:"Senior",collabs:["Ranbir Kapoor","Aamir Khan","Hrithik Roshan","Farhan Akhtar","Siddhanth Chaturvedi"]},
  {id:7,name:"Shaleena Nathani",handle:"shaleenanathani",followers:320000,des:"Senior",collabs:["Shah Rukh Khan","Ranbir Kapoor","Aamir Khan"]},
  {id:8,name:"Ami Patel",handle:"stylebyami",followers:267000,des:"Senior",collabs:["Hrithik Roshan","Tiger Shroff","Kartik Aaryan"]},
  {id:9,name:"Nikhil Mansata",handle:"nikhilmansata",followers:58000,des:"Junior",collabs:["Ayushmann Khurrana","Rajkummar Rao","Vikrant Massey"]},
  {id:10,name:"Eka Lakhani",handle:"ekalakhani",followers:76000,des:"Junior",collabs:["Vicky Kaushal","Sidharth Malhotra","Aditya Roy Kapoor"]},
];
