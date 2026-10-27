// Shared runtime for the docs/slides-talk animations.
//   Plays once, then shows a play button (bottom right) to watch it again
//   Space = pause / resume (replay once ended) · R = restart · page.html#t=0.3 = freeze at 30%
//   ← / → (or PageUp / PageDown) = previous / next slide
//   H = hide / show the on-screen controls (slide number, play button), remembered across slides
const frame = document.querySelector(".frame");

// Slide order: add new pages here
const slides = [
  "01a-titolo.html",
  "01b-speaker.html",
  "01c-jev.html",
  "01d-hook.html",
  "02-cos-e.html",
  "03a-state-domande.html",
  "03b-tipi-domanda.html",
  "03c-noul-base.html",
  "03d-codice.html",
  "03e-noul.html",
  "03f-choice.html",
  "03g-score.html",
  "04-tre-fasce.html",
  "05-casi-uso.html",
  "06-come-sa.html",
  "06a-parola-dopo.html",
  "06b-coordinate.html",
  "06c-attention.html",
  "06d-opzioni.html",
  "06e-scommettere.html",
  "06f-scommessa.html",
  "06g-quando-sbaglia.html",
  "07a-limiti.html",
  "07b-costi.html",
  "08-chiusura.html",
  "09-soggetto.html",
  "09a-immagini.html",
  "09b-box.html",
  "09c-sempre-box.html",
  "09d-descrivi.html",
  "09e-tempi-limiti.html",
  "10a-account.html",
  "10b-codice.html",
  "10c-gateway.html",
  "10d-demo.html",
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
