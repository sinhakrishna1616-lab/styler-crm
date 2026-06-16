/**
 * test-telegram.mjs
 * One-off test: sends a single Telegram message to verify TELEGRAM_TOKEN + CHAT_ID work.
 * This is NOT deployed — just used to test from Netlify functions invoke.
 */

export default async (req, context) => {
  const TELEGRAM_TOKEN   = process.env.TELEGRAM_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  const APIFY_TOKEN      = process.env.APIFY_TOKEN;

  const istTime = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  const msg = [
    "✅ *StylerCRM Test Message*",
    "",
    `🕐 Time (IST): ${istTime}`,
    "",
    `🔑 TELEGRAM\\_TOKEN: ${TELEGRAM_TOKEN ? "✅ Set (" + TELEGRAM_TOKEN.slice(0,10) + "...)" : "❌ MISSING"}`,
    `🔑 TELEGRAM\\_CHAT\\_ID: ${TELEGRAM_CHAT_ID ? "✅ Set" : "❌ MISSING"}`,
    `🔑 APIFY\\_TOKEN: ${APIFY_TOKEN ? "✅ Set (" + APIFY_TOKEN.slice(0,8) + "...)" : "⚠️ NOT SET — add it in Netlify dashboard"}`,
    "",
    "🎉 Your StylerCRM daily delivery system is live!",
    "📅 Real data will arrive every day at *8:00 AM IST*",
    "",
    "🔗 https://boisterous\\-empanada\\-fc858b\\.netlify\\.app/",
  ].join("\n");

  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
    return new Response(
      JSON.stringify({ error: "Missing Telegram credentials", token: !!TELEGRAM_TOKEN, chat: !!TELEGRAM_CHAT_ID }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: msg,
      parse_mode: "MarkdownV2",
      disable_web_page_preview: true,
    }),
  });

  const json = await res.json();
  return new Response(
    JSON.stringify({ ok: json.ok, telegram_response: json }),
    { status: json.ok ? 200 : 500, headers: { "Content-Type": "application/json" } }
  );
};
