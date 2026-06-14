const STYLISTS = [
  {name:"Abhilasha Devnani",handle:"abhilashadevnani",followers:"124K",des:"Senior",collabs:"Vicky Kaushal, Sidharth Malhotra, Ranveer Singh"},
  {name:"Edward Lalrempuia",handle:"edwardlalr",followers:"210K",des:"Senior",collabs:"Salman Khan, Shah Rukh Khan, Varun Dhawan"},
];

export default async () => {
  const TOKEN = process.env.TELEGRAM_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: "StylerCRM Test Message! ✨",
      })
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({error: err.message}), { status: 500 });
  }
};

export const config = {
  schedule: "30 2 * * *"
};
