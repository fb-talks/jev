// Shared runtime of every slide deck in docs/ (the only copy: changes here reach all decks, present and future).
// A deck loads it from its own <deck>/_shared/anim.js, which first declares the deck's settings:
//   const slides = ["01-cover.html", …];      the slide order (also read by .github/pages/build.mjs)
//   const SCRIPT = "../speaker-notes.md";     the script with the speaker notes: for each slide, the section
//                                             that holds its 🎬 link (fetched at runtime, so http, not file://)
//   Plays once, then shows a play button (bottom right) to watch it again; elements inside [data-forever] keep looping
//   Space = pause / resume (replay once ended) · R = restart · page.html#t=0.3 = freeze at 30%
//   ← / → (or PageUp / PageDown) = previous / next slide
//   Stops: "⏸ 6.0s" above a spoken part in the script = the slide waits there (set them from the notes editor:
//   slider + markers); without any, data-stops="0.26,0.5" on .frame (fractions of the loop). Click the slide,
//   → / PageDown or Space to go on (→ while a step is playing jumps to the end of that step)
//   H = hide / show the on-screen controls (slide number, play button), remembered across slides
//   N = open / close the speaker notes (bottom or right panel: the two buttons in the dock) · click the slide number = jump to any slide
//   Slides with stops show one square per step, bottom right: grey = on screen, pink = still to come
//   P = open the speaker notes in their own window (e.g. a second monitor), kept in sync with the slides
//   D = drawing toolbar over the slide: pen, ellipse, spotlight, arrow (see draw.js)
//   O (or the gear in the drawing toolbar) = options: Export PDF, every slide at its last frame, with or without notes
//   page.html?still = the last frame only, no controls, no notes, no keys (the pages of the PDF export)
const frame = document.querySelector(".frame");



const file = location.pathname.split("/").pop();
// leaveEdit: set while the notes editor is open; saves unsaved changes before leaving the slide
let leaveEdit = null;
// saveEdit: the editor's save, for the Save button at the top of the notes panel; previewEdit: back to the
// notes as read while presenting, saving the changes first
let saveEdit = null;
let previewEdit = null;
const go = (step) => {
  const i = slides.indexOf(file);
  const next = slides[i + step];
  if (i === -1 || !next) return;
  (leaveEdit ? leaveEdit() : Promise.resolve(true)).then((ok) => ok && (location.href = next));
};

// page.html?notes is the notes window opened with P: only the notes, full height. It follows the slides
// window and drives it (arrows, Space, R) over a BroadcastChannel, one per deck.
const presenter = new URLSearchParams(location.search).has("notes");
document.documentElement.classList.toggle("presenter", presenter);
const still = new URLSearchParams(location.search).has("still");
document.documentElement.classList.toggle("still", still);
if (presenter) document.title = `Notes · ${document.title}`;
const deck = location.pathname.replace(/[^/]*$/, "");
const channel = !still && "BroadcastChannel" in window ? new BroadcastChannel(`anim-deck:${deck}`) : null;
const send = (msg) => channel?.postMessage(msg);

// With the notes open the slide is scaled into the space above the panel
// (or, with the notes on the right, into the space left of them)
let notesHeight = 0;
let notesWidth = 0;
const fit = () => {
  const w = innerWidth - notesWidth;
  const h = innerHeight - notesHeight;
  const s = Math.min(w / 1920, h / 1080);
  frame.style.left = `${w / 2}px`;
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

const seek = (time, list = animations()) => list.forEach((a) => { a.currentTime = time; a.pause(); });
// Animations inside [data-forever] (e.g. the cover's diagram) keep looping when the slide stops at END
const once = () => animations().filter((a) => !a.effect?.target?.closest("[data-forever]"));
// Stops: points of the loop where the slide waits for a click, as fractions of --loop. They come from the
// "⏸ 6.0s" lines of the script (one above each spoken part that starts at a stop, see spoken() below); a
// section without them falls back to data-stops on .frame (e.g. data-stops="0.26,0.5").
const htmlStops = (frame.dataset.stops || "").split(",").map(Number);
let stops = [];
let nextStop = 0;
let held = false;
const now = () => Math.max(0, ...once().map((a) => a.currentTime ?? 0));
const setStops = (list) => {
  stops = [...new Set(list)].filter((x) => x > 0 && x < END).sort((a, b) => a - b);
  // Stops already passed (or the one the slide is waiting at) are not waited at again
  const t = now();
  nextStop = stops.filter((x) => (held ? x * loop <= t + 1 : x * loop < t)).length;
};
setStops(htmlStops);
const holdAt = (time) => {
  held = true;
  nextStop++;
  seek(time, once());
  replay.classList.remove("show");
  hint.classList.add("show");
};
const proceed = () => {
  if (held) {
    held = false;
    hint.classList.remove("show");
    once().forEach((a) => a.play());
    return true;
  }
  // A step is still playing: jump to its end and go straight on with the next step (which waits at its own stop)
  if (!ended && nextStop < stops.length) {
    const time = stops[nextStop++] * loop;
    once().forEach((a) => { a.currentTime = time; a.play(); });
    replay.classList.remove("show");
    return true;
  }
  return false;
};
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
  held = false;
  nextStop = 0;
  hint?.classList.remove("show");
  replay.classList.remove("show");
  animations().forEach((a) => { a.currentTime = 0; a.play(); });
};
replay.addEventListener("click", restart);

// Shown while the slide waits at a stop
const hint = document.createElement("div");
hint.className = "stop-hint";
hint.setAttribute("aria-hidden", "true");
hint.innerHTML = '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>';
document.body.append(hint);
frame.addEventListener("click", (e) => { if (stops.length && !e.target.closest("a, button")) proceed(); });

// Links marked data-next (e.g. the cover's Start button) open the next slide in the deck
const nextSlide = slides[slides.indexOf(file) + 1];
if (nextSlide) document.querySelectorAll("[data-next]").forEach((a) => (a.href = nextSlide));

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
const notesWindow = document.createElement("button");
notesWindow.className = "notes-window";
notesWindow.textContent = "↗";
notesWindow.title = "Notes in a new window (P)";
notesWindow.setAttribute("aria-label", "Open the notes in a new window");
// Where the notes panel sits: at the bottom or on the right (the ⋮ dropdown at the top right of the panel)
const placeButton = (right) => {
  const b = document.createElement("button");
  b.className = `notes-place-item${right ? " to-right" : " to-bottom"}`;
  b.setAttribute("role", "menuitem");
  b.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/>${right ? '<path d="M14 4v16"/>' : '<path d="M3 14h18"/>'}</svg>`
    + `<span>${right ? "Notes on the right" : "Notes at the bottom"}</span>`;
  b.addEventListener("click", () => {
    b.blur();
    placeMenu.hidden = true;
    notesRight = right;
    try { right ? localStorage.setItem(SIDE, "right") : localStorage.removeItem(SIDE); } catch {}
    setNotes(true);
  });
  return b;
};
dock.append(badge, notesToggle, notesWindow);

const menu = document.createElement("nav");
menu.className = "slide-menu";
const slideTitle = (f) => f.replace(/^[^-]+-/, "").replace(/\.html$/, "").replaceAll("-", " ");
menu.innerHTML = slides
  // Position in the deck (what the presenter says and the badge counts), then the file prefix
  .map((f, i) => `<a href="${f}"${f === file ? ' class="current" aria-current="page"' : ""}><b class="slide-n">${i + 1}</b><code>${prefix(f)}</code><span>${slideTitle(f)}</span></a>`)
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
notes.innerHTML = '<div class="notes-head"></div><div class="notes-body"><p class="notes-empty">Loading notes…</p></div>';
// Next to them: Save (while editing the notes) and ✕, which closes the notes
const headSave = Object.assign(document.createElement("button"), { className: "notes-btn save notes-head-save", textContent: "Save" });
headSave.addEventListener("click", () => { headSave.blur(); saveEdit?.(); });
const headClose = Object.assign(document.createElement("button"), { className: "notes-place notes-close", innerHTML: "×", title: "Close the notes (N)" });
headClose.setAttribute("aria-label", "Close the notes");
headClose.addEventListener("click", () => { headClose.blur(); setNotes(false); });
const headTimeline = Object.assign(document.createElement("div"), { className: "notes-head-tl" });
// ⋮ opens a dropdown with the two places of the panel
const placeWrap = Object.assign(document.createElement("div"), { className: "notes-more" });
const placeToggle = Object.assign(document.createElement("button"), { className: "notes-place notes-dots", title: "Notes panel position" });
placeToggle.setAttribute("aria-label", "Notes panel position");
placeToggle.setAttribute("aria-haspopup", "true");
placeToggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>';
const placeMenu = Object.assign(document.createElement("div"), { className: "notes-place-menu", hidden: true });
placeMenu.setAttribute("role", "menu");
placeToggle.addEventListener("click", () => { placeToggle.blur(); placeMenu.hidden = !placeMenu.hidden; });
addEventListener("pointerdown", (e) => { if (!placeMenu.hidden && !placeWrap.contains(e.target)) placeMenu.hidden = true; });
placeWrap.append(placeToggle, placeMenu);
const headPreview = Object.assign(document.createElement("button"), { className: "notes-btn notes-head-preview", textContent: "Preview", title: "Back to the notes as you read them while presenting (saves first)" });
headPreview.addEventListener("click", () => { headPreview.blur(); previewEdit?.(); });
notes.querySelector(".notes-head").append(headTimeline, headPreview, headSave, placeWrap, headClose);
placeMenu.append(placeButton(false), placeButton(true));
document.body.append(menu, dock, notes);

// N opens the notes; the choice is remembered across slides, like their place (bottom or right, the dock buttons)
const NOTES = "anim-notes";
const SIDE = "anim-notes-side";
let notesRight = false;
try { notesRight = localStorage.getItem(SIDE) === "right"; } catch {}
const setNotes = (on) => {
  if (presenter) return;
  const root = document.documentElement;
  root.classList.toggle("notes-open", on);
  root.classList.toggle("notes-right", notesRight);
  const shown = on && !root.classList.contains("bare");
  notesHeight = shown && !notesRight ? notes.offsetHeight : 0;
  notesWidth = shown && notesRight ? notes.offsetWidth : 0;
  root.style.setProperty("--notes-h", `${notesHeight}px`);
  root.style.setProperty("--notes-w", `${notesWidth}px`);
  fit();
  // The editor's textareas fit their new width; the drawing toolbar keeps out of the panel
  notesBody.querySelectorAll("textarea").forEach((t) => t.dispatchEvent(new Event("input")));
  dispatchEvent(new Event("anim-layout"));
  try { on ? localStorage.setItem(NOTES, "1") : localStorage.removeItem(NOTES); } catch {}
};
notesToggle.addEventListener("click", () => {
  notesToggle.blur();
  setNotes(!document.documentElement.classList.contains("notes-open"));
});
addEventListener("resize", () => setNotes(document.documentElement.classList.contains("notes-open")));

// P opens the notes in their own window (reused if already open) and closes the panel here
const openNotesWindow = () => {
  window.open(`${file}?notes`, `anim-notes:${deck}`, "popup,width=960,height=900");
  setNotes(false);
};
notesWindow.addEventListener("click", () => {
  notesWindow.blur();
  openNotesWindow();
});

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
      out[f] ??= { title: heading.replace(/^#+\s*/, ""), body: text.replace(/^🎬.*$/gm, ""), part };
    }
  });
  return out;
};

// Dev mode (npm run slides): the server marks its responses with X-Slides-Dev and the notes become editable,
// one textarea per block of the script section; saving rewrites that section of the .md (POST /__notes in
// serve.mjs). Published decks have no such server, so there the notes stay read-only.
const notesBody = notes.querySelector(".notes-body");
let dev = false;
let section = null;
let editing = false;
// Edit mode is remembered across slides (until "Back to notes" / Esc), like the notes panel
const EDIT = "anim-notes-edit";
const keepEditing = (on) => { try { on ? localStorage.setItem(EDIT, "1") : localStorage.removeItem(EDIT); } catch {} };
let firstLoad = true;

const showNotes = () => {
  editing = false;
  notes.classList.remove("is-editing");
  headTimeline.replaceChildren();
  // Only the spoken parts (> quotes) of the section: no title, text, code or tables. A part that starts
  // at a stop gets a "→ 6.0 s" line above it: the point where → plays on.
  const parts = section ? spoken(section.body) : [];
  notesBody.innerHTML = !section
    ? `<p class="notes-empty">No section in the script links to ${esc(file)}.</p>`
    : !parts.length ? '<p class="notes-empty">No spoken part for this slide.</p>'
    : parts.map((b, i) => (b.time > 0 && b.time !== parts[i - 1]?.time ? `<div class="notes-stop">→ ${secs(b.time)} s</div>` : "")
      + (blank(b.text) ? "" : `<div class="notes-part" data-step="${stepOf(b.time)}">${render(b.text)}</div>`)).join("");
  stepsShown = "";
  if (!dev || !section) return;
  const edit = document.createElement("button");
  edit.className = "notes-btn notes-edit";
  edit.textContent = "Edit";
  edit.addEventListener("click", editNotes);
  notesBody.prepend(edit);
};

const loadNotes = () => fetch(SCRIPT, { cache: "no-store" })
  .then((r) => {
    dev = r.headers.has("X-Slides-Dev");
    return r.ok ? r.text() : Promise.reject(r.status);
  })
  .then((md) => {
    const all = sections(md);
    section = all[file] ?? null;
    applyStops();
    if (!editing) showNotes();
    let resume = false;
    try { resume = localStorage.getItem(EDIT) === "1"; } catch {}
    if (firstLoad && dev && section && resume) editNotes({ focus: false });
    firstLoad = false;
    // Slide titles in the menu from the script headings, without the prefix and the timing
    menu.querySelectorAll("a").forEach((a) => {
      const title = all[a.getAttribute("href")]?.title
        .replace(/^\S+ · |^\d+\. /, "")
        .replace(/\s*\(\d+:\d+ – \d+:\d+\)$/, "");
      if (title) a.querySelector("span").innerHTML = inline(title);
    });
  })
  .catch(() => {
    notesBody.innerHTML =
      `<p class="notes-empty">Notes are read from <code>${esc(SCRIPT)}</code>: open the slides over http (e.g. <code>npm run slides</code>), not as a file.</p>`;
  });
if (!still) loadNotes();

// A section split into blocks, each with its own textarea: at blank lines, and where > quote lines start or end
// (the "🎙️ VOCE:" label sits right above its quote). Code fences stay whole. sep is what preceded the block.
const chunks = (text) => {
  const out = [];
  let cur = [], fence = false, sep = "";
  const flush = (next) => {
    if (cur.length) out.push({ sep, text: cur.join("\n") });
    cur = [];
    sep = next;
  };
  for (const l of text.split("\n")) {
    if (!fence && !l.trim()) { flush("\n\n"); continue; }
    // A "⏸ 6.0s" line is always a chunk of its own, also right under "🎙️ **VOCE**:" with no blank line
    if (!fence && /^⏸/.test(l)) {
      if (cur.length) flush("\n");
      cur.push(l);
      flush("\n");
      continue;
    }
    if (!fence && cur.length && l.startsWith(">") !== cur[0].startsWith(">")) flush("\n");
    if (l.startsWith("```")) fence = !fence;
    cur.push(l);
  }
  flush("");
  return out;
};
// Only the spoken parts (> quotes) are editable, without the "> " (added back on save). Everything else
// (text, code, the 🎬 line that ties the section to the slide, --- separators) is kept as it is, not shown.
const isQuote = (c) => c.split("\n").every((l) => l.startsWith(">"));

// "⏸ 6.0s" on the line right above a spoken part: that part starts at a stop, 6 s into the slide.
// Parts without it start at 0, i.e. with the slide (several parts can share a time: same step).
const STOP = /^⏸\s*(\d+(?:\.\d+)?)\s*s$/;
const loopS = loop / 1000;
const maxS = Math.floor(END * loopS * 10) / 10;
const secs = (t) => (Math.round(t * 10) / 10).toFixed(1);
// The step a spoken part belongs to: how many stops come at or before its start (0 = the first step)
const stepOf = (time) => stops.filter((x) => x * loopS <= time + 0.01).length;
// A stop can have nothing to say: its part is a lone ">" (kept so the stop is saved)
const blank = (text) => !text.replace(/^>\s?/gm, "").trim();
const spoken = (body) => {
  const out = [];
  let time = null;
  for (const { text: c } of chunks(body)) {
    const m = c.match(STOP);
    if (m) { time = Number(m[1]); continue; }
    if (isQuote(c)) out.push({ text: c, time: time ?? 0 });
    time = null;
  }
  return out;
};
const applyStops = () => {
  if (section && /^⏸/m.test(section.body)) setStops(spoken(section.body).map((b) => b.time / loopS));
  else setStops(htmlStops);
};
// Scrubbing from the notes editor: the slide waits at that point, → plays on from there
const scrub = (t) => {
  seek(t * 1000, once());
  ended = false;
  held = true;
  hint.classList.remove("show");
  replay.classList.remove("show");
  nextStop = stops.filter((x) => x * loop <= t * 1000 + 1).length;
};

// focus: false when edit mode carries over from the previous slide, so ← / → still move between slides
const editNotes = ({ focus = true } = {}) => {
  editing = true;
  notes.classList.add("is-editing");
  keepEditing(true);
  const [heading, ...rest] = section.part.split("\n");
  const text = rest.join("\n");
  const lead = text.match(/^\s*/)[0];
  const trail = text.slice(lead.length).match(/\s*$/)[0];
  const original = section.part;

  const form = document.createElement("form");
  form.className = "notes-form";
  // Timeline: a slider over the slide (scrubs it) and one marker per spoken part, at the time it starts
  const timeline = document.createElement("div");
  timeline.className = "notes-timeline";
  timeline.innerHTML = '<button type="button" class="tl-play" aria-label="Play / pause"></button>'
    + `<div class="tl-track"><input type="range" min="0" max="${maxS}" step="0.1" aria-label="Slide time"><div class="tl-marks"></div></div>`
    + '<span class="tl-now"></span><button type="button" class="notes-btn add-stop" title="New stop at this point, with an empty spoken part">+ Stop</button>';
  const slider = timeline.querySelector("input");
  const marks = timeline.querySelector(".tl-marks");
  const nowLabel = timeline.querySelector(".tl-now");
  const list = document.createElement("div");
  const actions = document.createElement("div");
  actions.className = "notes-actions";
  actions.innerHTML = '<button type="submit" class="notes-btn save">Save</button><button type="button" class="notes-btn cancel">Back to notes</button>'
    + '<button type="button" class="notes-btn add-quote">+ Spoken</button>'
    + '<span class="notes-status">⌘S save · Esc cancel · drag a marker to move its stop</span>';
  form.append(list, actions);
  // The timeline sits in the panel's top row, between the place buttons and Save / ✕
  headTimeline.replaceChildren(timeline);

  const clampT = (t) => Math.min(maxS, Math.max(0, Math.round(t * 10) / 10));
  const setSlider = (t) => { slider.value = t; nowLabel.textContent = `${secs(t)} s`; };
  setSlider(clampT(now() / 1000));
  slider.addEventListener("input", () => { setSlider(Number(slider.value)); scrub(Number(slider.value)); });
  // Play / pause; the slider follows the slide while it plays (a stop still holds it, → or play goes on)
  const play = timeline.querySelector(".tl-play");
  const running = () => once().some((a) => a.playState === "running");
  const PLAY = '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg>';
  const PAUSE = '<svg viewBox="0 0 24 24"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>';
  play.addEventListener("click", () => {
    play.blur();
    if (running()) once().forEach((a) => a.pause());
    else if (ended) restart();
    else if (held) proceed();
    else once().forEach((a) => a.play());
  });
  let shown = null;
  const follow = () => {
    if (!form.isConnected) return;
    const on = running();
    if (on) setSlider(clampT(now() / 1000));
    if (on !== shown) { play.innerHTML = on ? PAUSE : PLAY; play.classList.toggle("on", on); shown = on; }
    // The spoken part(s) for the point the slide is at: the latest start at or before it
    const t = now() / 1000 + 0.05;
    const at = Math.max(...quotes().map((q) => q.time).filter((x) => x <= t), 0);
    quotes().forEach((q) => q.label.classList.toggle("current", q.time === at));
    requestAnimationFrame(follow);
  };
  requestAnimationFrame(follow);

  // blocks: the section in order, "fixed" (kept as they are, not shown) and "quote" (one per spoken part)
  const blocks = [];
  const quotes = () => blocks.filter((b) => b.kind === "quote");
  const setTime = (b, t) => {
    b.time = clampT(t);
    b.input.value = secs(b.time);
    b.mark.style.left = `${(b.time / maxS) * 100}%`;
  };
  // Spoken parts in time order (stable): they swap places among the slots the section has for them,
  // each slot keeping its separator; the textareas and the marker numbers follow
  const order = () => {
    const slots = blocks.map((b, i) => (b.kind === "quote" ? i : -1)).filter((i) => i !== -1);
    const seps = slots.map((i) => blocks[i].sep);
    const sorted = slots.map((i) => blocks[i]).sort((a, b) => a.time - b.time);
    slots.forEach((i, k) => { blocks[i] = sorted[k]; sorted[k].sep = seps[k]; });
    sorted.forEach((b, k) => {
      list.append(b.label);
      b.num.textContent = b.mark.textContent = k + 1;
    });
  };
  const quote = (value, time, sep) => {
    const label = document.createElement("label");
    label.innerHTML = '<span class="tl-head"><b class="tl-num"></b> Spoken · from <input type="number" min="0" step="0.1"> s'
      + '<button type="button" class="tl-del" title="Delete this spoken part" aria-label="Delete this spoken part">'
      + '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5"/></svg></button></span>';
    label.querySelector("input").max = maxS;
    const ta = document.createElement("textarea");
    ta.className = "quote";
    ta.rows = 1;
    ta.value = value;
    const grow = () => { ta.style.height = "auto"; ta.style.height = `${ta.scrollHeight + 2}px`; };
    ta.addEventListener("input", grow);
    label.append(ta);
    list.append(label);
    requestAnimationFrame(grow);
    const mark = document.createElement("button");
    mark.type = "button";
    mark.className = "tl-mark";
    marks.append(mark);
    const b = { kind: "quote", ta, sep, label, mark, input: label.querySelector("input"), num: label.querySelector(".tl-num") };
    setTime(b, time);
    // Number field: type a time, the marker and the slide follow
    b.input.addEventListener("change", () => { setTime(b, Number(b.input.value) || 0); setSlider(b.time); scrub(b.time); order(); });
    // The marker and its textarea light up together
    const on = (v) => { mark.classList.toggle("active", v); label.classList.toggle("active", v); };
    ta.addEventListener("focus", () => {
      on(true);
      // The slide jumps to the end of this part's step (the next stop, or the last frame): what is on screen
      // while it is said
      const next = quotes().map((q) => q.time).filter((t) => t > b.time).sort((x, y) => x - y)[0];
      const t = next !== undefined ? Math.max(b.time, next - 0.1) : maxS;
      setSlider(t);
      scrub(t);
    });
    ta.addEventListener("blur", () => on(false));
    // Trash: the part and its marker go away (saved with Save, or when leaving the slide); the last one
    // becomes an empty textarea
    label.querySelector(".tl-del").addEventListener("click", (e) => {
      e.preventDefault();
      blocks.splice(blocks.indexOf(b), 1);
      label.remove();
      mark.remove();
      order();
      if (!quotes().length) addQuote(0);
    });
    mark.addEventListener("mouseenter", () => on(true));
    mark.addEventListener("mouseleave", () => on(document.activeElement === ta));
    // Drag the marker along the track to move its stop; a click without moving jumps the slide there
    mark.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      mark.setPointerCapture(e.pointerId);
      const box = marks.getBoundingClientRect();
      let moved = false;
      const move = (ev) => {
        moved = true;
        setTime(b, ((ev.clientX - box.left) / box.width) * maxS);
        setSlider(b.time);
        scrub(b.time);
      };
      const up = () => {
        mark.removeEventListener("pointermove", move);
        if (moved) order();
        else { setSlider(b.time); scrub(b.time); ta.focus(); }
      };
      mark.addEventListener("pointermove", move);
      mark.addEventListener("pointerup", up, { once: true });
    });
    return b;
  };
  // A new spoken part goes right after the last one, or under the "🎙️ VOCE" label, or at the end
  const addQuote = (time) => {
    const qs = blocks.map((b, i) => (b.kind === "quote" ? i : -1)).filter((i) => i !== -1);
    const voce = blocks.findIndex((b) => b.kind === "fixed" && b.value.startsWith("🎙️"));
    const at = qs.length ? qs.at(-1) + 1 : voce !== -1 ? voce + 1 : blocks.length;
    const b = quote("", time, qs.length || voce === -1 ? "\n\n" : "\n");
    blocks.splice(at, 0, b);
    order();
    requestAnimationFrame(() => b.ta.focus());
    return b;
  };

  // Times: from the ⏸ lines; a section that has none yet takes data-stops in order (part 2 at the 1st stop…)
  const scripted = /^⏸/m.test(text);
  const fallback = (i) => (!scripted && i > 0 && htmlStops[i - 1] > 0 ? htmlStops[i - 1] * loopS : 0);
  let pending = null;
  for (const { sep, text: c } of chunks(text)) {
    const m = c.match(STOP);
    if (m) { pending = { time: Number(m[1]), sep }; continue; }
    if (isQuote(c)) {
      const value = c.split("\n").map((l) => l.replace(/^>\s?/, "")).join("\n");
      blocks.push(quote(value, pending ? pending.time : fallback(quotes().length), pending ? pending.sep : sep));
    } else blocks.push({ kind: "fixed", value: c, sep });
    pending = null;
  }
  order();
  // No spoken part yet: one empty textarea
  if (!quotes().length) addQuote(0);

  timeline.querySelector(".add-stop").addEventListener("click", () => addQuote(Number(slider.value)));
  actions.querySelector(".add-quote").addEventListener("click", () => addQuote(0));
  const stopEditing = () => { keepEditing(false); leaveEdit = saveEdit = previewEdit = null; loadNotes().then(showNotes); };
  actions.querySelector(".cancel").addEventListener("click", stopEditing);
  const status = actions.querySelector(".notes-status");

  const serialize = () => {
    let out = "";
    for (const b of blocks) {
      const v = b.kind === "fixed" ? b.value : b.ta.value.replace(/\s+$/, "");
      // An empty part is dropped, unless it starts at a stop: then it stays as "⏸ 15.0s" + a lone ">"
      if (!v.trim() && !(b.kind === "quote" && b.time > 0)) continue;
      let md = v;
      if (b.kind === "quote") {
        md = v.split("\n").map((l) => (l.trim() ? `> ${l}` : ">")).join("\n");
        if (b.time > 0) md = `⏸ ${secs(b.time)}s\n${md}`;
      }
      out += (out ? b.sep || "\n\n" : "") + md;
    }
    return `${heading}\n${lead}${out}${trail}`;
  };
  // After a save the editor stays open on the saved section
  const save = () => {
    order();
    const updated = serialize();
    status.textContent = "Saving…";
    return fetch("/__notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: new URL(SCRIPT, location.href).pathname, original, updated }),
    }).then((r) => {
      if (r.status === 409) {
        status.textContent = "The section changed in the file: not saved, go back to the notes and edit again.";
        return false;
      }
      if (!r.ok) throw r.status;
      send({ notes: true });
      return loadNotes().then(() => {
        editNotes({ focus: false });
        notesBody.querySelector(".notes-status").textContent = "Saved ✓";
        return true;
      });
    }).catch(() => {
      status.textContent = "Not saved: is npm run slides still running?";
      return false;
    });
  };
  // Leaving the slide (← / →): unsaved changes are saved first; if that fails, the slide does not change
  const baseline = serialize();
  leaveEdit = () => (serialize() === baseline ? Promise.resolve(true) : save());
  saveEdit = save;
  previewEdit = () => leaveEdit().then((ok) => ok && stopEditing());
  form.addEventListener("submit", (e) => { e.preventDefault(); save(); });
  form.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); save(); }
    else if (e.key === "Escape") stopEditing();
    // Enter in a time field applies it instead of saving the form
    else if (e.key === "Enter" && e.target.type === "number") { e.preventDefault(); e.target.dispatchEvent(new Event("change")); }
  });

  notesBody.innerHTML = "";
  notesBody.append(form);
  if (focus) form.querySelector("textarea")?.focus();
};

// H hides the controls; the choice is remembered so it stays off while recording the whole deck
const BARE = "anim-bare";
const setBare = (on) => {
  if (presenter) return;
  document.documentElement.classList.toggle("bare", on);
  setNotes(document.documentElement.classList.contains("notes-open"));
  try { on ? localStorage.setItem(BARE, "1") : localStorage.removeItem(BARE); } catch {}
};
if (!still) {
  try { if (localStorage.getItem(NOTES) === "1") setNotes(true); } catch {}
  try { setBare(localStorage.getItem(BARE) === "1"); } catch {}
}

// Step indicator, bottom right (slides with stops only): one square per step, grey for the steps already
// on screen, pink for those still to come
const steps = document.createElement("div");
steps.className = "steps";
steps.setAttribute("aria-hidden", "true");
document.body.append(steps);
let stepsShown = "";
const showSteps = (t) => {
  // A step counts once the slide has gone past its stop (waiting at a stop is still the step before)
  const done = stops.filter((x) => x * loop < t - 1).length + 1;
  const key = stops.length ? `${done}/${stops.length + 1}` : "";
  if (key === stepsShown) return;
  stepsShown = key;
  steps.innerHTML = stops.length ? Array.from({ length: stops.length + 1 }, (_, i) => `<i class="${i < done ? "done" : ""}"></i>`).join("") : "";
  // In the notes, the spoken parts of the step on screen stand out (slides with stops only)
  notesBody.querySelectorAll(".notes-part").forEach((p) => p.classList.toggle("current", stops.length > 0 && +p.dataset.step === done - 1));
};

const watch = () => {
  const now = Math.max(0, ...once().map((a) => a.currentTime ?? 0));
  showSteps(now);
  // Only while playing: #t=… and the exporter seek paused animations and must not be stopped
  const playing = once().some((a) => a.playState === "running");
  if (!ended && !held && playing && nextStop < stops.length && now >= stops[nextStop] * loop) holdAt(stops[nextStop] * loop);
  else if (!ended && now >= END * loop) {
    ended = true;
    seek(END * loop, once());
    replay.classList.add("show");
  }
  requestAnimationFrame(watch);
};
requestAnimationFrame(watch);

// The slides window announces its slide on every load and the notes window follows it; a notes window
// that has just opened asks which slide is on screen. Keys pressed in the notes window drive the slides.
// After a notes edit is saved, the other window reloads its notes.
if (channel) channel.onmessage = ({ data }) => {
  if (data.notes) loadNotes();
  if (presenter) {
    if (data.slide && data.slide !== file) location.replace(`${data.slide}?notes`);
    return;
  }
  if (data.hello) send({ slide: file });
  if (data.go) data.go === 1 && proceed() || go(data.go);
  if (data.key === "space") ended ? restart() : held ? proceed() : togglePause();
  if (data.key === "restart") restart();
};
send(presenter ? { hello: true } : { slide: file });

addEventListener("keydown", (e) => {
  if (still || e.target.closest?.("textarea, input")) return;
  if (!options.hidden) { if (e.key === "Escape") showOptions(false); return; }
  if (presenter) {
    const step = { ArrowRight: 1, PageDown: 1, ArrowLeft: -1, PageUp: -1 }[e.key];
    if (step || e.code === "Space") e.preventDefault();
    if (step) send({ go: step });
    else if (e.code === "Space") send({ key: "space" });
    else if (e.key === "r" || e.key === "R") send({ key: "restart" });
    return;
  }
  if (e.code === "Space") {
    e.preventDefault();
    ended ? restart() : held ? proceed() : togglePause();
  } else if (e.key === "Escape") {
    openMenu(false);
  } else if (e.key === "n" || e.key === "N") {
    setNotes(!document.documentElement.classList.contains("notes-open"));
  } else if (e.key === "p" || e.key === "P") {
    openNotesWindow();
  } else if (e.key === "r" || e.key === "R") {
    restart();
  } else if ((e.key === "o" || e.key === "O") && !document.documentElement.classList.contains("draw-no-keys")) {
    showOptions(true);
  } else if (e.key === "h" || e.key === "H") {
    setBare(!document.documentElement.classList.contains("bare"));
  } else if (e.key === "ArrowRight" || e.key === "PageDown") {
    e.preventDefault();
    if (!proceed()) go(1);
  } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
    e.preventDefault();
    go(-1);
  }
});

// ---------- Options (O, or the gear in the drawing toolbar): a modal in the middle of the window ----------
const options = document.createElement("div");
options.className = "options";
options.hidden = true;
options.innerHTML = `<div class="options-box" role="dialog" aria-modal="true" aria-labelledby="options-title">
  <button type="button" class="options-close" aria-label="Close">×</button>
  <h2 id="options-title">Options</h2>
  <section>
    <h3>Export PDF</h3>
    <p>All ${slides.length} slides, each at its last frame, in one PDF file.</p>
    <label class="options-check"><input type="checkbox" name="notes"> Include notes <span>(slide on the left, speaker notes on the right)</span></label>
    <div class="options-row"><button type="button" class="notes-btn save options-export">Export PDF</button><span class="options-status"></span></div>
  </section>
</div>`;
document.body.append(options);
const withNotes = options.querySelector("[name=notes]");
const PDF_NOTES = "anim-pdf-notes";
try { withNotes.checked = localStorage.getItem(PDF_NOTES) === "1"; } catch {}
withNotes.addEventListener("change", () => { try { withNotes.checked ? localStorage.setItem(PDF_NOTES, "1") : localStorage.removeItem(PDF_NOTES); } catch {} });
const showOptions = (on) => {
  options.hidden = !on;
  if (on) options.querySelector(".options-export").focus();
};
options.addEventListener("click", (e) => { if (e.target === options || e.target.closest(".options-close")) showOptions(false); });
addEventListener("anim-options", () => showOptions(true));

// Export PDF: a print page with one 1920×1080 page per slide (with notes: the slide on the left 65%, its
// spoken parts on the right), sent to the dev server (POST /__pdf in serve.mjs) that puts a picture of each
// slide's last frame in it, prints it with headless Chrome to <slides>/_export/<name>.pdf, then opened in a new tab.
const exportPdf = async () => {
  const notesToo = withNotes.checked;
  const status = options.querySelector(".options-status");
  const button = options.querySelector(".options-export");
  if (!dev) { status.textContent = "Export PDF needs the dev server: npm run slides."; return; }
  // The tab for the PDF opens now, inside the click (later the browser would block it), and loads it when ready
  const tab = window.open("", "_blank");
  tab?.document.write('<title>Exporting PDF…</title><p style="font: 18px sans-serif; padding: 24px">Exporting the PDF…</p>');
  tab?.document.close();
  button.disabled = true;
  status.textContent = `Rendering ${slides.length} slides… (about ${Math.ceil(slides.length * 0.8)} s)`;
  let all = {};
  if (notesToo) {
    try { all = sections(await fetch(SCRIPT, { cache: "no-store" }).then((r) => (r.ok ? r.text() : Promise.reject(r.status)))); } catch {}
  }
  const css = getComputedStyle(document.documentElement);
  const v = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
  const notesHtml = (f, i) => {
    const sec = all[f];
    const title = sec ? inline(sec.title.replace(/^\S+ · |^\d+\. /, "")) : esc(slideTitle(f));
    const parts = sec ? spoken(sec.body) : [];
    const body = parts.length
      ? parts.map((b, k) => (b.time > 0 && b.time !== parts[k - 1]?.time ? `<div class="stop">→ ${secs(b.time)} s</div>` : "") + (blank(b.text) ? "" : render(b.text))).join("")
      : '<p class="empty">No speaker notes.</p>';
    return `<div class="side"><div class="meta">${esc(prefix(f))} · ${i + 1} / ${slides.length}</div><h2>${title}</h2><div class="text">${body}</div></div>`;
  };
  const pages = slides.map((f, i) => `<section class="page"><div class="shot"><img data-shot="${i}" alt=""></div>${notesToo ? notesHtml(f, i) : ""}</section>`).join("\n");
  const name = `${deck.split("/").filter(Boolean).at(-2) || "slides"} - ${notesToo ? "slides + notes" : "slides"}`;
  const html = `<!doctype html><html${notesToo ? ' class="with-notes"' : ""}><head><meta charset="utf-8"><title>${esc(name)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Architects+Daughter&family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@500&display=swap">
<style>
  @page { size: 1920px 1080px; margin: 0; }
  :root { --pink: ${v("--pink", "#FF00BF")}; --ink: ${v("--ink", "#1f1f1f")}; --sans: ${v("--sans", "sans-serif")}; --hand: ${v("--hand", "cursive")}; --mono: ${v("--mono", "monospace")}; }
  html, body { margin: 0; background: #fff; color: var(--ink); font-family: var(--sans); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { position: relative; width: 1920px; height: 1080px; overflow: hidden; break-after: page; }
  .page:last-child { break-after: auto; }
  .shot { position: absolute; inset: 0; overflow: hidden; }
  .shot img { display: block; width: 100%; height: 100%; }
  .with-notes .shot { inset: auto; left: 56px; top: 189px; width: 1248px; height: 702px; border: 1px solid #e3e7ef; border-radius: 14px; }
  .side { position: absolute; left: 1360px; right: 56px; top: 72px; bottom: 72px; display: flex; flex-direction: column; }
  .meta { font: 500 18px var(--mono); color: #8a93a6; letter-spacing: .5px; }
  h2 { margin: 8px 0 20px; font: 40px/1.15 var(--hand); color: var(--pink); }
  .text { flex: 1; min-height: 0; overflow: hidden; font-size: 24px; line-height: 1.5; }
  .text blockquote { margin: 0 0 .8em; padding: 2px 0 2px 18px; border-left: 4px solid var(--pink); }
  .text p { margin: 0 0 .5em; }
  .text code { font: 500 .9em var(--mono); background: #f3f5f9; padding: 1px 5px; border-radius: 4px; }
  .stop { margin: .2em 0 .5em; font: 500 .7em var(--mono); color: var(--pink); }
  .empty { color: #8a93a6; }
</style></head><body>
${pages}
<script>
  // When the fonts and the pictures are in, long notes shrink until they fit their column; pdfReady tells the server to print
  Promise.all([document.fonts.ready, ...[...document.images].map((i) => i.decode().catch(() => {}))]).then(() => {
    document.querySelectorAll(".text").forEach((t) => {
      for (let s = 24; s > 12 && t.scrollHeight > t.clientHeight; s -= 1) t.style.fontSize = s + "px";
    });
    window.pdfReady = true;
  });
</script>
</body></html>`;
  try {
    const r = await fetch("/__pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html, name, shots: slides.map((f) => new URL(f, location.href).href) }),
    });
    if (!r.ok) throw new Error(r.status === 404 || r.status === 405 ? "restart npm run slides to enable it" : (await r.text()) || r.status);
    const { url, file } = await r.json();
    const href = new URL(url, location.href).href;
    if (tab && !tab.closed) tab.location.replace(href);
    else window.open(href, "_blank");
    // Also a link, in case the browser blocked the tab
    status.innerHTML = `Saved in <a href="${esc(href)}" target="_blank" rel="noopener">${esc(file)}</a>`;
  } catch (e) {
    tab?.close();
    status.textContent = `Not exported: ${e.message}`;
  } finally {
    button.disabled = false;
  }
};
options.querySelector(".options-export").addEventListener("click", exportPdf);

// ?still: the last frame, paused (also after the fonts load, which may restart layout-driven animations)
if (still) {
  ended = true;
  seek(END * loop);
  document.fonts.ready.then(() => seek(END * loop));
}

// Drawing toolbar (D), next to this file; not in the notes window
if (!presenter && !still) document.body.append(Object.assign(document.createElement("script"), { src: new URL("draw.js", document.currentScript.src).href }));

const t = Number(new URLSearchParams(location.hash.slice(1)).get("t"));
if (t) seek(t * loop);
