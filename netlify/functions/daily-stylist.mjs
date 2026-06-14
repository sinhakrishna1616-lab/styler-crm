const STYLISTS = [
  {name:"Abhilasha Devnani",handle:"abhilashadevnani",followers:"124K",des:"Senior",collabs:"Vicky Kaushal, Sidharth Malhotra, Ranveer Singh"},
  {name:"Edward Lalrempuia",handle:"edwardlalr",followers:"210K",des:"Senior",collabs:"Salman Khan, Shah Rukh Khan, Varun Dhawan"},
  {name:"Mohit Rai",handle:"mohitraistylist",followers:"67K",des:"Senior",collabs:"Salman Khan, Sanjay Dutt, Bobby Deol"},
  {name:"Tanya Ghavri",handle:"tanyaghavri",followers:"156K",des:"Senior",collabs:"Vicky Kaushal, Kartik Aaryan, Karan Johar"},
  {name:"Krishnaraj Rai",handle:"krishnaraj_rai",followers:"89K",des:"Senior",collabs:"Ranveer Singh, Ranbir Kapoor, Tiger Shroff"},
  {name:"Zara Sheikh",handle:"zarasheikh.style",followers:"63K",des:"Junior",collabs:"Diljit Dosanjh, AP Dhillon, Guru Randhawa"},
  {name:"Neel Chauhan",handle:"neelcstyle",followers:"88K",des:"Junior",collabs:"KL Rahul, Hardik Pandya, Shubman Gill"},
  {name:"Tanisha Bose",handle:"tanishabosestyle",followers:"82K",des:"Senior",collabs:"Arijit Singh, Armaan Malik, Darshan Raval"},
  {name:"Priya Dewan",handle:"priyadewan.style",followers:"145K",des:"Senior",collabs:"Hrithik Roshan, Ranbir Kapoor, Farhan Akhtar"},
  {name:"Aryan Khosla",handle:"aryankhosla.style",followers:"93K",des:"Senior",collabs:"Salman Khan, Arbaaz Khan, Sohail Khan"},
];

export default async () => {
  const TOKEN = process.env.TELEGRAM_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  let msg = `✨ *StylerCRM — Daily List*\n📅 ${today}\n${"─".repeat(22)}\n\n`;

  STYLISTS.forEach((s, i) => {
    msg += `${i + 1}\\. *${s.name}* · ${s.des}\n`;
    msg += `📱 [instagram\\.com/${s.handle}](https://instagram.com/${s.handle})\n`;
    msg += `👥 ${s.followers} followers\n`;
    msg += `🎬 ${s.collabs}\n\n`;
  });

  msg += `_Sent by StylerCRM 🤖_`;

  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: msg,
      parse_mode: "MarkdownV2"
    })
  });

  return new Response("Daily list sent!", { status: 200 });
};

export const config = {
  schedule: "30 2 * * *"
};
