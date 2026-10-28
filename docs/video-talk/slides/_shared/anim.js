// Shared runtime for the docs/video-talk/slides animations.
//   Plays once, then shows a play button (bottom right) to watch it again
//   Space = pause / resume (replay once ended) · R = restart · page.html#t=0.3 = freeze at 30%
//   ← / → (or PageUp / PageDown) = previous / next slide
//   H = hide / show the on-screen controls (slide number, play button), remembered across slides
//   N = open / close the speaker notes (bottom panel) · click the slide number = jump to any slide
const frame = document.querySelector(".frame");

// Slide order: add new pages here
const slides = [
  "01a-titolo.html",
  "01b-speaker.html",
  "01c-jev.html",
  "01d-hook.html",
  "01e-classificatori.html",
  "02-cos-e.html",
  "02a-tre-modi.html",
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
  "07c-non-solo-jev.html",
  "08-chiusura.html",
  "09-soggetto.html",
  "09a-immagini.html",
  "09b-box.html",
  "09c-sempre-box.html",
  "09d-descrivi.html",
  "09e-tempi-limiti.html",
  "10a-riscrive.html",
  "10b-risponde.html",
  "10c-propone.html",
  "10d-email.html",
  "10e-siti.html",
  "10f-csv.html",
  "10g-router.html",
  "10h-demo.html",
];

// Speaker notes and slide titles are read from the video script (the only copy): for each slide,
// the section that holds its 🎬 link. Fetched at runtime, so they need http (not file://).
const SCRIPT = "../01-intro-jev-video-script.md";

const file = location.pathname.split("/").pop();
const go = (step) => {
  const i = slides.indexOf(file);
  const next = slides[i + step];
  if (i !== -1 && next) location.href = next;
};

// With the notes open the slide is scaled into the space above the panel
let notesHeight = 0;
const fit = () => {
  const h = innerHeight - notesHeight;
  const s = Math.min(innerWidth / 1920, h / 1080);
  frame.style.top = `${h / 2}px`;
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

// Slide number, bottom left: "05e · 12 / 15" (the file prefix, then the position in the deck).
// Clicking it opens the slide list, as tall as the window.
const prefix = (f) => f.split("-")[0];
const dock = document.createElement("div");
dock.className = "dock";
const badge = document.createElement("button");
badge.className = "slide-id";
badge.setAttribute("aria-label", "Go to slide");
const index = slides.indexOf(file);
badge.textContent = prefix(file) + (index === -1 ? "" : ` · ${index + 1} / ${slides.length}`);
const notesToggle = document.createElement("button");
notesToggle.className = "notes-toggle";
notesToggle.textContent = "Notes";
dock.append(badge, notesToggle);

const menu = document.createElement("nav");
menu.className = "slide-menu";
const slideTitle = (f) => f.replace(/^[^-]+-/, "").replace(/\.html$/, "").replaceAll("-", " ");
menu.innerHTML = slides
  .map((f) => `<a href="${f}"${f === file ? ' class="current" aria-current="page"' : ""}><code>${prefix(f)}</code><span>${slideTitle(f)}</span></a>`)
  .join("");
const openMenu = (on) => {
  menu.classList.toggle("open", on);
  if (on) menu.querySelector(".current")?.scrollIntoView({ block: "center" });
};
badge.addEventListener("click", (e) => {
  e.stopPropagation();
  badge.blur();
  openMenu(!menu.classList.contains("open"));
});
addEventListener("click", (e) => { if (!menu.contains(e.target)) openMenu(false); });

const notes = document.createElement("aside");
notes.className = "notes";
notes.innerHTML = '<div class="notes-body"><p class="notes-empty">Loading notes…</p></div>';
document.body.append(menu, dock, notes);

// N opens the notes; the choice is remembered across slides
const NOTES = "anim-notes";
const setNotes = (on) => {
  document.documentElement.classList.toggle("notes-open", on);
  notesHeight = on && !document.documentElement.classList.contains("bare") ? notes.offsetHeight : 0;
  document.documentElement.style.setProperty("--notes-h", `${notesHeight}px`);
  fit();
  try { on ? localStorage.setItem(NOTES, "1") : localStorage.removeItem(NOTES); } catch {}
};
notesToggle.addEventListener("click", () => {
  notesToggle.blur();
  setNotes(!document.documentElement.classList.contains("notes-open"));
});
addEventListener("resize", () => setNotes(document.documentElement.classList.contains("notes-open")));

// Just enough markdown for the script: paragraphs, > quotes (the spoken part), lists, tables, code, inline marks
const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const inline = (t) => esc(t)
  .replace(/`([^`]+)`/g, "<code>$1</code>")
  .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
  .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
  .replace(/(^|[\s(])_(.+?)_(?=[\s.,:;)]|$)/g, "$1<i>$2</i>");
// Each line gets a kind; consecutive lines of the same kind make one block
const kind = (l) => (/^\s*$/.test(l) || l === "---" ? "" : l.startsWith(">") ? "quote" : l.startsWith("|") ? "table" : l.startsWith("- ") ? "list" : "p");
const blocks = {
  quote: (ls) => `<blockquote>${ls.map((l) => l.replace(/^>\s?/, "").trim()).filter(Boolean).map((l) => `<p>${inline(l)}</p>`).join("")}</blockquote>`,
  table: (ls) => `<table>${ls.filter((l) => !/^\|[\s|:-]+\|$/.test(l)).map((l) => `<tr>${l.slice(1, -1).split("|").map((c) => `<td>${inline(c.trim())}</td>`).join("")}</tr>`).join("")}</table>`,
  list: (ls) => `<ul>${ls.map((l) => `<li>${inline(l.slice(2))}</li>`).join("")}</ul>`,
  p: (ls) => `<p>${ls.map(inline).join("<br>")}</p>`,
  code: (ls) => `<pre>${esc(ls.join("\n"))}</pre>`,
};
const render = (md) => {
  let html = "", group = [], type = "";
  const flush = () => { if (type) html += blocks[type](group); group = []; type = ""; };
  for (const l of md.split("\n")) {
    if (l.startsWith("```")) { if (type === "code") flush(); else { flush(); type = "code"; } continue; }
    if (type === "code") { group.push(l); continue; }
    const k = kind(l);
    if (k !== type) flush();
    type = k;
    if (k) group.push(l);
  }
  flush();
  return html;
};

// Splits the script at its headings and keys each section by the slide in its 🎬 line
const sections = (md) => {
  const out = {};
  md.split(/^(?=#{2,4} )/m).forEach((part) => {
    const [heading, ...body] = part.split("\n");
    const text = body.join("\n");
    for (const [, f] of text.matchAll(/🎬.*?slides\/([\w-]+\.html)/g)) {
      out[f] ??= { title: heading.replace(/^#+\s*/, ""), body: text.replace(/^🎬.*$/gm, "") };
    }
  });
  return out;
};

fetch(SCRIPT)
  .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
  .then((md) => {
    const all = sections(md);
    const mine = all[file];
    notes.querySelector(".notes-body").innerHTML = mine
      ? `<h2>${inline(mine.title)}</h2>${render(mine.body)}`
      : `<p class="notes-empty">No section in the script links to ${esc(file)}.</p>`;
    // Slide titles in the menu from the script headings, without the prefix and the timing
    menu.querySelectorAll("a").forEach((a) => {
      const title = all[a.getAttribute("href")]?.title
        .replace(/^\S+ · |^\d+\. /, "")
        .replace(/\s*\(\d+:\d+ – \d+:\d+\)$/, "");
      if (title) a.querySelector("span").innerHTML = inline(title);
    });
  })
  .catch(() => {
    notes.querySelector(".notes-body").innerHTML =
      `<p class="notes-empty">Notes are read from <code>${esc(SCRIPT)}</code>: open the slides over http (e.g. <code>npx serve docs/video-talk</code>), not as a file.</p>`;
  });

// H hides the controls; the choice is remembered so it stays off while recording the whole deck
const BARE = "anim-bare";
const setBare = (on) => {
  document.documentElement.classList.toggle("bare", on);
  setNotes(document.documentElement.classList.contains("notes-open"));
  try { on ? localStorage.setItem(BARE, "1") : localStorage.removeItem(BARE); } catch {}
};
try { if (localStorage.getItem(NOTES) === "1") setNotes(true); } catch {}
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
  } else if (e.key === "Escape") {
    openMenu(false);
  } else if (e.key === "n" || e.key === "N") {
    setNotes(!document.documentElement.classList.contains("notes-open"));
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
