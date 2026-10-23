import { db, isConfigured } from "./firebase-config.js";
import { QUESTIONS, PASS_SCORE, REWARD_GIFS, OUT_MESSAGE, SHARE_OUT_MESSAGE, SHARE_WIN_MESSAGE } from "./questions.js";
import { collection, addDoc, getDoc, getDocs, doc, query, orderBy, limit, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===== HELPERS =====
const app = document.getElementById("app");
const show = (html) => { app.innerHTML = `<div class="card">${html}</div>`; };
const $ = (id) => document.getElementById(id);
// user type panra text-ah safe-ah maathum (security)
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
const baseUrl = location.origin + location.pathname;
const half = QUESTIONS.length / 2;
let timer = null;   // leaderboard auto-refresh timer

// Firebase 10 sec la reply tharala-na error kaatum (apdi illana "Saving..." la stuck aagidum)
const withTimeout = (promise, ms = 10000) =>
  Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))]);

function showError(err, retry) {
  console.error(err);
  const msg = err.message === "timeout"
    ? "Firebase reply varala. Check pannu:<br>1) firebase-config.js la config paste pannita?<br>2) Firestore Database create pannita?<br>3) Rules la read/create allow pannita?"
    : esc(err.message);
  show(`<h2>Something went wrong 😵</h2><p>${msg}</p><button class="btn" id="retry">Try again</button>`);
  $("retry").onclick = retry;
}

// ===== QUESTION SCREEN =====
// answers kudutha = friend mode (right/wrong kaatum). Illana owner mode.
function askQuestions({ heading, answers = null, ownerName = "", done }) {
  let i = 0;
  const picks = [];

  function next() {
    if (i === QUESTIONS.length) return done(picks);
    const q = QUESTIONS[i];
    const bar = QUESTIONS.map((_, n) => `<span class="${n < i ? "done" : ""}"></span>`).join("");
    const cards = q.options.map((op, k) => `
      <button class="option" data-k="${k}">
        <img src="${op.img}" alt="">
        <span class="label">${esc(op.label)}</span>
      </button>`).join("");

    show(`<div class="progress">${bar}</div>
          <p class="small">${heading} · ${i + 1}/${QUESTIONS.length}</p>
          <h2>${esc(q.q)}</h2>
          <div class="options">${cards}</div>
          <div id="feedback"></div>`);

    // image load aagala-na grey box + text mattum kaattum
    document.querySelectorAll(".option img").forEach((im) =>
      im.addEventListener("error", () => { im.style.visibility = "hidden"; }));
    document.querySelectorAll(".option").forEach((btn) =>
      btn.onclick = () => choose(Number(btn.dataset.k), btn));
  }

  function choose(k, btn) {
    picks.push(k);
    const buttons = [...document.querySelectorAll(".option")];
    buttons.forEach((b) => (b.disabled = true));

    // Owner mode: pick panna udane next question
    if (!answers) {
      btn.classList.add("picked");
      i++;
      return setTimeout(next, 350);
    }

    // Friend mode: right / wrong + correct answer kaattum
    const right = answers[i];
    const ok = k === right;
    buttons[right].classList.add("right");
    buttons[right].insertAdjacentHTML("beforeend", `<span class="tag">✓ Correct answer</span>`);
    if (!ok) {
      btn.classList.add("wrong");
      btn.insertAdjacentHTML("beforeend", `<span class="tag">✗ Your pick</span>`);
    }
    const last = i === QUESTIONS.length - 1;
    $("feedback").innerHTML = `
      <div class="feedback ${ok ? "good" : "bad"}">
        <p>${ok ? `✅ Correct! You know ${esc(ownerName)} 🔥`
                : `❌ Wrong! ${esc(ownerName)} picked <b>${esc(QUESTIONS[i].options[right].label)}</b>`}</p>
        <button class="btn" id="nextq">${last ? "See my score" : "Next question"}</button>
      </div>`;
    $("nextq").onclick = () => { i++; next(); };
    $("nextq").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  next();
}

// ===== LEADERBOARD =====
async function fillLeaderboard(id) {
  const box = $("board");
  if (!box) return;
  try {
    const q = query(collection(db, "quizzes", id, "attempts"), orderBy("score", "desc"), limit(30));
    const snap = await withTimeout(getDocs(q));
    box.innerHTML = snap.empty
      ? `<p class="small">Innum yaarum answer pannala. Link share pannu!</p>`
      : snap.docs.map((d, n) => {
          const a = d.data();
          const pass = a.score >= PASS_SCORE;
          return `<div class="row"><span><i>${n + 1}</i> ${esc(a.friend)}</span>
                  <b class="${pass ? "good" : "bad"}">${a.score}/${QUESTIONS.length}${pass ? "" : " · OUT 🚫"}</b></div>`;
        }).join("");
  } catch (e) {
    console.error(e);
    box.innerHTML = `<p class="small">Leaderboard load aagala. Refresh pannu.</p>`;
  }
}

// ===== PAGES =====
// Home — quiz owner create panra page
function homePage() {
  show(`<h1>Who really knows me? 👀</h1>
        <p>Answer ${QUESTIONS.length} quick questions. Share the link. See which friends are fake.</p>
        <input id="name" placeholder="Your name" maxlength="20">
        <button class="btn" id="start">Create my quiz</button>`);
  $("start").onclick = () => {
    const name = $("name").value.trim();
    if (!name) return alert("Name type pannu!");
    askQuestions({ heading: "Your pick", done: (answers) => rewardPage(name, answers) });
  };
}

// Reward GIF select panra screen (owner ku)
function rewardPage(name, answers) {
  const cards = REWARD_GIFS.map((g, k) => `
    <button class="option" data-k="${k}">
      <img src="${g.img}" alt="">
      <span class="label">${esc(g.label)}</span>
    </button>`).join("");

  show(`<h2>Last one! 🎁</h2>
        <p>${PASS_SCORE}+ score eduthaa friend ku edhu kaattanum?</p>
        <div class="options">${cards}</div>`);

  document.querySelectorAll(".option").forEach((btn) =>
    btn.onclick = () => saveQuiz(name, answers, Number(btn.dataset.k)));
}

async function saveQuiz(name, answers, rewardGif) {
  show("<h2>Saving...</h2><p>Oru nimisham 💜</p>");
  try {
    const ref = await withTimeout(addDoc(collection(db, "quizzes"),
      { name, answers, rewardGif, createdAt: serverTimestamp() }));
    location.hash = "#/share/" + ref.id;
  } catch (e) {
    showError(e, () => saveQuiz(name, answers, rewardGif));
  }
}


// English letters + numbers ah bold ah maathum (Instagram la kooda work aagum)
const toBold = (t) => [...t].map((c) => {
  const n = c.codePointAt(0);
  if (n >= 65 && n <= 90)  return String.fromCodePoint(0x1D5D4 + n - 65); // A-Z
  if (n >= 97 && n <= 122) return String.fromCodePoint(0x1D5EE + n - 97); // a-z
  if (n >= 48 && n <= 57)  return String.fromCodePoint(0x1D7EC + n - 48); // 0-9
  return c;
}).join("");

// Share page — link + leaderboard
function sharePage(id) {
  const link = `${baseUrl}#/play/${id}`;
  const result = sessionStorage.getItem("lastResult");

  // PASS + first-time creators ku (un pazhaya msg ah inga vechiko)
  const msgPass = `${toBold("Hi!")} Enna pathi idhula ketruka questions ku ${toBold("Correct")} ah answer pannu... \n
${toBold("Above 7 Correct")} ah answer panna unnaku oru ${toBold("reward")} irruku \n
illa ${toBold("Out")} aaita keela irrukuradhula naa soldratha ${toBold("One day full")} ah ${toBold("Notes")} vaikanum \n
 ${toBold("Click Here!")}`;
  // OUT aanavanga ku (inga vera msg ezhudhu)
  const msgOut = `${toBold("Hi")} \nNaan out aayitten 😅 Nee try pannu, 8 edukka mudiyumaa paapom!`;
  const dare = `${toBold("DARE NOTES:")}
1.Crush kitta pesiten 😭❤️ \n
2.Enakku oruthan mela feelings irukku 👀 \n
3.Ex nyabagam varudhu 💔 \n
4.Yaarachum call pannungalen 📞 \n
5.En life-la oru twist \n
6.Inime love eh vendam 🙏 \n
7.Finally single aagiten 💀 \n
8.Enakku oru cute nickname venum 😂 \n
9.Enna yaarum disturb pannadheenga 😤 \n
10.Love failure da dei 💔 \n
11.Oru important person-a miss panren 🥹 \n
12.Enakku marriage fix aagiduchu 💍😂 \n
13.Enna pathi enna nenakureenga? 👀 \n
14.Naa oruthara block panna poren 💀 \n
15.Yaaru enakku best friend nu prove pannunga 🫶 \n
16.Enna paatha innocent-ah theriyudha? 😇 \n`
  const msg = result === "out" ? msgOut : msgPass;
  const fullText = `${msg}\n${link}\n${dare}`;
  const note = result === "win" ? SHARE_WIN_MESSAGE
             : result === "out" ? SHARE_OUT_MESSAGE : "";
  show(`<h1>Quiz ready! 🎉</h1>
        ${note ? `<div class="msg-box">${note}</div>` : ""}
        <p>Indha link-ah friends ku anuppu:</p>
        <input id="link" value="${link}" readonly>
        <div class="btn-row">
          <button class="btn" id="copy">Copy link</button>
          <button class="btn share" id="share">Share 📲</button>
        </div>
        <h2 class="section">Leaderboard 🏆</h2>
        <div id="board"><p class="small">Loading...</p></div>
        <button class="btn light" id="refresh">Refresh</button>`);
    $("copy").onclick = async () => {
    await navigator.clipboard.writeText(fullText);
    $("copy").textContent = "Copied ✓";
  };
  $("share").onclick = async () => {
    if (navigator.share) {
      try { await navigator.share({ text: fullText }); } catch (e) {}   // cancel pannina onnum aagaadhu
    } else {
      await navigator.clipboard.writeText(fullText);                    // desktop la copy aagum
      $("share").textContent = "Copied ✓ Paste anywhere";
    }
  };
  $("refresh").onclick = () => fillLeaderboard(id);
  fillLeaderboard(id);
  timer = setInterval(() => fillLeaderboard(id), 8000);   // 8 sec ku oru thadava auto refresh
}

// Play page — friend answer panra page
async function playPage(id) {
  show("<h2>Loading quiz...</h2>");
  let quiz;
  try {
    const snap = await withTimeout(getDoc(doc(db, "quizzes", id)));
    if (!snap.exists()) return show("<h2>Quiz not found 😕</h2><p>Link thappa irukkum.</p>");
    quiz = snap.data();
  } catch (e) { return showError(e, () => playPage(id)); }

  show(`<h1>How well do you know ${esc(quiz.name)}? 🤔</h1>
        <p>${QUESTIONS.length} questions. Each answer ku right / wrong theriyum.</p>
        <input id="friend" placeholder="Your name" maxlength="20">
        <button class="btn" id="go">Start</button>`);
  $("go").onclick = () => {
    const friend = $("friend").value.trim();
    if (!friend) return alert("Name type pannu!");
    askQuestions({
      heading: `Guess ${esc(quiz.name)}'s pick`,
      answers: quiz.answers,
      ownerName: quiz.name,
      done: (guesses) => finish(id, quiz, friend, guesses)
    });
  };
}

async function finish(id, quiz, friend, guesses) {
  const score = guesses.filter((g, n) => g === quiz.answers[n]).length;
  const good = score >= PASS_SCORE;
  sessionStorage.setItem("lastResult", good ? "win" : "out");   // share page ku result gnabagam
  const reward = REWARD_GIFS[quiz.rewardGif ?? 0];
  try {
    await withTimeout(addDoc(collection(db, "quizzes", id, "attempts"),
      { friend, score, createdAt: serverTimestamp() }));
  } catch (e) { return showError(e, () => finish(id, quiz, friend, guesses)); }

  const board = `<h2 class="section">Leaderboard 🏆</h2>
                 <div id="board"><p class="small">Loading...</p></div>`;
  const mineBtn = `<button class="btn" id="mine">Create my own quiz</button>`;

  if (good) {
    // PASS: pazhaya maadhiri (button keela)
    show(`<p class="big-score">${score}/${QUESTIONS.length}</p>
          <img class="reward" src="${reward.img}" alt="">
          <span class="verdict good">Real friend 💜</span>
          ${board}
          ${mineBtn}`);
  } else {
    // OUT: message box + button, apram leaderboard
    show(`<p class="big-score">${score}/${QUESTIONS.length}</p>
          <h2>OUT 🚫</h2>
          <span class="verdict bad">Fake friend alert 🚨</span>
          <div class="msg-box">${OUT_MESSAGE}</div>
          ${mineBtn}
          ${board}`);
  }
  $("mine").onclick = () => { location.hash = "#/"; };
  fillLeaderboard(id);
}
// ===== ROUTER — URL # paathu entha page-nu decide pannum =====
function route() {
  clearInterval(timer);
  if (!isConfigured) {
    return show(`<h2>Firebase setup pending ⚙️</h2>
      <p><b>firebase-config.js</b> file la <b>PASTE_HERE</b> irukkura edathula un Firebase config ah paste pannu.</p>`);
  }
  const [, page, id] = location.hash.split("/");   // "#/play/abc" -> ["#", "play", "abc"]
  if ((page === "share" || page === "scores") && id) sharePage(id);
  else if (page === "play" && id) playPage(id);
  else homePage();
}
window.addEventListener("hashchange", route);
route();
