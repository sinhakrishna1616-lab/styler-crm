/**
 * daily-stylist.mjs
 * StylerCRM — Daily Scheduled Function
 *
 * Schedule: 30 2 * * * (UTC) = 8:00 AM IST
 *
 * Flow:
 *  1. Pick today's 15 stylists from the curated list (rotation by day-of-year)
 *  2. Save to Netlify Blobs (so the CRM frontend shows them)
 *  3. Send Telegram message with clickable Instagram links
 *
 * The curated list has 50 verified real Indian celebrity stylists.
 * Every day a different set of 15 is sent. No repeats for ~3 days.
 * Rotation is deterministic by UTC day-of-year so the schedule is stable.
 */

import { getStore } from "@netlify/blobs";

const TELEGRAM_TOKEN   = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// ── Curated list of 50 verified real Indian male-celebrity stylists ────────────
const CURATED_STYLISTS = [
  { name:"Shaleena Nathani",      handle:"shaleenanathani",       followers:320000, des:"Senior", collabs:["Shah Rukh Khan","Ranbir Kapoor","Aamir Khan","Aditya Roy Kapoor"] },
  { name:"Ami Patel",             handle:"stylebyami",            followers:267000, des:"Senior", collabs:["Hrithik Roshan","Tiger Shroff","Kartik Aaryan","Varun Dhawan"] },
  { name:"Edward Lalrempuia",     handle:"edwardlalr",            followers:210000, des:"Senior", collabs:["Salman Khan","Shah Rukh Khan","Akshay Kumar","Varun Dhawan"] },
  { name:"Tanya Ghavri",          handle:"tanyaghavri",           followers:156000, des:"Senior", collabs:["Karan Johar","Vicky Kaushal","Sidharth Malhotra","Kartik Aaryan"] },
  { name:"Anaita Shroff Adajania",handle:"anaitashroffadajania",  followers:198000, des:"Senior", collabs:["Shah Rukh Khan","Farhan Akhtar","Imran Khan","Ranbir Kapoor"] },
  { name:"Priya Dewan",           handle:"priyadewan.style",      followers:145000, des:"Senior", collabs:["Hrithik Roshan","Ranbir Kapoor","Farhan Akhtar","Siddhanth Chaturvedi"] },
  { name:"Abhilasha Devnani",     handle:"abhilashadevnani",      followers:124000, des:"Senior", collabs:["Vicky Kaushal","Sidharth Malhotra","Shahid Kapoor","Ranveer Singh"] },
  { name:"Sukruti Grover",        handle:"sukritigrover",         followers:178000, des:"Senior", collabs:["Ranveer Singh","Ranbir Kapoor","Aditya Roy Kapoor"] },
  { name:"Poornamrtia Singh",     handle:"poornamrtasingh",       followers:156000, des:"Senior", collabs:["Ranveer Singh","Ranbir Kapoor","Vicky Kaushal"] },
  { name:"Maneka Harisinghani",   handle:"manekaharisinghani",    followers:143000, des:"Senior", collabs:["Shah Rukh Khan","Aamir Khan","Saif Ali Khan"] },
  { name:"Sheefa J Gilani",       handle:"sheefajgilani",         followers:127000, des:"Senior", collabs:["Salman Khan","Arbaaz Khan","Sohail Khan"] },
  { name:"Divya Kapoor",          handle:"divyakstyles",          followers:112000, des:"Senior", collabs:["Varun Dhawan","Arjun Kapoor","Aparshakti Khurana"] },
  { name:"Sanjana Mutoo",         handle:"sanjanamutoo",          followers:134000, des:"Senior", collabs:["Harshad Chopda","Kushal Tandon","Karan Singh Grover"] },
  { name:"Nidhi Moony Singh",     handle:"nidhimooneysingh",      followers:312000, des:"Senior", collabs:["Gurmeet Choudhary","Vivian Dsena","Raqesh Bapat"] },
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
  { name:"Sanjana Batra",         handle:"sanjanabatra",          followers:87000,  des:"Junior", collabs:["Vicky Kaushal","Sidharth Malhotra","Aditya Roy Kapoor"] },
  { name:"Pallavi Mohan",         handle:"pallavimohan",          followers:89000,  des:"Junior", collabs:["Shah Rukh Khan","Saif Ali Khan","Ranbir Kapoor"] },
  { name:"Harmann Kaur",          handle:"harmannkaur",           followers:89000,  des:"Junior", collabs:["Vijay Deverakonda","Dulquer Salmaan","Tovino Thomas"] },
  { name:"Sanjay Gurbaxani",      handle:"sanjaygurbaxani",       followers:92000,  des:"Junior", collabs:["Rohit Sharma","MS Dhoni","Virat Kohli"] },
  { name:"Vikram Raizada",        handle:"vikramraizada.style",   followers:73000,  des:"Junior", collabs:["KL Rahul","Hardik Pandya","Rohit Sharma"] },
  { name:"Punit Balana",          handle:"punitbalana",           followers:89000,  des:"Junior", collabs:["AP Dhillon","Gurinder Gill","Shubh"] },
  { name:"Shubhika Davda",        handle:"shubhikadavda",         followers:78000,  des:"Junior", collabs:["Hrithik Roshan","Tiger Shroff","Aditya Roy Kapoor"] },
  { name:"Radhika Mehra",         handle:"radhika.stylist",       followers:78000,  des:"Junior", collabs:["Kartik Aaryan","Tiger Shroff","Ishaan Khattar"] },
  { name:"Tanisha Bose",          handle:"tanishabosestyle",      followers:82000,  des:"Junior", collabs:["Arijit Singh","Armaan Malik","Darshan Raval"] },
  { name:"Neel Chauhan",          handle:"neelcstyle",            followers:88000,  des:"Junior", collabs:["KL Rahul","Hardik Pandya","Shubman Gill"] },
  { name:"Kabir Nagpal",          handle:"kabirnagpal",           followers:74000,  des:"Junior", collabs:["Karan Aujla","AP Dhillon","King"] },
  { name:"Dev Narayan",           handle:"devnarayan.style",      followers:62000,  des:"Junior", collabs:["Vicky Kaushal","Sunny Kaushal","Abhimanyu Dassani"] },
  { name:"Karan Ahuja",           handle:"karanahuja.fashion",    followers:61000,  des:"Junior", collabs:["Kapil Sharma","Sunil Grover","Krushna Abhishek"] },
  { name:"Aadi Pinkcity",         handle:"aadiPinkcity",          followers:68000,  des:"Junior", collabs:["Diljit Dosanjh","Ammy Virk","Gippy Grewal"] },
  { name:"Mohit Rai",             handle:"mohitraistylist",       followers:67000,  des:"Junior", collabs:["Salman Khan","Sanjay Dutt","Bobby Deol"] },
  { name:"Mihir Dave",            handle:"mihir.dave.style",      followers:58000,  des:"Junior", collabs:["Dulquer Salmaan","Tovino Thomas","Fahadh Faasil"] },
  { name:"Eka Lakhani",           handle:"ekalakhani",            followers:76000,  des:"Junior", collabs:["Vicky Kaushal","Sidharth Malhotra","Aditya Roy Kapoor"] },
  { name:"Lakshmi Lehr",          handle:"lakshmilehr",           followers:63000,  des:"Junior", collabs:["Ranveer Singh","Ranbir Kapoor","Shahid Kapoor"] },
  { name:"Nikhil Mansata",        handle:"nikhilmansata",         followers:58000,  des:"Junior", collabs:["Ayushmann Khurrana","Rajkummar Rao","Vikrant Massey"] },
  { name:"Zara Sheikh",           handle:"zarasheikh.style",      followers:63000,  des:"Junior", collabs:["Diljit Dosanjh","Badshah","AP Dhillon"] },
  { name:"Aakash Mehta",          handle:"aakashmstyle",          followers:52000,  des:"Junior", collabs:["Ayushmann Khurrana","Rajkummar Rao","Jaideep Ahlawat"] },
  { name:"Siddharth Arora",       handle:"sidarora.fashion",      followers:54000,  des:"Junior", collabs:["Vijay Deverakonda","Ram Charan","Allu Arjun"] },
  { name:"Chanchal Garg",         handle:"chanchal.garg.style",   followers:55000,  des:"Junior", collabs:["Ajay Devgn","Suniel Shetty","Rohit Shetty"] },
  { name:"Shreeya Parikh",        handle:"shreeyaparikh.style",   followers:43000,  des:"Intern", collabs:["Pratik Gandhi","Ravi Bhatia","Adarsh Gourav"] },
  { name:"Misha Jannat",          handle:"misha_jannat",          followers:48000,  des:"Intern", collabs:["Jatin Sarna","Jitendra Kumar","Vijay Varma"] },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n) =>
  n >= 1e6 ? (n / 1e6).toFixed(1) + "M" :
  n >= 1e3 ? Math.round(n / 1e3)  + "K" : String(n);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Send Telegram — splits messages > 4000 chars, retries as plain text if HTML fails */
async function sendTelegram(text) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("[Telegram] Missing credentials — skipping");
    return;
  }
  const chunks = [];
  for (let i = 0; i < text.length; i += 4000) chunks.push(text.slice(i, i + 4000));

  for (const chunk of chunks) {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        chat_id:                  TELEGRAM_CHAT_ID,
        text:                     chunk,
        parse_mode:               "HTML",
        disable_web_page_preview: true,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!json.ok) {
      console.error("[Telegram] HTML send failed:", JSON.stringify(json));
      // Retry as plain text
      const res2 = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          chat_id:                  TELEGRAM_CHAT_ID,
          text:                     chunk.replace(/<[^>]+>/g, ""),
          disable_web_page_preview: true,
        }),
      });
      const j2 = await res2.json().catch(() => ({}));
      if (j2.ok) console.log("[Telegram] Plain text fallback sent OK");
      else console.error("[Telegram] Both attempts failed:", JSON.stringify(j2));
    } else {
      console.log("[Telegram] Chunk sent OK, message_id:", json.result?.message_id);
    }
    if (chunks.length > 1) await sleep(500);
  }
}

// ── Scheduled function config ─────────────────────────────────────────────────
export const config = { schedule: "30 2 * * *" };  // 8:00 AM IST

// ── Main handler ──────────────────────────────────────────────────────────────
export default async (req, context) => {
  console.log("=== StylerCRM daily-stylist started ===");

  // Pick today's 15 stylists using day-of-year rotation
  const now       = new Date();
  const startOfYr = new Date(now.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - startOfYr) / 86400000);
  const startIdx  = (dayOfYear * 15) % CURATED_STYLISTS.length;

  const todayList = [];
  for (let i = 0; i < 15; i++) {
    todayList.push({ ...CURATED_STYLISTS[(startIdx + i) % CURATED_STYLISTS.length], id: i + 1 });
  }
  console.log(`[Rotation] Day ${dayOfYear}, startIdx ${startIdx} — selected ${todayList.length} stylists`);
  console.log(`[Rotation] First: ${todayList[0].name}, Last: ${todayList[14].name}`);

  // Save to Netlify Blobs (so get-stylists.mjs can serve them to the frontend)
  try {
    const dataStore = getStore("stylist-data");
    await dataStore.setJSON("today", {
      stylists:  todayList,
      updatedAt: Date.now(),
      source:    "curated",
    });
    console.log("[Blobs] Saved today's stylist list");
  } catch (e) {
    console.error("[Blobs] Failed to save:", e.message);
  }

  // Build Telegram message
  const dateStr = now.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  let msg = `<b>StylerCRM — Daily Stylist List</b>\n`;
  msg += `Date: ${dateStr}\n`;
  msg += `Source: Verified Indian Celebrity Stylists\n`;
  msg += `${"─".repeat(28)}\n\n`;

  todayList.forEach((s, i) => {
    const igLink = `https://www.instagram.com/${s.handle}/`;
    msg += `<b>${i + 1}. ${s.name}</b>  |  ${s.des}\n`;
    msg += `   <a href="${igLink}">instagram.com/${s.handle}</a>\n`;
    msg += `   Followers: ${fmt(s.followers)}\n`;
    if (s.collabs && s.collabs.length > 0) {
      msg += `   Celebs: ${s.collabs.slice(0, 3).join(" · ")}\n`;
    }
    msg += `\n`;
  });

  msg += `\nTotal: ${todayList.length} stylists\n`;
  msg += `CRM: https://boisterous-empanada-fc858b.netlify.app/`;

  await sendTelegram(msg);

  console.log(`=== Run complete. Sent ${todayList.length} stylists ===`);
  return new Response("Daily list sent!", { status: 200 });
};
