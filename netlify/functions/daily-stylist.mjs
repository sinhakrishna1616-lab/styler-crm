const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const ALL_STYLISTS = [
  {name:"Abhilasha Devnani",handle:"abhilashadevnani",followers:"124K",des:"Senior",collabs:"Vicky Kaushal, Sidharth Malhotra, Ranveer Singh"},
  {name:"Edward Lalrempuia",handle:"edwardlalr",followers:"210K",des:"Senior",collabs:"Salman Khan, Shah Rukh Khan, Varun Dhawan"},
  {name:"Mohit Rai",handle:"mohitraistylist",followers:"67K",des:"Senior",collabs:"Salman Khan, Sanjay Dutt, Bobby Deol"},
  {name:"Tanya Ghavri",handle:"tanyaghavri",followers:"156K",des:"Senior",collabs:"Vicky Kaushal, Kartik Aaryan, Karan Johar"},
  {name:"Krishnaraj Rai",handle:"krishnaraj_rai",followers:"89K",des:"Senior",collabs:"Ranveer Singh, Ranbir Kapoor, Tiger Shroff"},
  {name:"Priya Dewan",handle:"priyadewan.style",followers:"145K",des:"Senior",collabs:"Hrithik Roshan, Ranbir Kapoor, Farhan Akhtar"},
  {name:"Aryan Khosla",handle:"aryankhosla.style",followers:"93K",des:"Senior",collabs:"Salman Khan, Arbaaz Khan, Sohail Khan"},
  {name:"Divya Kapoor",handle:"divyakstyles",followers:"112K",des:"Senior",collabs:"Varun Dhawan, Arjun Kapoor, Aparshakti Khurana"},
  {name:"Anisha Oberoi",handle:"anishaoberostyle",followers:"97K",des:"Senior",collabs:"Hrithik Roshan, Tiger Shroff, Shahid Kapoor"},
  {name:"Meera Rajkumar",handle:"meerarajkstyle",followers:"68K",des:"Senior",collabs:"Rajkummar Rao, Pankaj Tripathi, Manoj Bajpayee"},
  {name:"Tanisha Bose",handle:"tanishabosestyle",followers:"82K",des:"Senior",collabs:"Arijit Singh, Armaan Malik, Darshan Raval"},
  {name:"Sukriti Grover",handle:"sukritigrover",followers:"178K",des:"Senior",collabs:"Ranveer Singh, Ranbir Kapoor, Aditya Roy Kapoor"},
  {name:"Shaleena Nathani",handle:"shaleenanathani",followers:"320K",des:"Senior",collabs:"Shah Rukh Khan, Ranbir Kapoor, Aamir Khan"},
  {name:"Ami Patel",handle:"stylebyami",followers:"267K",des:"Senior",collabs:"Hrithik Roshan, Tiger Shroff, Kartik Aaryan"},
  {name:"Anaita Shroff Adajania",handle:"anaitashroffadajania",followers:"198K",des:"Senior",collabs:"Shah Rukh Khan, Farhan Akhtar, Imran Khan"},
  {name:"Nisha Jhangiani",handle:"nishajangianidesign",followers:"54K",des:"Senior",collabs:"Akshay Kumar, John Abraham, Suniel Shetty"},
  {name:"Rhea Kapoor",handle:"rheakapoor",followers:"890K",des:"Senior",collabs:"Anil Kapoor, Arjun Kapoor, Harsh Varrdhan Kapoor"},
  {name:"Eka Lakhani",handle:"ekalakhani",followers:"76K",des:"Senior",collabs:"Vicky Kaushal, Sidharth Malhotra, Aditya Roy Kapoor"},
  {name:"Lakshmi Lehr",handle:"lakshmilehr",followers:"63K",des:"Senior",collabs:"Ranveer Singh, Ranbir Kapoor, Shahid Kapoor"},
  {name:"Nikhil Mansata",handle:"nikhilmansata",followers:"58K",des:"Senior",collabs:"Ayushmann Khurrana, Rajkummar Rao, Vikrant Massey"},
  {name:"Zara Sheikh",handle:"zarasheikh.style",followers:"63K",des:"Junior",collabs:"Diljit Dosanjh, AP Dhillon, Guru Randhawa"},
  {name:"Neel Chauhan",handle:"neelcstyle",followers:"88K",des:"Junior",collabs:"KL Rahul, Hardik Pandya, Shubman Gill"},
  {name:"Radhika Mehra",handle:"radhika.stylist",followers:"78K",des:"Junior",collabs:"Kartik Aaryan, Tiger Shroff, Ishaan Khattar"},
  {name:"Aakash Mehta",handle:"aakashmstyle",followers:"52K",des:"Junior",collabs:"Ayushmann Khurrana, Rajkummar Rao, Jaideep Ahlawat"},
  {name:"Karan Ahuja",handle:"karanahuja.fashion",followers:"61K",des:"Junior",collabs:"Kapil Sharma, Sunil Grover, Krushna Abhishek"},
  {name:"Shreya Jain",handle:"shreyajain.style",followers:"71K",des:"Junior",collabs:"Ranveer Singh, Aparshakti Khurana, Varun Sharma"},
  {name:"Kabir Nagpal",handle:"kabirnagpal",followers:"74K",des:"Junior",collabs:"Karan Aujla, AP Dhillon, King"},
  {name:"Mihir Dave",handle:"mihir.dave.style",followers:"58K",des:"Junior",collabs:"Dulquer Salmaan, Tovino Thomas, Nivin Pauly"},
  {name:"Siddharth Arora",handle:"sidarora.fashion",followers:"54K",des:"Junior",collabs:"Vijay Deverakonda, Ram Charan, Allu Arjun"},
  {name:"Prateek Sharma",handle:"prateekstylist",followers:"67K",des:"Junior",collabs:"Guru Randhawa, Badshah, Harrdy Sandhu"},
  {name:"Aanya Mehrotra",handle:"aanyamehrotra.style",followers:"59K",des:"Junior",collabs:"Ishaan Khattar, Adarsh Gourav, Vijay Varma"},
  {name:"Rohan Shrestha",handle:"rohanshrestha",followers:"612K",des:"Junior",collabs:"Ranbir Kapoor, Sidharth Malhotra, Aditya Roy Kapoor"},
  {name:"Sanam Ratansi",handle:"sanamratansi",followers:"83K",des:"Junior",collabs:"Varun Dhawan, Kartik Aaryan, Tiger Shroff"},
  {name:"Zeeshan Khan",handle:"zeeshankhan.style",followers:"55K",des:"Junior",collabs:"Nawazuddin Siddiqui, Pankaj Tripathi, Manoj Bajpayee"},
  {name:"Priya Kakkar",handle:"priyakakkar_stylist",followers:"69K",des:"Junior",collabs:"Diljit Dosanjh, Gippy Grewal, Ammy Virk"},
  {name:"Aarushi Bhatt",handle:"aarushi.styles",followers:"57K",des:"Junior",collabs:"Shubman Gill, Ishan Kishan, Prithvi Shaw"},
  {name:"Dev Narayan",handle:"devnarayan.style",followers:"62K",des:"Junior",collabs:"Vicky Kaushal, Sunny Kaushal, Abhimanyu Dassani"},
  {name:"Kritika Aggarwal",handle:"kritikaaggarwal.style",followers:"73K",des:"Junior",collabs:"Arjun Kapoor, Varun Sharma, Jitendra Kumar"},
  {name:"Sanya Kapoor",handle:"sanyakapoor.fashion",followers:"66K",des:"Junior",collabs:"Armaan Malik, Jubin Nautiyal, Darshan Raval"},
  {name:"Yash Tripathi",handle:"yashtripathistylist",followers:"51K",des:"Junior",collabs:"Ayushmann Khurrana, Aparshakti Khurana, Abhishek Banerjee"},
  {name:"Nikita Jaisinghani",handle:"nikitajaisinghani",followers:"91K",des:"Senior",collabs:"Akshay Kumar, Varun Dhawan, Sidharth Malhotra"},
  {name:"Aastha Sharma",handle:"aasthasharma.style",followers:"84K",des:"Senior",collabs:"Kartik Aaryan, Tiger Shroff, Aditya Roy Kapoor"},
  {name:"Poornamrita Singh",handle:"poornamritasingh",followers:"156K",des:"Senior",collabs:"Ranveer Singh, Ranbir Kapoor, Vicky Kaushal"},
  {name:"Sheefa J Gilani",handle:"sheefajgilani",followers:"127K",des:"Senior",collabs:"Salman Khan, Arbaaz Khan, Sohail Khan"},
  {name:"Maneka Harisinghani",handle:"manekaharisinghani",followers:"143K",des:"Senior",collabs:"Shah Rukh Khan, Aamir Khan, Saif Ali Khan"},
  {name:"Chandni Bhatt",handle:"chandni.stylist",followers:"79K",des:"Senior",collabs:"Hrithik Roshan, Tiger Shroff, Farhan Akhtar"},
  {name:"Aadi Pinkcity",handle:"aadipinkcity",followers:"68K",des:"Senior",collabs:"Diljit Dosanjh, Ammy Virk, Gippy Grewal"},
  {name:"Hitendra Kapopara",handle:"hitendrakapopara",followers:"95K",des:"Senior",collabs:"Ranveer Singh, Varun Dhawan, Kartik Aaryan"},
  {name:"Sanjana Batra",handle:"sanjanabatra",followers:"87K",des:"Senior",collabs:"Vicky Kaushal, Sidharth Malhotra, Aditya Roy Kapoor"},
  {name:"Vikram Raizada",handle:"vikramraizada.style",followers:"73K",des:"Senior",collabs:"KL Rahul, Hardik Pandya, Rohit Sharma"},
  {name:"Dolly Singh",handle:"dollysingh",followers:"1.2M",des:"Senior",collabs:"Badshah, Yo Yo Honey Singh, Raftaar"},
  {name:"Punit Balana",handle:"punitbalana",followers:"89K",des:"Senior",collabs:"AP Dhillon, Gurinder Gill, Shubh"},
  {name:"Rohit Verma",handle:"rohitvermaworld",followers:"234K",des:"Senior",collabs:"Mika Singh, Yo Yo Honey Singh, Divine"},
  {name:"Meiyang Chang",handle:"meiyang.chang",followers:"456K",des:"Senior",collabs:"Arijit Singh, Armaan Malik, Darshan Raval"},
  {name:"Neha Thakur",handle:"nehathakur.style",followers:"83K",des:"Junior",collabs:"Guru Randhawa, Harrdy Sandhu, Millind Gaba"},
  {name:"Ishaan Arora",handle:"ishaanarorastyle",followers:"71K",des:"Junior",collabs:"Virat Kohli, KL Rahul, Hardik Pandya"},
  {name:"Prerna Garg",handle:"prernagarg.fashion",followers:"64K",des:"Junior",collabs:"Shubman Gill, Ishan Kishan, Sanju Samson"},
  {name:"Sanjay Gurbaxani",handle:"sanjaygurbaxani",followers:"92K",des:"Senior",collabs:"Rohit Sharma, MS Dhoni, Virat Kohli"},
  {name:"Richa Roy",handle:"richaroystylist",followers:"58K",des:"Junior",collabs:"KL Rahul, Hardik Pandya, Krunal Pandya"},
  {name:"Tanvi Bhatt",handle:"tanvibhatt.style",followers:"67K",des:"Junior",collabs:"Suryakumar Yadav, Rishabh Pant, Shreyas Iyer"},
  {name:"Prashanti Tipirneni",handle:"prashantitipirneni",followers:"123K",des:"Senior",collabs:"Allu Arjun, Ram Charan, NTR Jr"},
  {name:"Harmann Kaur",handle:"harmannkaur",followers:"89K",des:"Senior",collabs:"Vijay Deverakonda, Dulquer Salmaan, Tovino Thomas"},
  {name:"Mahesh Sheratt",handle:"mahesh_sheratt",followers:"76K",des:"Senior",collabs:"Mohanlal, Mammootty, Fahadh Faasil"},
  {name:"Subhashini Suresh",handle:"subhashinisuresh",followers:"54K",des:"Junior",collabs:"Dhanush, Silambarasan, Jayam Ravi"},
  {name:"Archana Rao",handle:"archanarao.style",followers:"61K",des:"Junior",collabs:"Prabhas, Rana Daggubati, Nithiin"},
  {name:"Swapnil Shinde",handle:"swapnilshinde",followers:"167K",des:"Senior",collabs:"Mohit Raina, Nakuul Mehta, Shaheer Sheikh"},
  {name:"Sanjana Muttoo",handle:"sanjanamuttoo",followers:"134K",des:"Senior",collabs:"Harshad Chopda, Kushal Tandon, Karan Singh Grover"},
  {name:"Natasha Kotak",handle:"natashakotak",followers:"87K",des:"Junior",collabs:"Sidharth Shukla, Asim Riaz, Paras Chhabra"},
  {name:"Nidhi Moony Singh",handle:"nidhimoonysingh",followers:"312K",des:"Senior",collabs:"Gurmeet Choudhary, Raqesh Bapat, Vivian Dsena"},
  {name:"Puja Sheth",handle:"pujasheth",followers:"93K",des:"Senior",collabs:"Vicky Kaushal, Sidharth Malhotra, Varun Dhawan"},
  {name:"Shubhika Davda",handle:"shubhikadavda",followers:"78K",des:"Senior",collabs:"Hrithik Roshan, Tiger Shroff, Aditya Roy Kapoor"},
  {name:"Pallavi Mohan",handle:"pallavimohan",followers:"89K",des:"Senior",collabs:"Shah Rukh Khan, Saif Ali Khan, Ranbir Kapoor"},
  {name:"Sumit Datta",handle:"sumitdatta",followers:"71K",des:"Senior",collabs:"Nawazuddin Siddiqui, Manoj Bajpayee, Pankaj Tripathi"},
];

export default async () => {
  const TOKEN = TELEGRAM_TOKEN;
  const CHAT_ID = TELEGRAM_CHAT_ID;

  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const startIdx = (dayOfYear * 10) % ALL_STYLISTS.length;
  
  const todayStylists = [];
  for (let i = 0; i < 10; i++) {
    todayStylists.push(ALL_STYLISTS[(startIdx + i) % ALL_STYLISTS.length]);
  }

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  let msg = `✨ *StylerCRM — Daily List*\n📅 ${today}\n${"─".repeat(22)}\n\n`;

  todayStylists.forEach((s, i) => {
    const name = s.name.replace(/[_*[\]()~`>#+=|{}.!-]/g, "\\$&");
    const collabs = s.collabs.replace(/[_*[\]()~`>#+=|{}.!-]/g, "\\$&");
    msg += `${i + 1}\\. *${name}* · ${s.des}\n`;
    msg += `📱 [instagram\\.com/${s.handle}](https://instagram.com/${s.handle})\n`;
    msg += `👥 ${s.followers} followers\n`;
    msg += `🎬 ${collabs}\n\n`;
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
