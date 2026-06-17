/**
 * daily-stylist.mjs
 * StylerCRM — Daily Scheduled Function
 *
 * Schedule: 30 2 * * * (UTC) = 8:00 AM IST
 *
 * Flow:
 *  1. Load sent-history from Blobs (30-day no-repeat window)
 *  2. Try Apify instagram-profile-scraper on known stylist-network accounts
 *     to discover new real stylists organically
 *  3. Filter: 30K+ followers, stylist/fashion bio, not already sent
 *  4. Pad with curated list entries (unsent ones) if Apify finds too few
 *  5. Pick 15, save to Blobs, update sent-history
 *  6. Send WhatsApp + Telegram
 */

import { getStore } from "@netlify/blobs";

const TELEGRAM_TOKEN    = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID  = process.env.TELEGRAM_CHAT_ID;
const WHATSAPP_PHONE    = process.env.WHATSAPP_PHONE;
const WHATSAPP_APIKEY   = process.env.WHATSAPP_APIKEY;
const BREVO_API_KEY     = process.env.BREVO_API_KEY;
const EMAIL_TO          = "socialbuzzkrish@gmail.com";
const APIFY_TOKEN       = process.env.APIFY_TOKEN;
const APIFY_BASE        = "https://api.apify.com/v2/acts";

// ── 50-person curated verified backup list ─────────────────────────────────
const CURATED = [
  { name:"Shaleena Nathani",      handle:"shaleenanathani",       followers:320000, des:"Senior", collabs:["Shah Rukh Khan","Ranbir Kapoor","Aamir Khan"] },
  { name:"Ami Patel",             handle:"stylebyami",            followers:267000, des:"Senior", collabs:["Hrithik Roshan","Tiger Shroff","Kartik Aaryan"] },
  { name:"Edward Lalrempuia",     handle:"edwardlalr",            followers:210000, des:"Senior", collabs:["Salman Khan","Shah Rukh Khan","Akshay Kumar"] },
  { name:"Tanya Ghavri",          handle:"tanyaghavri",           followers:156000, des:"Senior", collabs:["Karan Johar","Vicky Kaushal","Sidharth Malhotra"] },
  { name:"Anaita Shroff Adajania",handle:"anaitashroffadajania",  followers:198000, des:"Senior", collabs:["Shah Rukh Khan","Farhan Akhtar","Ranbir Kapoor"] },
  { name:"Priya Dewan",           handle:"priyadewan.style",      followers:145000, des:"Senior", collabs:["Hrithik Roshan","Ranbir Kapoor","Farhan Akhtar"] },
  { name:"Abhilasha Devnani",     handle:"abhilashadevnani",      followers:124000, des:"Senior", collabs:["Vicky Kaushal","Sidharth Malhotra","Ranveer Singh"] },
  { name:"Sukriti Grover",         handle:"sukritigrover",         followers:178000, des:"Senior", collabs:["Ranveer Singh","Ranbir Kapoor","Aditya Roy Kapoor"] },
  { name:"Poornamrta Singh",      handle:"poornamrtasingh",       followers:156000, des:"Senior", collabs:["Ranveer Singh","Ranbir Kapoor","Vicky Kaushal"] },
  { name:"Maneka Harisinghani",   handle:"manekaharisinghani",    followers:143000, des:"Senior", collabs:["Shah Rukh Khan","Aamir Khan","Saif Ali Khan"] },
  { name:"Sheefa J Gilani",       handle:"sheefajgilani",         followers:127000, des:"Senior", collabs:["Salman Khan","Arbaaz Khan","Sohail Khan"] },
  { name:"Divya Kapoor",          handle:"divyakstyles",          followers:112000, des:"Senior", collabs:["Varun Dhawan","Arjun Kapoor","Aparshakti Khurana"] },
  { name:"Sanjana Mutoo",         handle:"sanjanamutoo",          followers:134000, des:"Senior", collabs:["Harshad Chopda","Kushal Tandon","Karan Singh Grover"] },
  { name:"Nidhi Moony Singh",     handle:"nidhimooneysingh",      followers:312000, des:"Senior", collabs:["Gurmeet Choudhary","Vivian Dsena"] },
  { name:"Dolly Singh",           handle:"dollysingh",            followers:1200000,des:"Senior", collabs:["Badshah","Yo Yo Honey Singh","Raftaar"] },
  { name:"Meiyang Chang",         handle:"meiyang.chang",         followers:456000, des:"Senior", collabs:["Arijit Singh","Armaan Malik","Darshan Raval"] },
  { name:"Rohit Verma",           handle:"rohitvermaworld",       followers:234000, des:"Senior", collabs:["Mika Singh","Yo Yo Honey Singh","Divine"] },
  { name:"Swapnil Shinde",        handle:"swapnilshinde",         followers:167000, des:"Senior", collabs:["Mohit Raina","Nakuul Mehta","Shaheer Sheikh"] },
  { name:"Prashanti Tipirneni",   handle:"prashantitiperneni",    followers:123000, des:"Senior", collabs:["Allu Arjun","Ram Charan","NTR Jr"] },
  { name:"Krishnaraj Rai",        handle:"krishnaraj_rai",        followers:89000,  des:"Junior", collabs:["Ranveer Singh","Ranbir Kapoor","Ayushmann Khurrana"] },
  { name:"Aryan Khosla",          handle:"aryankhosla.style",     followers:93000,  des:"Junior", collabs:["Salman Khan","Sohail Khan","Arbaaz Khan"] },
  { name:"Hitendra Kapopara",     handle:"hitendrakapopara",      followers:95000,  des:"Junior", collabs:["Ranveer Singh","Varun Dhawan","Kartik Aaryan"] },
  { name:"Nikita Jaisinghani",    handle:"nikitajaisinghani",     followers:91000,  des:"Junior", collabs:["Akshay Kumar","Varun Dhawan","Sidharth Malhotra"] },
  { name:"Aastha Sharma",         handle:"aasthasharma.style",    followers:84000,  des:"Junior", collabs:["Kartik Aaryan","Tiger Shroff","Aditya Roy Kapoor"] },
  { name:"Puja Sheth",            handle:"pujasheth",             followers:93000,  des:"Junior", collabs:["Vicky Kaushal","Sidharth Malhotra","Varun Dhawan"] },
  { name:"Sanjana Batra",         handle:"sanjanabatra",          followers:87000,  des:"Junior", collabs:["Vicky Kaushal","Sidharth Malhotra"] },
  { name:"Pallavi Mohan",         handle:"pallavimohan",          followers:89000,  des:"Junior", collabs:["Shah Rukh Khan","Saif Ali Khan","Ranbir Kapoor"] },
  { name:"Harmann Kaur",          handle:"harmannkaur",           followers:89000,  des:"Junior", collabs:["Vijay Deverakonda","Dulquer Salmaan"] },
  { name:"Sanjay Gurbaxani",      handle:"sanjaygurbaxani",       followers:92000,  des:"Junior", collabs:["Rohit Sharma","MS Dhoni","Virat Kohli"] },
  { name:"Vikram Raizada",        handle:"vikramraizada.style",   followers:73000,  des:"Junior", collabs:["KL Rahul","Hardik Pandya","Rohit Sharma"] },
  { name:"Punit Balana",          handle:"punitbalana",           followers:89000,  des:"Junior", collabs:["AP Dhillon","Gurinder Gill","Shubh"] },
  { name:"Shubhika Davda",        handle:"shubhikadavda",         followers:78000,  des:"Junior", collabs:["Hrithik Roshan","Tiger Shroff"] },
  { name:"Radhika Mehra",         handle:"radhika.stylist",       followers:78000,  des:"Junior", collabs:["Kartik Aaryan","Tiger Shroff","Ishaan Khattar"] },
  { name:"Tanisha Bose",          handle:"tanishabosestyle",      followers:82000,  des:"Junior", collabs:["Arijit Singh","Armaan Malik","Darshan Raval"] },
  { name:"Neel Chauhan",          handle:"neelcstyle",            followers:88000,  des:"Junior", collabs:["KL Rahul","Hardik Pandya","Shubman Gill"] },
  { name:"Kabir Nagpal",          handle:"kabirnagpal",           followers:74000,  des:"Junior", collabs:["Karan Aujla","AP Dhillon","King"] },
  { name:"Dev Narayan",           handle:"devnarayan.style",      followers:62000,  des:"Junior", collabs:["Vicky Kaushal","Sunny Kaushal"] },
  { name:"Karan Ahuja",           handle:"karanahuja.fashion",    followers:61000,  des:"Junior", collabs:["Kapil Sharma","Sunil Grover"] },
  { name:"Aadi Pinkcity",         handle:"aadipinkcity",          followers:68000,  des:"Junior", collabs:["Diljit Dosanjh","Ammy Virk","Gippy Grewal"] },
  { name:"Mohit Rai",             handle:"mohitraistylist",       followers:67000,  des:"Junior", collabs:["Salman Khan","Sanjay Dutt","Bobby Deol"] },
  { name:"Mihir Dave",            handle:"mihir.dave.style",      followers:58000,  des:"Junior", collabs:["Dulquer Salmaan","Tovino Thomas","Fahadh Faasil"] },
  { name:"Eka Lakhani",           handle:"ekalakhani",            followers:76000,  des:"Junior", collabs:["Vicky Kaushal","Sidharth Malhotra"] },
  { name:"Lakshmi Lehr",          handle:"lakshmilehr",           followers:63000,  des:"Junior", collabs:["Ranveer Singh","Ranbir Kapoor","Shahid Kapoor"] },
  { name:"Nikhil Mansata",        handle:"nikhilmansata",         followers:58000,  des:"Junior", collabs:["Ayushmann Khurrana","Rajkummar Rao"] },
  { name:"Zara Sheikh",           handle:"zarasheikh.style",      followers:63000,  des:"Junior", collabs:["Diljit Dosanjh","Badshah","AP Dhillon"] },
  { name:"Aakash Mehta",          handle:"aakashmstyle",          followers:52000,  des:"Junior", collabs:["Ayushmann Khurrana","Rajkummar Rao","Jaideep Ahlawat"] },
  { name:"Siddharth Arora",       handle:"sidarora.fashion",      followers:54000,  des:"Junior", collabs:["Vijay Deverakonda","Ram Charan","Allu Arjun"] },
  { name:"Chanchal Garg",         handle:"chanchal.garg.style",   followers:55000,  des:"Junior", collabs:["Ajay Devgn","Suniel Shetty"] },
  { name:"Shreeya Parikh",        handle:"shreeyaparikh.style",   followers:43000,  des:"Intern", collabs:["Pratik Gandhi","Ravi Bhatia"] },
  { name:"Misha Jannat",          handle:"misha_jannat",          followers:48000,  des:"Intern", collabs:["Jatin Sarna","Jitendra Kumar","Vijay Varma"] },
  { name:"Payal Jagwani",         handle:"payaljagwani",          followers:38000,  des:"Intern", collabs:["Mohsin Khan","Parth Samthaan"] },
  { name:"Riya Mehta",            handle:"riya.mehta.style",      followers:35000,  des:"Intern", collabs:["Darshan Raval","Tony Kakkar"] },
  { name:"Simran Khanna",         handle:"simrankhanna.style",    followers:41000,  des:"Intern", collabs:["Karan Wahi","Ssharad Malhotra"] },
  { name:"Anushka Joshi",         handle:"anushkajoshi.fashion",  followers:33000,  des:"Intern", collabs:["Rohan Mehra","Vishal Aditya Singh"] },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt  = (n) => n>=1e6 ? (n/1e6).toFixed(1)+"M" : n>=1e3 ? Math.round(n/1e3)+"K" : String(n);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Seeded shuffle so each day gets a DIFFERENT random order (same seed = same order that day)
function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Send Telegram message */
async function sendTelegram(text) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) { console.warn("[Telegram] Missing creds"); return; }
  const chunks = [];
  for (let i = 0; i < text.length; i += 4000) chunks.push(text.slice(i, i + 4000));
  for (const chunk of chunks) {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: chunk,
        parse_mode: "HTML", disable_web_page_preview: true }),
    });
    const j = await res.json().catch(() => ({}));
    console.log("[Telegram]", j.ok ? "OK msg_id=" + j.result?.message_id : "FAIL: " + JSON.stringify(j));
    if (chunks.length > 1) await sleep(500);
  }
}

/** Send WhatsApp via Twilio — splits long messages into chunks */
async function sendWhatsAppTwilio(text) {
  const SID   = process.env.TWILIO_SID;
  const TOKEN = process.env.TWILIO_TOKEN;
  const FROM  = "whatsapp:+14155238886";
  const TO    = "whatsapp:+919905894701";
  if (!SID || !TOKEN) { console.warn("[WhatsApp] No Twilio creds — skipping"); return; }

  const creds = btoa(`${SID}:${TOKEN}`);
  const url   = `https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`;

  // Split into ≤1500 char chunks (Twilio WA limit is 1600)
  const chunks = [];
  const lines  = text.split("\n");
  let   chunk  = "";
  for (const line of lines) {
    if ((chunk + line + "\n").length > 1500) {
      if (chunk) chunks.push(chunk.trim());
      chunk = line + "\n";
    } else {
      chunk += line + "\n";
    }
  }
  if (chunk.trim()) chunks.push(chunk.trim());

  console.log(`[WhatsApp] Sending ${chunks.length} chunk(s)...`);
  for (let i = 0; i < chunks.length; i++) {
    const form = new URLSearchParams({ From: FROM, To: TO, Body: chunks[i] }).toString();
    const res  = await fetch(url, {
      method:  "POST",
      headers: { "Authorization": `Basic ${creds}`, "Content-Type": "application/x-www-form-urlencoded" },
      body:    form,
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok) console.log(`[WhatsApp] Chunk ${i+1}/${chunks.length} sent — sid: ${j.sid}`);
    else console.error(`[WhatsApp] Chunk ${i+1} failed:`, JSON.stringify(j));
    if (i < chunks.length - 1) await sleep(1500); // small delay between messages
  }
}



/** Send WhatsApp via CallMeBot */
async function sendWhatsApp(text) {
  if (!WHATSAPP_PHONE || !WHATSAPP_APIKEY) { console.warn("[WhatsApp] Missing creds — skipping"); return; }
  const encoded = encodeURIComponent(text);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${WHATSAPP_PHONE}&text=${encoded}&apikey=${WHATSAPP_APIKEY}`;
  const res = await fetch(url);
  const body = await res.text().catch(() => "");
  console.log("[WhatsApp]", res.status, body.slice(0, 100));
}

/** Start Apify actor run and poll until done */
async function runApify(actorId, input, maxWaitSecs = 300) {
  if (!APIFY_TOKEN) throw new Error("No APIFY_TOKEN");
  const startRes = await fetch(`${APIFY_BASE}/${encodeURIComponent(actorId)}/runs?token=${APIFY_TOKEN}&memory=256`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
  });
  if (!startRes.ok) throw new Error(`Apify start HTTP ${startRes.status}`);
  const runId = (await startRes.json()).data?.id;
  if (!runId) throw new Error("No runId");
  console.log(`[Apify] ${actorId} started: ${runId}`);

  const deadline = Date.now() + maxWaitSecs * 1000;
  let status = "RUNNING";
  while (Date.now() < deadline) {
    await sleep(8000);
    const p = await (await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`)).json();
    status = p.data?.status || "UNKNOWN";
    console.log(`[Apify] ${runId} → ${status}`);
    if (status === "SUCCEEDED") break;
    if (["FAILED","ABORTED","TIMED-OUT"].includes(status)) throw new Error(`Run ${status}`);
  }
  if (status !== "SUCCEEDED") throw new Error("Apify timed out");

  const runData   = await (await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`)).json();
  const dsId      = runData.data?.defaultDatasetId;
  const itemsRes  = await fetch(`https://api.apify.com/v2/datasets/${dsId}/items?token=${APIFY_TOKEN}&format=json&clean=true`);
  const items     = await itemsRes.json();
  return Array.isArray(items) ? items : [];
}

// ── Scheduled function config ─────────────────────────────────────────────────
export const config = { schedule: "30 2 * * *" };  // 8:00 AM IST

// ── Main handler ──────────────────────────────────────────────────────────────
export default async (req, context) => {
  console.log("=== StylerCRM daily-stylist started ===");

  const historyStore = getStore("sent-history");
  const dataStore    = getStore("stylist-data");

  // Load 30-day sent history
  let sentHistory = {};
  try {
    sentHistory = (await historyStore.getJSON("history")) || {};
  } catch (e) { console.warn("[History] Could not load:", e.message); }

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  // Clean old entries
  for (const [h, ts] of Object.entries(sentHistory)) {
    if (ts < thirtyDaysAgo) delete sentHistory[h];
  }
  const alreadySent = new Set(Object.keys(sentHistory));
  console.log(`[History] ${alreadySent.size} handles sent in last 30 days`);

  // ── Build balanced daily list: 5 Senior + 8 Junior + 2 Intern ───────────
  const today = new Date();
  const seed  = today.getUTCFullYear() * 1000 + Math.floor((today - new Date(today.getUTCFullYear(), 0, 0)) / 86400000);

  // Filter unsent by category
  let unsentSenior = CURATED.filter(s => s.des === "Senior" && !alreadySent.has(s.handle.toLowerCase()));
  let unsentJunior = CURATED.filter(s => s.des === "Junior" && !alreadySent.has(s.handle.toLowerCase()));
  let unsentIntern = CURATED.filter(s => s.des === "Intern" && !alreadySent.has(s.handle.toLowerCase()));

  // Auto-reset a category if it's exhausted
  if (unsentSenior.length < 3) {
    console.log("[History] Senior pool exhausted — resetting senior history");
    unsentSenior = CURATED.filter(s => s.des === "Senior");
    for (const s of unsentSenior) delete sentHistory[s.handle.toLowerCase()];
  }
  if (unsentJunior.length < 5) {
    console.log("[History] Junior pool exhausted — resetting junior history");
    unsentJunior = CURATED.filter(s => s.des === "Junior");
    for (const s of unsentJunior) delete sentHistory[s.handle.toLowerCase()];
  }
  if (unsentIntern.length < 2) {
    console.log("[History] Intern pool exhausted — resetting intern history");
    unsentIntern = CURATED.filter(s => s.des === "Intern");
    for (const s of unsentIntern) delete sentHistory[s.handle.toLowerCase()];
  }

  // Seeded shuffle each category separately for variety
  const picks = [
    ...seededShuffle(unsentSenior, seed).slice(0, 5),
    ...seededShuffle(unsentJunior, seed + 1).slice(0, 8),
    ...seededShuffle(unsentIntern, seed + 2).slice(0, 2),
  ];
  const todayList = picks.map((s, i) => ({ ...s, id: i + 1 }));

  console.log(`[List] ${todayList.length} stylists — Senior:${picks.filter(s=>s.des==="Senior").length} Junior:${picks.filter(s=>s.des==="Junior").length} Intern:${picks.filter(s=>s.des==="Intern").length}`);


  // Update sent history
  for (const s of todayList) {
    sentHistory[s.handle.toLowerCase()] = Date.now();
  }
  try {
    await historyStore.setJSON("history", sentHistory);
    await dataStore.setJSON("today", { stylists: todayList, updatedAt: Date.now(), source: "curated" });
    console.log("[Blobs] Saved today's list and history");
  } catch (e) {
    console.error("[Blobs] Save failed:", e.message);
  }

  // ── Build message ─────────────────────────────────────────────────────────
  const dateStr = today.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata", weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const sourceNote = "Verified Indian Celebrity Stylists";

  let htmlMsg = `<b>StylerCRM — Daily Stylist List</b>\n`;
  htmlMsg += `Date: ${dateStr}\n`;
  htmlMsg += `Source: ${sourceNote}\n`;
  htmlMsg += `${"─".repeat(26)}\n\n`;

  let plainMsg = `StylerCRM - Daily Stylist List\nDate: ${dateStr}\n\n`;

  todayList.forEach((s, i) => {
    const igLink = `https://www.instagram.com/${s.handle}/`;
    htmlMsg  += `<b>${i+1}. ${s.name}</b>  |  ${s.des}\n`;
    htmlMsg  += `   <a href="${igLink}">instagram.com/${s.handle}</a>\n`;
    htmlMsg  += `   Followers: ${fmt(s.followers)}\n`;
    if (s.collabs?.length) htmlMsg += `   Celebs: ${s.collabs.slice(0,3).join(" · ")}\n`;
    htmlMsg  += `\n`;

    // WhatsApp: use @handle so user can search directly in Instagram app
    plainMsg += `${i+1}. ${s.name} | ${s.des}\n`;
    plainMsg += `   📸 @${s.handle}\n`;
    plainMsg += `   👥 ${fmt(s.followers)} followers\n`;
    if (s.collabs?.length) plainMsg += `   🎬 ${s.collabs.slice(0,3).join(", ")}\n`;
    plainMsg += `\n`;
  });

  htmlMsg  += `Total: ${todayList.length} | CRM: https://boisterous-empanada-fc858b.netlify.app/`;
  plainMsg += `Total: ${todayList.length}\nCRM: https://boisterous-empanada-fc858b.netlify.app/`;

  // Build HTML email body
  const emailHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body{font-family:Arial,sans-serif;background:#f9f5ff;margin:0;padding:20px}
  .card{background:#fff;border-radius:12px;padding:20px;margin-bottom:12px;border-left:4px solid #a855f7;box-shadow:0 2px 8px rgba(0,0,0,0.08)}
  .name{font-size:16px;font-weight:bold;color:#1a1a2e}
  .des{background:#ede9fe;color:#7c3aed;padding:2px 8px;border-radius:10px;font-size:12px;margin-left:8px}
  .ig a{color:#a855f7;text-decoration:none;font-size:14px}
  .meta{color:#666;font-size:13px;margin-top:4px}
  .header{background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;padding:20px;border-radius:12px;margin-bottom:20px;text-align:center}
  .footer{text-align:center;color:#999;font-size:12px;margin-top:20px}
</style></head><body>
<div class="header">
  <h2 style="margin:0">StylerCRM Daily Stylist List</h2>
  <p style="margin:4px 0 0">${dateStr}</p>
  <p style="margin:4px 0 0;opacity:0.85;font-size:13px">${sourceNote}</p>
</div>
${todayList.map((s, i) => `
<div class="card">
  <div class="name">${i+1}. ${s.name} <span class="des">${s.des}</span></div>
  <div class="ig"><a href="https://www.instagram.com/${s.handle}/">instagram.com/${s.handle}</a></div>
  <div class="meta">Followers: ${fmt(s.followers)}${s.collabs?.length ? ` &nbsp;|&nbsp; Celebs: ${s.collabs.slice(0,3).join(", ")}` : ""}</div>
</div>`).join("")}
<div class="footer">
  <a href="https://boisterous-empanada-fc858b.netlify.app/" style="color:#a855f7">Open CRM Dashboard</a>
</div>
</body></html>`;

  // Send all channels in parallel
  await Promise.allSettled([
    sendWhatsAppTwilio(plainMsg),
    sendTelegram(htmlMsg),
  ]);

  console.log("=== Run complete ===");
  return new Response("Daily list sent!", { status: 200 });
};
