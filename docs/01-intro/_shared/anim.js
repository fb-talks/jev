// Shared runtime for the docs/01-intro animations.
//   Plays once, then shows a play button (bottom right) to watch it again
//   Space = pause / resume (replay once ended) · R = restart · page.html#t=0.3 = freeze at 30%
//   ← / → (or PageUp / PageDown) = previous / next slide
//   H = hide / show the on-screen controls (slide number, play button), remembered across slides
const frame = document.querySelector(".frame");

// Slide order: add new pages here
const slides = [
  "00-hook.html",
  "01-cos-e.html",
  "02a-state-domande.html",
  "02b-tipi-domanda.html",
  "02c-noul-base.html",
  "02d-codice.html",
  "02e-noul.html",
  "02f-choice.html",
  "02g-score.html",
  "03-tre-fasce.html",
  "04-casi-uso.html",
  "05-come-sa.html",
  "05a-parola-dopo.html",
  "05b-coordinate.html",
  "05c-attention.html",
  "05d-opzioni.html",
  "05e-scommettere.html",
  "05f-scommessa.html",
  "05g-quando-sbaglia.html",
  "06a-limiti.html",
  "06b-costi.html",
  "07-chiusura.html",
  "08a-immagini.html",
  "08b-box.html",
  "08c-sempre-box.html",
  "08d-descrivi.html",
  "08e-tempi-limiti.html",
  "09a-account.html",
  "09b-codice.html",
  "09c-gateway.html",
  "09d-demo.html",
];

const file = location.pathname.split("/").pop();
const go = (step) => {
  const i = slides.indexOf(file);
  const next = slides[i + step];
  if (i !== -1 && next) location.href = next;
};

const fit = () => {
  const s = Math.min(innerWidth / 1920, innerHeight / 1080);
  frame.style.transform = `translate(-50%, -50%) scale(${s})`;
};
addEventListener("resize", fit);
fit();

const animations = () => frame.getAnimations({ subtree: true });
const loop = parseFloat(getComputedStyle(frame).getPropertyValue("--loop")) * 1000;

// Each page plays once and stops at END of its loop: from 96% on the pages fade out
// to restart, so 94% is the last frame with everything on screen.
const END = 0.94;
let ended = false;

const seek = (time) => animations().forEach((a) => { a.currentTime = time; a.pause(); });
const togglePause = () => {
  const running = animations().some((a) => a.playState === "running");
  animations().forEach((a) => (running ? a.pause() : a.play()));
};

const replay = document.createElement("button");
replay.className = "replay";
replay.setAttribute("aria-label", "Play again");
replay.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>';
document.body.append(replay);

const restart = () => {
  ended = false;
  replay.classList.remove("show");
  animations().forEach((a) => { a.currentTime = 0; a.play(); });
};
replay.addEventListener("click", restart);

// Slide number, bottom left: "05e · 12 / 15" (the file prefix, then the position in the deck)
const badge = document.createElement("div");
badge.className = "slide-id";
const index = slides.indexOf(file);
badge.textContent = file.split("-")[0] + (index === -1 ? "" : ` · ${index + 1} / ${slides.length}`);
document.body.append(badge);

// H hides the controls; the choice is remembered so it stays off while recording the whole deck
const BARE = "anim-bare";
const setBare = (on) => {
  document.documentElement.classList.toggle("bare", on);
  try { on ? localStorage.setItem(BARE, "1") : localStorage.removeItem(BARE); } catch {}
};
try { setBare(localStorage.getItem(BARE) === "1"); } catch {}

const watch = () => {
  const now = Math.max(0, ...animations().map((a) => a.currentTime ?? 0));
  if (!ended && now >= END * loop) {
    ended = true;
    seek(END * loop);
    replay.classList.add("show");
  }
  requestAnimationFrame(watch);
};
requestAnimationFrame(watch);

addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    ended ? restart() : togglePause();
  } else if (e.key === "r" || e.key === "R") {
    restart();
  } else if (e.key === "h" || e.key === "H") {
    setBare(!document.documentElement.classList.contains("bare"));
  } else if (e.key === "ArrowRight" || e.key === "PageDown") {
    e.preventDefault();
    go(1);
  } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
    e.preventDefault();
    go(-1);
  }
});

const t = Number(new URLSearchParams(location.hash.slice(1)).get("t"));
if (t) seek(t * loop);
