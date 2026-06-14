const APIFY_TOKEN = process.env.APIFY_KEY;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const HASHTAGS = [
  "bollywoodstylist",
  "malecelebstylist", 
  "menstylist",
  "celebritystylist",
  "bollywoodfashion"
];

export default async () => {
  try {
    // Apify pe Instagram scraper run karo
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/apify~instagram-hashtag-scraper/runs?token=${APIFY_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hashtags: HASHTAGS,
          resultsLimit: 50,
          proxy: { useApifyProxy: true }
        })
      }
    );

    const runData = await runRes.json();
    const runId = runData.data?.id;

    if (!runId) {
      throw new Error("Apify run start nahi hua");
    }

    // 30 second wait karo scraping ke liye
    await new Promise(r => setTimeout(r, 30000));

    // Results lo
    const resultsRes = await fetch(
      `https://api.apify.com/v2/acts/apify~instagram-hashtag-scraper/runs/${runId}/dataset/items?token=${APIFY_TOKEN}&limit=50`
    );
    const results = await resultsRes.json();

    // Filter karo — stylists wale accounts
    const stylists = results
      .filter(item => 
        item.ownerUsername && 
        item.followersCount >= 50000 &&
        item.biography?.toLowerCase().includes("styl")
      )
      .slice(0, 10);

    const today = new Date().toLocaleDateString("en-IN", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    });

    let msg = `✨ *StylerCRM — Daily List*\n📅 ${today}\n${"─".repeat(22)}\n\n`;

    if (stylists.length > 0) {
      stylists.forEach((s, i) => {
        const name = s.fullName || s.ownerUsername;
        const handle = s.ownerUsername;
        const followers = s.followersCount >= 1000 
          ? Math.round(s.followersCount/1000) + "K" 
          : s.followersCount;
        
        msg += `${i + 1}\\. *${name}*\n`;
        msg += `📱 [instagram\\.com/${handle}](https://instagram.com/${handle})\n`;
        msg += `👥 ${followers} followers\n\n`;
      });
    } else {
      msg += `_Aaj koi naya stylist nahi mila — kal dobara try hoga\\._\n`;
    }

    msg += `_Sent by StylerCRM 🤖_`;

    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: msg,
        parse_mode: "MarkdownV2"
      })
    });

    return new Response("Done!", { status: 200 });

  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
};

export const config = {
  schedule: "30 2 * * *"
};
