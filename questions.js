// ===== QUESTIONS — idhu mattum edit pannaa podhum =====
// Ovvoru question ku 4 options. Ovvoru option ku: label (text) + img (image / gif).
//
// img la 3 vidhama podalaam:
//   1) Un folder image : "images/biryani.webp"     (images folder la file podu)
//   2) GIF link        : "https://media.giphy.com/....gif"
//   3) Placeholder     : o("Biryani", "E8590C")   <- test ku mattum (color box)
//
// Real image podanum na:  { label: "Biryani", img: "images/biryani.webp" }

const o = (label, color) => ({
  label,
  img: `https://placehold.co/500x500/${color}/ffffff?text=${encodeURIComponent(label)}`
});

export const QUESTIONS = [
  { q: "Favourite food?",        options: [
    { label: "Biryani", img: "Image_res/biriyani.webp" },
    { label: "fried Rice",   img: "Image_res/rice.webp" },
    { label: "Dosa",    img: "Image_res/dosa.webp" },
    { label: "Parotta",  img: "Image_res/parotta.webp" }
  ] },
  { q: "Movie night?",           options: [
    { label: "Comedy", img: "Image_res/comedy.webp" },
    { label: "Romance",   img: "Image_res/romance.webp" },
    { label: "Horror",    img: "Image_res/scream.webp" },
    { label: "Action",  img: "Image_res/Action.webp" }
  ] },
  { q: "Favourite Cartoon",   options: [
    { label: "Shin Chan", img: "Image_res/shinchan.webp" },
    { label: "Doraemon",   img: "Image_res/doraemon.webp" },
    { label: "Jackie Chan",    img: "Image_res/jackie.webp" },
    { label: "Ben10",  img: "Image_res/ben10.webp" }
  ] },
  { q: "What's the most important thing in my life? ❤️",            options: [
    { label: "Money", img: "Image_res/money.webp" },
    { label: "Family",   img: "Image_res/images.webp" },
    { label: "Love",    img: "Image_res/Love.webp" },
    { label: "Friend",  img: "Image_res/Frds.webp" }
  ] },
  { q: "What's my favourite type of drink? 🥤",       options: [
    { label: "Tea", img: "Image_res/tea.webp" },
    { label: "Coffee",   img: "Image_res/coffee.webp" },
    { label: "fresh Juice",    img: "Image_res/fresh juice.webp" },
    { label: "Cold Drink",  img: "Image_res/cold.webp" }
  ] },

  { q: "What does he do during his free time?",         options: [
    { label: "Game", img: "Image_res/game.webp" },
    { label: "Sleep",   img: "Image_res/sleep.webp" },
    { label: "Music",    img: "Image_res/music.webp" },
    { label: "Reels",  img: "Image_res/reels.webp" }
  ] },

  { q: "Preferred communication?",    options: [
    { label: "Calling", img: "Image_res/Call2.webp" },
    { label: "Texting",   img: "Image_res/chat.webp" },
    { label: "Meeting",    img: "Image_res/meet.webp" },
    { label: "Video",  img: "Image_res/video.webp" }
  ] },
  { q: "Biggest fear?",          options: [
    { label: "Exam", img: "Image_res/Exam.webp" },
    { label: "Cockroach",   img: "Image_res/cockroch.webp" },
    { label: "reptile",    img: "Image_res/reptile.webp" },
    { label: "Assignment",  img: "Image_res/assign.webp" }
  ] },
  { q: "Favourite season?",      options: [
    { label: "Summer", img: "Image_res/summer.webp" },
    { label: "rainy",   img: "Image_res/rain.webp" },
    { label: "Winter",    img: "Image_res/winter.webp" },
    { label: "Spring",  img: "Image_res/spring.webp" }
  ] },
  { q: "Choose one power?",         options: [
    { label: "Teleportation", img: "Image_res/teleportation.webp" },
    { label: "Fly",   img: "Image_res/fly.webp" },
    { label: "Invisibility",    img: "Image_res/invisible.webp" },
    { label: "Time Travel",  img: "Image_res/time.webp" }
  ] },
];
export const PASS_SCORE = 7;
export const REWARD_GIFS = [
  { label: "Dance", img: "gif/Dance.gif" },
  { label: "Fire",   img: "gif/Fire.gif" },
  { label: "Kiss",  img: "gif/Kiss.gif" },
  { label: "Yeah",  img: "gif/yeah.gif" }
];


//For Bold

const toBold = (t) => [...t].map((c) => {
  const n = c.codePointAt(0);
  if (n >= 65 && n <= 90)  return String.fromCodePoint(0x1D5D4 + n - 65); // A-Z
  if (n >= 97 && n <= 122) return String.fromCodePoint(0x1D5EE + n - 97); // a-z
  if (n >= 48 && n <= 57)  return String.fromCodePoint(0x1D7EC + n - 48); // 0-9
  return c;
}).join("");

// OUT aanavanga ku kaattura message
export const OUT_MESSAGE = `Nee ${toBold("OUT")} aaita... Ippa nee un friend soldratha senju dhaan aaganum😟! Illana adutha ${toBold("5hrs")} la un time 🛑${toBold("NEGATIVE")}🛑 ah Maaridum🥵...☝🏻FIRST ${toBold("CREATE QUIZ")} CLICK PANNI UNNODA QUIZ READY PANNU!`;
// Share page la kaattura messages (previous quiz la avanga result paathu)
export const SHARE_OUT_MESSAGE = `Ippa poitu un friend soldratha ${toBold("INSTA NOTE")} set pannu☺️... Unnoda quiz ah un friends kum share pannu😉... Main ah un ${toBold("NOTE")} ku reply pandravangaluku Quiz ${toBold("link send")} pannu😁`;
export const SHARE_WIN_MESSAGE = "Super! Nee ennaku real person 💜 Ippo un quiz link ah share pannu, yaar fake friend nu paapom 🔥";
