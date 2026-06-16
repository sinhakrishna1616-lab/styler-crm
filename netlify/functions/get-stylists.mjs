/**
 * get-stylists.mjs
 * StylerCRM — HTTP API endpoint
 *
 * GET  /.netlify/functions/get-stylists
 *   → Returns today's scraped stylist list + all saved statuses
 *
 * POST /.netlify/functions/get-stylists
 *   → Body: { id: number, status: string | null }
 *   → Persists a stylist's status to Netlify Blobs
 *   → Returns { ok: true }
 */

import { getStore } from "@netlify/blobs";

// Emergency fallback — shown on first deploy before the first scheduled run
const FALLBACK_STYLISTS = [
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
  {id:11,name:"Zara Sheikh",handle:"zarasheikh.style",followers:63000,des:"Junior",collabs:["Diljit Dosanjh","Badshah","AP Dhillon","Guru Randhawa","Harrdy Sandhu"]},
  {id:12,name:"Neel Chauhan",handle:"neelcstyle",followers:88000,des:"Junior",collabs:["KL Rahul","Hardik Pandya","Rohit Sharma","Shubman Gill","Ishan Kishan"]},
  {id:13,name:"Tanisha Bose",handle:"tanishabosestyle",followers:82000,des:"Junior",collabs:["Arijit Singh","Jubin Nautiyal","Armaan Malik","Darshan Raval","B Praak"]},
  {id:14,name:"Mihir Dave",handle:"mihir.dave.style",followers:58000,des:"Junior",collabs:["Dulquer Salmaan","Tovino Thomas","Nivin Pauly","Fahadh Faasil","Mohanlal"]},
  {id:15,name:"Siddharth Arora",handle:"sidarora.fashion",followers:54000,des:"Junior",collabs:["Vijay Deverakonda","Ram Charan","NTR Jr","Allu Arjun","Prabhas"]},
  {id:16,name:"Radhika Mehra",handle:"radhika.stylist",followers:78000,des:"Junior",collabs:["Kartik Aaryan","Tiger Shroff","Ishaan Khattar","Adarsh Gourav","Vijay Varma"]},
  {id:17,name:"Aakash Mehta",handle:"aakashmstyle",followers:52000,des:"Junior",collabs:["Ayushmann Khurrana","Rajkummar Rao","Jaideep Ahlawat","Manoj Bajpayee","Nawazuddin Siddiqui"]},
  {id:18,name:"Aryan Khosla",handle:"aryankhosla.style",followers:93000,des:"Junior",collabs:["Salman Khan","Sohail Khan","Arbaaz Khan","Zaheer Iqbal"]},
  {id:19,name:"Divya Kapoor",handle:"divyakstyles",followers:112000,des:"Senior",collabs:["Varun Dhawan","Arjun Kapoor","Aparshakti Khurana","Varun Sharma","Jitendra Kumar"]},
  {id:20,name:"Anisha Oberoi",handle:"anishaoberostyle",followers:97000,des:"Junior",collabs:["Hrithik Roshan","Tiger Shroff","Shahid Kapoor","Aditya Roy Kapoor","Ranbir Kapoor"]},
];

export default async (req, context) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const dataStore    = getStore("stylist-data");
  const statusStore  = getStore("stylist-statuses");

  // ── POST: save a status ─────────────────────────────────────────────────────
  if (req.method === "POST") {
    try {
      const body = await req.json();
      const { id, status } = body;

      if (typeof id !== "number") {
        return new Response(JSON.stringify({ error: "id must be a number" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (status === null || status === undefined || status === "") {
        await statusStore.delete(String(id));
      } else {
        await statusStore.set(String(id), status);
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("[get-stylists POST]", err.message);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // ── GET: return today's list + all statuses ────────────────────────────────
  try {
    // Load stylists
    let stylists = FALLBACK_STYLISTS;
    let updatedAt = null;
    let source = "fallback";

    try {
      const cached = await dataStore.getJSON("today");
      if (cached && Array.isArray(cached.stylists) && cached.stylists.length > 0) {
        stylists  = cached.stylists;
        updatedAt = cached.updatedAt;
        source    = cached.source || "apify";
      }
    } catch (e) {
      console.warn("[get-stylists] Could not load from Blobs:", e.message);
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
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (err) {
    console.error("[get-stylists GET]", err.message);
    return new Response(
      JSON.stringify({ stylists: FALLBACK_STYLISTS, statuses: {}, source: "fallback" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};
