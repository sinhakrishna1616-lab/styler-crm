/**
 * get-stylists.mjs
 * StylerCRM — HTTP API endpoint
 *
 * GET  /.netlify/functions/get-stylists
 *   → Returns today's stylist list + all saved statuses
 *
 * POST /.netlify/functions/get-stylists
 *   → Body: { id: number, status: string | null }
 *   → Persists a stylist's status to Netlify Blobs
 *   → Returns { ok: true }
 */

import { getStore } from "@netlify/blobs";

// ── Same curated list as daily-stylist.mjs ────────────────────────────────────
const CURATED_STYLISTS = [
  { name:"Shaleena Nathani",      handle:"shaleenanathani",       followers:320000, des:"Senior", collabs:["Shah Rukh Khan","Ranbir Kapoor","Aamir Khan","Aditya Roy Kapoor"] },
  { name:"Ami Patel",             handle:"stylebyami",            followers:267000, des:"Senior", collabs:["Hrithik Roshan","Tiger Shroff","Kartik Aaryan","Varun Dhawan"] },
  { name:"Edward Lalrempuia",     handle:"edwardlalr",            followers:210000, des:"Senior", collabs:["Salman Khan","Shah Rukh Khan","Akshay Kumar","Varun Dhawan"] },
  { name:"Tanya Ghavri",          handle:"tanyaghavri",           followers:156000, des:"Senior", collabs:["Karan Johar","Vicky Kaushal","Sidharth Malhotra","Kartik Aaryan"] },
  { name:"Anaita Shroff Adajania",handle:"anaitashroffadajania",  followers:198000, des:"Senior", collabs:["Shah Rukh Khan","Farhan Akhtar","Imran Khan","Ranbir Kapoor"] },
  { name:"Priya Dewan",           handle:"priyadewan.style",      followers:145000, des:"Senior", collabs:["Hrithik Roshan","Ranbir Kapoor","Farhan Akhtar","Siddhanth Chaturvedi"] },
  { name:"Abhilasha Devnani",     handle:"abhilashadevnani",      followers:124000, des:"Senior", collabs:["Vicky Kaushal","Sidharth Malhotra","Shahid Kapoor","Ranveer Singh"] },
  { name:"Sukriti Grover",         handle:"sukritigrover",         followers:178000, des:"Senior", collabs:["Ranveer Singh","Ranbir Kapoor","Aditya Roy Kapoor"] },
  { name:"Poornamrta Singh",       handle:"poornamrtasingh",       followers:156000, des:"Senior", collabs:["Ranveer Singh","Ranbir Kapoor","Vicky Kaushal"] },
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
  { name:"Aadi Pinkcity",         handle:"aadipinkcity",          followers:68000,  des:"Junior", collabs:["Diljit Dosanjh","Ammy Virk","Gippy Grewal"] },
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
  { name:"Payal Jagwani",         handle:"payaljagwani",           followers:38000,  des:"Intern", collabs:["Mohsin Khan","Parth Samthaan"] },
  { name:"Riya Mehta",            handle:"riya.mehta.style",       followers:35000,  des:"Intern", collabs:["Darshan Raval","Tony Kakkar"] },
  { name:"Simran Khanna",         handle:"simrankhanna.style",     followers:41000,  des:"Intern", collabs:["Karan Wahi","Ssharad Malhotra"] },
  { name:"Anushka Joshi",         handle:"anushkajoshi.fashion",   followers:33000,  des:"Intern", collabs:["Rohan Mehra","Vishal Aditya Singh"] },
];

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

/** Compute today's balanced 15 stylists: 5 Senior + 8 Junior + 2 Intern */
function getTodaysCurated() {
  const now  = new Date();
  const seed = now.getUTCFullYear() * 1000 + Math.floor((now - new Date(Date.UTC(now.getUTCFullYear(), 0, 0))) / 86400000);

  const seniors = seededShuffle(CURATED_STYLISTS.filter(s => s.des === "Senior"), seed).slice(0, 5);
  const juniors = seededShuffle(CURATED_STYLISTS.filter(s => s.des === "Junior"), seed + 1).slice(0, 8);
  const interns = seededShuffle(CURATED_STYLISTS.filter(s => s.des === "Intern"), seed + 2).slice(0, 2);

  return [...seniors, ...juniors, ...interns].map((s, i) => ({ ...s, id: i + 1 }));
}

export default async (req, context) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const statusStore = getStore("stylist-statuses");

  // ── POST: save a status ──────────────────────────────────────────────────────
  if (req.method === "POST") {
    try {
      const body = await req.json();
      const { id, status } = body;
      if (typeof id !== "number") {
        return new Response(JSON.stringify({ error: "id must be a number" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === null || status === undefined || status === "") {
        await statusStore.delete(String(id));
      } else {
        await statusStore.set(String(id), status);
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("[get-stylists POST]", err.message);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // ── GET: return today's list + statuses ─────────────────────────────────────
  try {
    // Try Blobs first (if daily-stylist saved fresh data there)
    let stylists  = null;
    let updatedAt = null;
    let source    = "curated";

    try {
      const dataStore = getStore("stylist-data");
      const cached    = await dataStore.getJSON("today");
      if (cached && Array.isArray(cached.stylists) && cached.stylists.length > 0) {
        // Only use Blobs if data is from today (within last 12 hours)
        const ageMs   = Date.now() - (cached.updatedAt || 0);
        const isFresh = ageMs < 12 * 60 * 60 * 1000;
        if (isFresh) {
          stylists  = cached.stylists;
          updatedAt = cached.updatedAt;
          source    = cached.source || "curated";
        } else {
          console.log("[get-stylists] Blobs data stale, using live computation");
        }
      }
    } catch (e) {
      console.warn("[get-stylists] Blobs read failed, using rotation:", e.message);
    }

    // Fallback: compute today's balanced 15 from curated list
    if (!stylists) {
      stylists = getTodaysCurated();
      source   = "curated";
    }

    // Load all statuses
    const statuses = {};
    try {
      const { blobs } = await statusStore.list();
      await Promise.all(
        blobs.map(async (b) => {
          const val = await statusStore.get(b.key);
          if (val) statuses[Number(b.key)] = val;
        })
      );
    } catch (e) {
      console.warn("[get-stylists] Could not load statuses:", e.message);
    }

    return new Response(
      JSON.stringify({ stylists, statuses, updatedAt, source }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
      }
    );
  } catch (err) {
    console.error("[get-stylists GET]", err.message);
    const fallback = getTodaysCurated();
    return new Response(
      JSON.stringify({ stylists: fallback, statuses: {}, source: "curated" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

