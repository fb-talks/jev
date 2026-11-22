// Shared runtime of every slide deck in docs/ (the only copy: changes here reach all decks, present and future).
// A deck loads it from its own <deck>/_shared/anim.js, which first declares the deck's settings:
//   const slides = ["01-cover.html", …];      the slide order (also read by .github/pages/build.mjs)
//   const SCRIPT = "../speaker-notes.md";     the script with the speaker notes: for each slide, the section
//                                             that holds its 🎬 link (fetched at runtime, so http, not file://)
//   Plays once, then shows a play button (bottom right) to watch it again; elements inside [data-forever] keep looping
//   Space = pause / resume (replay once ended) · R = restart · page.html#t=0.3 = freeze at 30%
//   ← / → (or PageUp / PageDown) = previous / next slide
//   Stops: "⏸ 6.0s" above a spoken part in the script = the slide waits there (set them from the notes editor:
//   slider + markers); without any, data-stops="0.26,0.5" on .frame (fractions of the loop). → / PageDown
//   or Space to go on (not the mouse: it is for pointing and drawing) (→ while a step is playing jumps to the end of that step)
//   H = hide / show the on-screen controls (slide number, play button), remembered across slides
//   N = open / close the speaker notes (bottom or right panel: the two buttons in the dock) · click the slide number = jump to any slide
//   Slides with stops show one square per step, bottom right: pink = on screen, grey = still to come
//   P = open the speaker notes in their own window (e.g. a second monitor), kept in sync with the slides
//   F = full screen (also the button bottom right)
//   D = drawing toolbar over the slide: pen, ellipse, spotlight, arrow (see draw.js)
//   O (or the toolbar's gear → Export, or ⋮ in the notes → Export) = Export: this slide (copy image, PNG) or all
//   of them (PDF, PNGs), at their last frame, with or without notes, into _export/ or a folder you choose
//   page.html?still = the last frame only, no controls, no notes, no keys (the pages of the PDF export)
const frame = document.querySelector(".frame");



const file = location.pathname.split("/").pop();
// leaveEdit: set while the notes editor is open; saves unsaved changes before leaving the slide
let leaveEdit = null;
// saveEdit: the editor's save, for the Save button at the top of the notes panel; previewEdit: back to the
// notes as read while presenting, saving the changes first
let saveEdit = null;
let previewEdit = null;
// Slide status, from `const slideStatus = { "05c-….html": "draft" }` in the deck's _shared/anim.js (set from ⋮ in
// the notes or on each slide of the slide list): "draft" = shown with a DRAFT badge; "hidden" = out of the talk
// (← / →, the numbering, the deck bar, Export of all slides) but still in the slide list, dimmed
const STATUS = typeof slideStatus === "object" && slideStatus ? { ...slideStatus } : {};
const statusOf = (f) => (STATUS[f] === "draft" || STATUS[f] === "hidden" ? STATUS[f] : "");
const talk = () => slides.filter((f) => statusOf(f) !== "hidden");
// Position in the talk (1, 2, …), 0 for a hidden slide
const num = (f) => talk().indexOf(f) + 1;
const goTo = (next) => (leaveEdit ? leaveEdit() : Promise.resolve(true)).then((ok) => ok && (location.href = next));
// step slides forward or back, skipping the hidden ones
const go = (step) => {
  let j = slides.indexOf(file);
  if (j === -1) return;
  for (let n = Math.abs(step); n > 0;) {
    j += Math.sign(step);
    if (!slides[j]) return;
    if (statusOf(slides[j]) !== "hidden") n--;
  }
  goTo(slides[j]);
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
};
const proceed = () => {
  if (held) {
    held = false;
    once().forEach((a) => a.play());
    return true;
  }
  // A step is still playing: jump to its end and go straight on with the next step (which waits at its own stop)
  if (!ended && nextStop < stops.length) {
    const time = stops[nextStop++] * loop;
    once().forEach((a) => { a.currentTime = time; a.play(); });
    return true;
  }
  return false;
};
const togglePause = () => {
  const running = animations().some((a) => a.playState === "running");
  animations().forEach((a) => (running ? a.pause() : a.play()));
};

// No play-again button: once a slide ends, Space or R plays it again
const restart = () => {
  ended = false;
  held = false;
  nextStop = 0;
  animations().forEach((a) => { a.currentTime = 0; a.play(); });
};

// A click on the slide does nothing: the mouse is for pointing and drawing, → / Space go on

// Links marked data-next (e.g. the cover's Start button) open the next slide in the deck
const linkNext = () => {
  const nextSlide = slides.slice(slides.indexOf(file) + 1).find((f) => statusOf(f) !== "hidden");
  if (nextSlide) document.querySelectorAll("[data-next]").forEach((a) => (a.href = nextSlide));
};
linkNext();

// Slide number, bottom left: "05e · 12 / 15" (the file prefix, then the position in the deck).
// Clicking it opens the slide list, as tall as the window.
const prefix = (f) => f.split("-")[0];
const dock = document.createElement("div");
dock.className = "dock";
const badge = document.createElement("button");
badge.className = "slide-id";
badge.setAttribute("aria-label", "Go to slide");
const index = slides.indexOf(file);
const showBadge = () => {
  badge.textContent = prefix(file) + (index === -1 ? "" : num(file) ? ` · ${num(file)} / ${talk().length}` : " · hidden");
};
showBadge();
// DRAFT / HIDDEN, top left of the slide area (not in the exports)
const flag = Object.assign(document.createElement("div"), { className: "slide-flag" });
const showFlag = () => {
  const s = statusOf(file);
  flag.textContent = s.toUpperCase();
  flag.className = `slide-flag${s ? ` is-${s}` : ""}`;
  flag.title = s === "hidden" ? "Hidden: left out of the talk (← / → skip it)" : s === "draft" ? "Draft" : "";
};
showFlag();
const notesToggle = document.createElement("button");
notesToggle.className = "notes-toggle";
// An icon (a page with lines); hidden while the notes are open, the panel has its own ✕
notesToggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>';
notesToggle.title = "Speaker notes (N)";
notesToggle.setAttribute("aria-label", "Speaker notes");
const notesWindow = document.createElement("button");
notesWindow.className = "notes-window";
notesWindow.textContent = "↗";
notesWindow.title = "Notes in a new window (P)";
notesWindow.setAttribute("aria-label", "Open the notes in a new window");
// Where the notes panel sits: one button before ✕ switches it between the bottom and the right; its icon shows
// where the panel goes on click
const sideToggle = Object.assign(document.createElement("button"), { className: "notes-place notes-side" });
const showSide = () => {
  const label = notesRight ? "Notes at the bottom" : "Notes on the right";
  sideToggle.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/>${notesRight ? '<path d="M3 14h18"/>' : '<path d="M14 4v16"/>'}</svg>`;
  sideToggle.title = label;
  sideToggle.setAttribute("aria-label", label);
};
sideToggle.addEventListener("click", () => {
  sideToggle.blur();
  notesRight = !notesRight;
  try { notesRight ? localStorage.setItem(SIDE, "right") : localStorage.removeItem(SIDE); } catch {}
  showSide();
  setNotes(true);
});
dock.append(badge);
// Bottom right: Notes and ↗ (the notes in their own window)
const dockRight = Object.assign(document.createElement("div"), { className: "dock dock-right" });
// In the notes window only: put the notes back into the slides window (and close this one)
const notesBack = Object.assign(document.createElement("button"), { className: "notes-back", textContent: "⇲ Back to the slides window" });
notesBack.title = "Close this window and open the notes in the slides window";
// Full screen (F): the window, on and off
const fullscreen = Object.assign(document.createElement("button"), { className: "fullscreen", title: "Full screen (F)" });
fullscreen.setAttribute("aria-label", "Full screen");
const FS_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg>';
const FS_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5"/></svg>';
const toggleFullscreen = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {});
const showFullscreen = () => { fullscreen.innerHTML = document.fullscreenElement ? FS_OFF : FS_ON; };
showFullscreen();
document.addEventListener("fullscreenchange", showFullscreen);
fullscreen.addEventListener("click", () => { fullscreen.blur(); toggleFullscreen(); });
dockRight.append(notesToggle, notesWindow, fullscreen, notesBack);

const menu = document.createElement("nav");
menu.className = "slide-menu";
const slideTitle = (f) => f.replace(/^[^-]+-/, "").replace(/\.html$/, "").replaceAll("-", " ");
const current = (f) => (f === file ? ' class="current" aria-current="page"' : "");
const DOTS = '<span class="row-dots" role="button" tabindex="-1" title="Status: draft, hidden" aria-label="Slide status">'
  + '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg></span>';
// Two views, switched from the sticky buttons on top (remembered): a list, or cards three to a row with a
// preview of each slide (its last frame, ?still, loaded as it scrolls into view)
menu.innerHTML = '<div class="menu-head"><button data-view="list">List</button><button data-view="cards">Cards</button></div>'
  + '<div class="menu-list">' + slides
  // Position in the talk (what the presenter says and the badge counts), then the file prefix; ⋮ sets the status
  .map((f) => `<a href="${f}"${current(f)}><b class="slide-n"></b><code>${prefix(f)}</code><span class="slide-title">${slideTitle(f)}</span><em class="slide-tag"></em>${DOTS}</a>`)
  .join("") + '</div><div class="menu-cards"></div>';
// The status popup of the slide list (⋮ on a row or a card): one for the whole menu
const statusPop = Object.assign(document.createElement("div"), { className: "notes-place-menu status-pop", hidden: true });
statusPop.setAttribute("role", "menu");
menu.append(statusPop);
// Numbers, tags and dimming of every row and card, from the status
const markMenu = () => menu.querySelectorAll(".menu-list a, .menu-cards a").forEach((a) => {
  const f = a.getAttribute("href");
  const s = statusOf(f);
  a.classList.toggle("is-draft", s === "draft");
  a.classList.toggle("is-hidden", s === "hidden");
  a.querySelector(".slide-n").textContent = num(f) || "–";
  const tag = a.querySelector(".slide-tag");
  if (tag) tag.textContent = s;
});
markMenu();
menu.addEventListener("click", (e) => {
  const dots = e.target.closest(".row-dots");
  if (!dots) { if (!statusPop.contains(e.target)) statusPop.hidden = true; return; }
  e.preventDefault();
  e.stopPropagation();
  const f = dots.closest("a").getAttribute("href");
  if (!statusPop.hidden && statusPop.dataset.file === f) { statusPop.hidden = true; return; }
  statusPop.dataset.file = f;
  statusPop.replaceChildren(...statusItems(f, () => { statusPop.hidden = true; }));
  statusPop.hidden = false;
  const r = dots.getBoundingClientRect();
  const m = menu.getBoundingClientRect();
  statusPop.style.top = `${Math.min(r.bottom + 4 - m.top + menu.scrollTop, menu.scrollTop + menu.clientHeight - statusPop.offsetHeight - 8)}px`;
  statusPop.style.left = `${Math.max(8, r.right - m.left - statusPop.offsetWidth)}px`;
});
menu.addEventListener("scroll", () => { statusPop.hidden = true; });
const VIEW = "anim-menu-view";
let menuView = "list";
try { menuView = localStorage.getItem(VIEW) === "cards" ? "cards" : "list"; } catch {}
const cards = menu.querySelector(".menu-cards");
// The previews are 1920×1080 pages scaled to the card width
new ResizeObserver(() => {
  const w = cards.querySelector(".card-shot")?.clientWidth;
  if (w) cards.style.setProperty("--s", w / 1920);
}).observe(cards);
const setView = (view) => {
  menuView = view;
  try { localStorage.setItem(VIEW, view); } catch {}
  menu.classList.toggle("cards", view === "cards");
  menu.querySelectorAll("[data-view]").forEach((b) => b.classList.toggle("on", b.dataset.view === view));
  if (view === "cards" && !cards.children.length) {
    const titles = [...menu.querySelectorAll(".menu-list a .slide-title")].map((s) => s.innerHTML);
    cards.innerHTML = slides.map((f, i) => `<a href="${f}"${current(f)}><div class="card-shot">`
      + `<iframe src="${f}?still" loading="lazy" tabindex="-1" aria-hidden="true"></iframe><b class="slide-n"></b><em class="slide-tag"></em>${DOTS}</div>`
      + `<span class="slide-title">${titles[i]}</span></a>`).join("");
    markMenu();
  }
  if (menu.classList.contains("open")) menu.querySelector(`.menu-${view} .current`)?.scrollIntoView({ block: "center" });
};
menu.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => { b.blur(); setView(b.dataset.view); }));
const openMenu = (on) => {
  menu.classList.toggle("open", on);
  if (on) setView(menuView);
};
badge.addEventListener("click", (e) => {
  e.stopPropagation();
  badge.blur();
  openMenu(!menu.classList.contains("open"));
});
addEventListener("click", (e) => { if (!menu.contains(e.target)) openMenu(false); });

// Deck bar: a thin line along the top of the slide area, filled up to this slide. Near it a thumb and a
// tooltip show the slide under the pointer (number and title); click or drag it to jump to another slide.
const deckBar = document.createElement("div");
deckBar.className = "deck-bar";
deckBar.innerHTML = '<div class="deck-track"><div class="deck-fill"></div><div class="deck-thumb"></div></div>'
  + '<div class="deck-tip"><div class="deck-shot"><iframe tabindex="-1" aria-hidden="true"></iframe></div><b></b><span></span></div>';
document.body.append(deckBar);
{
  const track = deckBar.querySelector(".deck-track");
  const fill = deckBar.querySelector(".deck-fill");
  const thumb = deckBar.querySelector(".deck-thumb");
  const tip = deckBar.querySelector(".deck-tip");
  // Only the slides of the talk (no hidden ones): i is a position in talk(). A hidden slide on screen sits
  // halfway between the talk slides around it.
  const last = () => Math.max(1, talk().length - 1);
  const pos = (i) => `${(Math.max(0, i) / last()) * 100}%`;
  const here = () => (num(file) ? num(file) - 1 : talk().filter((f) => slides.indexOf(f) < index).length - 0.5);
  // Preview of the slide under the pointer: its last frame (?still), loaded a moment after the pointer stops
  // on it, only while the tooltip is shown
  const frameEl = tip.querySelector("iframe");
  let shotTimer = 0, shotOf = "";
  const preview = (i) => {
    clearTimeout(shotTimer);
    const f = talk()[i];
    if (!deckBar.classList.contains("hover") || f === shotOf || !f) return;
    shotTimer = setTimeout(() => {
      shotOf = f;
      tip.classList.add("loading");
      frameEl.onload = () => tip.classList.remove("loading");
      frameEl.src = `${f}?still`;
    }, 60);
  };
  const pick = (x) => {
    const r = track.getBoundingClientRect();
    return Math.round(Math.min(1, Math.max(0, (x - r.left) / r.width)) * last());
  };
  // Thumb and tooltip on slide i (the fill follows only while dragging); the tooltip kept inside the bar
  const show = (i) => {
    thumb.style.left = pos(i);
    if (dragging) fill.style.width = pos(i);
    tip.querySelector("b").textContent = i + 1;
    tip.querySelector("span").textContent = menu.querySelectorAll(".menu-list a .slide-title")[slides.indexOf(talk()[i])]?.textContent || "";
    preview(i);
    const r = track.getBoundingClientRect();
    const half = tip.offsetWidth / 2;
    const x = r.left + (i / last()) * r.width;
    tip.style.left = `${Math.min(innerWidth - notesWidth - half - 8, Math.max(half + 8, x))}px`;
  };
  let dragging = false;
  // Back on this slide: fill and thumb only. The tooltip stays where it is while it fades out (moving it to this
  // slide, and loading its preview, made it jump across the bar)
  const rest = () => { clearTimeout(shotTimer); fill.style.width = thumb.style.left = pos(here()); };
  rest();
  addEventListener("anim-layout", rest);
  addEventListener("anim-status", rest);
  addEventListener("resize", rest);
  // The tooltip is part of the bar: it can be grabbed and dragged too. Leaving closes it after a moment,
  // so the pointer can move from the line up to the tooltip
  let leaving = 0;
  deckBar.addEventListener("pointerenter", (e) => { clearTimeout(leaving); deckBar.classList.add("hover"); show(pick(e.clientX)); });
  deckBar.addEventListener("pointermove", (e) => { if (dragging || !tip.contains(e.target)) show(pick(e.clientX)); });
  deckBar.addEventListener("pointerleave", () => {
    if (dragging) return;
    leaving = setTimeout(() => { deckBar.classList.remove("hover"); rest(); }, 350);
  });
  deckBar.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragging = true;
    deckBar.setPointerCapture(e.pointerId);
    deckBar.classList.add("hover", "dragging");
    show(pick(e.clientX));
  });
  deckBar.addEventListener("pointerup", (e) => {
    if (!dragging) return;
    dragging = false;
    deckBar.classList.remove("dragging");
    const i = pick(e.clientX);
    if (index !== -1 && talk()[i] && talk()[i] !== file) goTo(talk()[i]);
    else { deckBar.classList.remove("hover"); rest(); }
  });
  deckBar.addEventListener("click", (e) => e.stopPropagation());
}

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
// ⋮ opens a dropdown: Export, Status (the gear next to it: Slide details)
const placeWrap = Object.assign(document.createElement("div"), { className: "notes-more" });
const placeToggle = Object.assign(document.createElement("button"), { className: "notes-place notes-dots", title: "More" });
placeToggle.setAttribute("aria-label", "More");
placeToggle.setAttribute("aria-haspopup", "true");
placeToggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>';
const placeMenu = Object.assign(document.createElement("div"), { className: "notes-place-menu", hidden: true });
placeMenu.setAttribute("role", "menu");
placeToggle.addEventListener("click", () => {
  placeToggle.blur();
  details.hidden = true;
  statusGroup.hidden = !dev;
  if (dev) statusGroup.replaceChildren(...statusItems(file, () => { placeMenu.hidden = true; }));
  placeMenu.hidden = !placeMenu.hidden;
});
addEventListener("pointerdown", (e) => {
  if (!placeWrap.contains(e.target)) placeMenu.hidden = true;
  if (!detailsWrap.contains(e.target)) details.hidden = true;
});
// Slide details (the gear in the notes head, with npm run slides): the small label and the title at the top left of
// the slide (its .kicker), saved into the slide's .html; the <title> of the page follows the title
const details = Object.assign(document.createElement("form"), { className: "slide-details", hidden: true });
details.innerHTML = '<b>Slide details</b>'
  + '<label>Label<input name="label" autocomplete="off" placeholder="Intro to Jev · 4"></label>'
  + '<label>Title<input name="title" autocomplete="off" required></label>'
  + '<div class="slide-details-actions"><button class="notes-btn save">Save</button>'
  + '<button type="button" class="notes-btn cancel">Cancel</button><span class="notes-status"></span></div>';
const detailsWrap = Object.assign(document.createElement("div"), { className: "notes-more notes-details", hidden: true });
const detailsItem = Object.assign(document.createElement("button"), { className: "notes-place notes-gear", title: "Slide details: label and title" });
detailsItem.setAttribute("aria-label", "Slide details");
detailsItem.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';
const field = (name) => details.querySelector(`[name="${name}"]`);
const KICKER = /<div class="kicker">(?:<small>([\s\S]*?)<\/small>)?([\s\S]*?)<\/div>/;
const kickerParts = () => {
  const k = document.querySelector(".kicker");
  const small = k.querySelector("small");
  const title = [...k.childNodes].filter((n) => n !== small).map((n) => n.textContent).join("").trim();
  return { k, small, label: small?.textContent.trim() || "", title };
};
detailsItem.addEventListener("click", () => {
  detailsItem.blur();
  placeMenu.hidden = true;
  if (!details.hidden) { details.hidden = true; return; }
  // A slide with its own layout (cover, title, speakers…) has no label + title at the top left: say so
  const none = !document.querySelector(".kicker");
  details.classList.toggle("no-kicker", none);
  details.querySelectorAll("input, .save").forEach((el) => (el.disabled = none));
  if (none) {
    field("label").value = field("title").value = "";
    details.querySelector(".notes-status").textContent = "This slide has its own layout, without the label and title at the top left: change its text in the .html.";
    details.hidden = false;
    return;
  }
  const { label, title } = kickerParts();
  field("label").value = label;
  field("title").value = title;
  details.querySelector(".notes-status").textContent = "";
  details.hidden = false;
  field("title").focus();
});
details.querySelector(".cancel").addEventListener("click", () => { details.hidden = true; });
details.addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Escape") details.hidden = true; });
details.addEventListener("submit", (e) => {
  e.preventDefault();
  const status = details.querySelector(".notes-status");
  const label = field("label").value.trim();
  const title = field("title").value.trim();
  const post = (original, updated) => fetch("/__notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: location.pathname, original, updated }),
  }).then((r) => { if (!r.ok) throw r.status; });
  status.textContent = "Saving…";
  fetch(location.pathname, { cache: "no-store" }).then((r) => r.text()).then(async (src) => {
    const m = src.match(KICKER);
    if (!m) throw "kicker";
    await post(m[0], `<div class="kicker">${label ? `<small>${esc(label)}</small>` : ""}${esc(title)}</div>`);
    // "<title>03c · The simplest call</title>": only the part after the prefix, if it was the old title
    const t = src.match(/<title>([^<]*?) · ([^<]*)<\/title>/);
    if (t && t[2].trim() === m[2].trim()) await post(t[0], `<title>${t[1]} · ${esc(title)}</title>`);
    // On screen right away, without reloading the slide (its animation keeps going)
    const { k, small } = kickerParts();
    [...k.childNodes].filter((n) => n !== small).forEach((n) => n.remove());
    if (label) (small || k.appendChild(document.createElement("small"))).textContent = label;
    else small?.remove();
    k.append(title);
    if (t && t[2].trim() === m[2].trim()) document.title = `${t[1]} · ${title}`;
    details.hidden = true;
  }).catch((err) => {
    status.textContent = err === 409 ? "The slide changed in the file: reload and try again."
      : err === "kicker" ? "No kicker found in the slide's .html." : "Not saved: is npm run slides running (restarted)?";
  });
});
placeWrap.append(placeToggle, placeMenu);
detailsWrap.append(detailsItem, details);
const headPreview = Object.assign(document.createElement("button"), { className: "notes-btn notes-head-preview", textContent: "Preview", title: "Back to the notes as you read them while presenting (saves first)" });
headPreview.addEventListener("click", () => { headPreview.blur(); previewEdit?.(); });
notes.querySelector(".notes-head").append(headTimeline, headPreview, headSave, detailsWrap, placeWrap, sideToggle, headClose);
// ⋮ → Export: the same panel as O and the toolbar's gear
const exportItem = Object.assign(document.createElement("button"), { className: "notes-place-item" });
exportItem.setAttribute("role", "menuitem");
exportItem.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg><span>Export</span>';
exportItem.addEventListener("click", () => { exportItem.blur(); placeMenu.hidden = true; showOptions(true); });
placeMenu.append(exportItem);
// ⋮ → Status (with npm run slides): Normal, Draft or Hidden for this slide, the same as ⋮ in the slide list
const statusGroup = Object.assign(document.createElement("div"), { className: "status-group", hidden: true });
placeMenu.append(statusGroup);

// Status items: Normal, Draft, Hidden, with a check on the current one. Saved into slideStatus in the deck's
// _shared/anim.js (POST /__notes), applied here right away and sent to the deck's other windows.
const STATUS_ITEMS = [
  ["", "Normal", "In the talk", '<path d="M5 12l5 5 9-10"/>'],
  ["draft", "Draft", "In the talk, with a DRAFT badge", '<path d="M4 20l4-1 11-11-3-3L5 16z"/>'],
  ["hidden", "Hidden", "Out of the talk, only in this list", '<path d="M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 6c5 0 9 6 9 6a16 16 0 0 1-3 3.4M6.6 6.6A16 16 0 0 0 3 12s4 6 9 6a9 9 0 0 0 4.4-1.1"/>'],
];
const statusItems = (f, done) => {
  const head = Object.assign(document.createElement("div"), { className: "status-head", textContent: `Status · ${prefix(f)}` });
  const note = Object.assign(document.createElement("div"), { className: "notes-status status-msg" });
  const items = STATUS_ITEMS.map(([value, label, hint, icon]) => {
    const b = document.createElement("button");
    b.className = `notes-place-item status-item${statusOf(f) === value ? " on" : ""}`;
    b.setAttribute("role", "menuitemradio");
    b.setAttribute("aria-checked", String(statusOf(f) === value));
    b.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg><span>${label}<small>${hint}</small></span>`;
    b.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      b.blur();
      if (statusOf(f) === value) return done();
      note.textContent = "Saving…";
      saveStatus(f, value).then(done, (err) => {
        note.textContent = err === 409 ? "The deck's anim.js changed: reload and try again."
          : "Not saved: is npm run slides running (restarted)?";
      });
    });
    return b;
  });
  return [head, ...items, note];
};
const DECK_JS = new URL("_shared/anim.js", location.href).pathname;
const STATUS_NOTE = `// Slides kept out of the talk without deleting them (set from ⋮ in the notes or in the slide list):
// "draft" = shown with a DRAFT badge; "hidden" = skipped by ← / →, the numbering and the export, only in the slide list`;
const saveStatus = async (f, value) => {
  const src = await fetch(DECK_JS, { cache: "no-store" }).then((r) => (r.ok ? r.text() : Promise.reject(r.status)));
  const next = { ...STATUS };
  if (value) next[f] = value;
  else delete next[f];
  const rows = slides.filter((x) => next[x]).map((x) => `  "${x}": "${next[x]}",`);
  const block = `const slideStatus = {${rows.length ? `\n${rows.join("\n")}\n` : ""}};`;
  const old = src.match(/const slideStatus = \{[\s\S]*?\};/);
  const list = src.match(/const slides = \[[\s\S]*?\];/);
  if (!old && !list) throw "slides";
  const r = await fetch("/__notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(old
      ? { path: DECK_JS, original: old[0], updated: block }
      : { path: DECK_JS, original: list[0], updated: `${list[0]}\n\n${STATUS_NOTE}\n${block}` }),
  });
  if (!r.ok) throw r.status;
  applyStatus(next);
  send({ status: next });
};
// The status in force everywhere on this page: badge, flag, slide list, deck bar, data-next links
const applyStatus = (next) => {
  Object.keys(STATUS).forEach((k) => delete STATUS[k]);
  Object.assign(STATUS, next);
  showBadge();
  showFlag();
  markMenu();
  linkNext();
  dispatchEvent(new Event("anim-status"));
};
document.body.append(menu, dock, dockRight, notes, flag);

// N opens the notes; the choice is remembered across slides, like their place (bottom or right, the dock buttons)
const NOTES = "anim-notes";
const SIDE = "anim-notes-side";
let notesRight = false;
try { notesRight = localStorage.getItem(SIDE) === "right"; } catch {}
showSide();
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
    menu.classList.toggle("dev", dev);
    detailsWrap.hidden = !dev;
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
      if (title) a.querySelector(".slide-title").innerHTML = inline(title);
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
// Stops end half a second before the final frame: a stop later than that would be a step with nothing left to show
const lastStop = Math.max(0, Math.round((maxS - 0.5) * 10) / 10);
const secs = (t) => (Math.round(t * 10) / 10).toFixed(1);
// The step a spoken part belongs to: how many stops come at or before its start (0 = the first step)
// Steps: one per point where a spoken part starts. A part is on from the moment → takes the slide past its stop
// up to the next stop, the wait there included: it is what you say while the slide builds and then waits. When no
// part starts at 0, the slide opens with a transition (it plays up to the first stop and waits with nothing to
// say): no step of its own.
// stepOf: the step (0, 1…) of a part starting at that time.
let leadStep = true;
const stepOf = (time) => stops.filter((x) => x * loopS <= time + 0.01).length - (leadStep ? 0 : 1);
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
  // No stop on the last frame: it would be a step with nothing left to show (the editor keeps them before it too)
  out.forEach((b) => { b.time = Math.min(b.time, lastStop); });
  return out;
};
const applyStops = () => {
  if (section && /^⏸/m.test(section.body)) {
    const parts = spoken(section.body);
    setStops(parts.map((b) => b.time / loopS));
    leadStep = parts.some((b) => b.time === 0);
  } else {
    setStops(htmlStops);
    leadStep = true;
  }
};
// Scrubbing from the notes editor: the slide waits at that point, → plays on from there
const scrub = (t) => {
  seek(t * 1000, once());
  ended = false;
  held = true;
  nextStop = stops.filter((x) => x * loop <= t * 1000 + 1).length;
};
// ← on a slide with stops: undoes the last →. The slide goes back to the stop where the current step started and
// waits there (the step before is on again; → plays the step once more). In the first step (or the opening
// transition) there is nothing to undo: it returns false and ← changes slide.
const back = () => {
  if (!stops.length) return false;
  const passed = stops.map((x) => x * loop).filter((x) => x < now() - 1);
  if (!passed.length) return false;
  scrub(passed.at(-1) / 1000);
  return true;
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
  let sliding = false;
  slider.addEventListener("pointerdown", () => { sliding = true; });
  addEventListener("pointerup", () => { sliding = false; });
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
    // The slider follows the slide, also when it jumps while paused (← to the previous stop, the presenter
    // window); not while you drag it
    const pos = clampT(now() / 1000);
    if (!sliding && Number(slider.value) !== pos) setSlider(pos);
    if (on !== shown) { play.innerHTML = on ? PAUSE : PLAY; play.classList.toggle("on", on); shown = on; }
    // The spoken part(s) for the point the slide is at: the latest start at or before it
    // Same rule as the steps: a part is on once → takes the slide past its stop, up to the next wait included
    const t = now() / 1000;
    const live = quotes().map((q) => q.time).filter((x) => x === 0 || x < t - 0.001);
    const at = live.length ? Math.max(...live) : -1;
    quotes().forEach((q) => q.label.classList.toggle("current", q.time === at));
    requestAnimationFrame(follow);
  };
  requestAnimationFrame(follow);

  // blocks: the section in order, "fixed" (kept as they are, not shown) and "quote" (one per spoken part)
  const blocks = [];
  const quotes = () => blocks.filter((b) => b.kind === "quote");
  const setTime = (b, t) => {
    b.time = Math.min(lastStop, clampT(t));
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
    label.querySelector("input").max = lastStop;
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
      const t = next !== undefined ? next : maxS;
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

// Step indicator, bottom right (slides with stops only): one square per step, pink for the steps already
// on screen, grey for those still to come
const steps = document.createElement("div");
steps.className = "anim-steps";
steps.setAttribute("aria-hidden", "true");
document.body.append(steps);
let stepsShown = "";
const showSteps = (t) => {
  // A step starts when → takes the slide past its stop: waiting at a stop is still the step before (in an opening
  // transition, before the first stop is passed: none yet)
  const total = stops.length + (leadStep ? 1 : 0);
  const done = stops.filter((x) => x * loop < t - 1).length + (leadStep ? 1 : 0);
  const key = stops.length ? `${done}/${total}` : "";
  if (key === stepsShown) return;
  stepsShown = key;
  steps.innerHTML = stops.length ? Array.from({ length: total }, (_, i) => `<i class="${i < done ? "done" : ""}"></i>`).join("") : "";
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
  }
  requestAnimationFrame(watch);
};
requestAnimationFrame(watch);

// The slides window announces its slide on every load and the notes window follows it; a notes window
// that has just opened asks which slide is on screen. Keys pressed in the notes window drive the slides.
// After a notes edit is saved, the other window reloads its notes.
// Several tabs can show the same deck: each one has an id (kept across its slides) and the time it was last
// used (loaded while focused, or focused). The notes window follows only one of them, the last used, and
// drives only that one; otherwise two tabs on different slides would bounce it back and forth for ever.
let tabId = "";
try { tabId = sessionStorage.getItem("anim-tab") || ""; } catch {}
if (!tabId) {
  tabId = Math.random().toString(36).slice(2);
  try { sessionStorage.setItem("anim-tab", tabId); } catch {}
}
let usedAt = document.hasFocus() ? Date.now() : 0;
const announce = () => send({ slide: file, tab: tabId, at: usedAt });
let leader = null;
try { leader = JSON.parse(sessionStorage.getItem("anim-leader")); } catch {}
const follow = (data) => {
  if (leader && data.tab !== leader.tab && data.at <= leader.at) return;
  leader = { tab: data.tab, at: Math.max(data.at, leader?.tab === data.tab ? leader.at : 0) };
  try { sessionStorage.setItem("anim-leader", JSON.stringify(leader)); } catch {}
  if (data.slide !== file) location.replace(`${data.slide}?notes`);
};
const mine = (data) => !data.tab || data.tab === tabId;
if (channel) channel.onmessage = ({ data }) => {
  if (data.notes) loadNotes();
  if (data.status) applyStatus(data.status);
  if (presenter) {
    if (data.slide && data.tab) follow(data);
    return;
  }
  if (data.hello) announce();
  if (!mine(data)) return;
  if (data.dock) setNotes(true);
  if (data.go) (data.go === 1 ? proceed() : back()) || go(data.go);
  if (data.key === "space") ended ? restart() : held ? proceed() : togglePause();
  if (data.key === "restart") restart();
};
if (presenter) {
  send({ hello: true });
  notesBack.addEventListener("click", () => { send({ dock: true, tab: leader?.tab }); window.close(); });
}
else {
  announce();
  addEventListener("focus", () => { usedAt = Date.now(); announce(); });
}

addEventListener("keydown", (e) => {
  if (still || e.target.closest?.("textarea, input")) return;
  if (!options.hidden) { if (e.key === "Escape") showOptions(false); return; }
  if (presenter) {
    const step = { ArrowRight: 1, PageDown: 1, ArrowLeft: -1, PageUp: -1 }[e.key];
    if (step || e.code === "Space") e.preventDefault();
    const to = leader?.tab;
    if (step) send({ go: step, tab: to });
    else if (e.code === "Space") send({ key: "space", tab: to });
    else if (e.key === "r" || e.key === "R") send({ key: "restart", tab: to });
    return;
  }
  if (e.code === "Space") {
    e.preventDefault();
    ended ? restart() : held ? proceed() : togglePause();
  } else if (e.key === "Escape") {
    openMenu(false);
  } else if (e.key === "n" || e.key === "N") {
    setNotes(!document.documentElement.classList.contains("notes-open"));
  } else if ((e.key === "f" || e.key === "F") && !e.metaKey && !e.ctrlKey) {
    toggleFullscreen();
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
    back() || go(-1);
  }
});

// ---------- Export (O, the gear menu of the drawing toolbar, or ⋮ in the notes): a modal in the middle ----------
// This slide: copy it as an image, or save it as PNG. All slides: one PDF, or one PNG each. With or without notes
// (slide on the left, its spoken parts on the right). Saved in the deck's _export/ folder (by the dev server,
// POST /__export in serve.mjs), or also into a folder of your choice (File System Access, Chrome).
const options = document.createElement("div");
options.className = "options";
options.hidden = true;
const canPick = "showDirectoryPicker" in window;
options.innerHTML = `<div class="options-box" role="dialog" aria-modal="true" aria-labelledby="options-title">
  <button type="button" class="options-close" aria-label="Close">×</button>
  <h2 id="options-title">Export</h2>
  <label class="options-check"><input type="checkbox" name="notes"> Include notes <span>(slide on the left, speaker notes on the right)</span></label>
  ${canPick ? `<label class="options-dest">Save to <select name="dest"><option value="project">the deck's _export folder</option><option value="pick">a folder I choose…</option></select></label>` : ""}
  <section>
    <h3>This slide</h3>
    <p class="options-this"></p>
    <div class="options-row"><button type="button" class="notes-btn save" data-export="copy">Copy image</button><button type="button" class="notes-btn" data-export="png-one">Save PNG</button></div>
  </section>
  <section>
    <h3 class="options-all"></h3>
    <p>Each at its last frame (hidden slides left out).</p>
    <div class="options-row"><button type="button" class="notes-btn save" data-export="pdf">Export PDF</button><button type="button" class="notes-btn" data-export="png-all">Export PNGs</button></div>
  </section>
  <p class="options-status" aria-live="polite"></p>
</div>`;
document.body.append(options);
const withNotes = options.querySelector("[name=notes]");
const dest = options.querySelector("[name=dest]");
const PDF_NOTES = "anim-pdf-notes";
const DEST = "anim-export-dest";
try {
  withNotes.checked = localStorage.getItem(PDF_NOTES) === "1";
  if (dest) dest.value = localStorage.getItem(DEST) === "pick" ? "pick" : "project";
} catch {}
withNotes.addEventListener("change", () => { try { withNotes.checked ? localStorage.setItem(PDF_NOTES, "1") : localStorage.removeItem(PDF_NOTES); } catch {} });
dest?.addEventListener("change", () => { try { localStorage.setItem(DEST, dest.value); } catch {} });
const exportStatus = options.querySelector(".options-status");
const showOptions = (on) => {
  options.hidden = !on;
  if (!on) return;
  const n = slides.indexOf(file);
  options.querySelector(".options-this").textContent = `${num(file) || prefix(file)} · ${menu.querySelectorAll(".menu-list a .slide-title")[n]?.textContent || prefix(file)}, at its last frame.`;
  options.querySelector(".options-all").textContent = `All ${talk().length} slides`;
  options.querySelector("[data-export=copy]").focus();
};
options.addEventListener("click", (e) => { if (e.target === options || e.target.closest(".options-close")) showOptions(false); });
addEventListener("anim-options", () => showOptions(true));

// The print page: one 1920×1080 .page per slide (with notes: the slide on the left 65%, its spoken parts on the
// right); the server puts a picture of each slide's last frame in it, then prints it (PDF) or shoots each page (PNG)
const deckName = deck.split("/").filter(Boolean).at(-2) || "slides";
const printPage = async (list, notesToo, name) => {
  let all = {};
  if (notesToo) {
    try { all = sections(await fetch(SCRIPT, { cache: "no-store" }).then((r) => (r.ok ? r.text() : Promise.reject(r.status)))); } catch {}
  }
  const css = getComputedStyle(document.documentElement);
  const v = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
  const notesHtml = (f) => {
    const sec = all[f];
    const title = sec ? inline(sec.title.replace(/^\S+ · |^\d+\. /, "")) : esc(slideTitle(f));
    const parts = sec ? spoken(sec.body) : [];
    const body = parts.length
      ? parts.map((b, k) => (b.time > 0 && b.time !== parts[k - 1]?.time ? `<div class="stop">→ ${secs(b.time)} s</div>` : "") + (blank(b.text) ? "" : render(b.text))).join("")
      : '<p class="empty">No speaker notes.</p>';
    return `<div class="side"><div class="meta">${esc(prefix(f))} · ${num(f) ? `${num(f)} / ${talk().length}` : "hidden"}</div><h2>${title}</h2><div class="text">${body}</div></div>`;
  };
  const pages = list.map((f, k) => {
    return `<section class="page" data-name="${esc(prefix(f))}"><div class="shot"><img data-shot="${k}" alt=""></div>${notesToo ? notesHtml(f) : ""}</section>`;
  }).join("\n");
  return `<!doctype html><html${notesToo ? ' class="with-notes"' : ""}><head><meta charset="utf-8"><title>${esc(name)}</title>
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
};

// Runs one export on the dev server; resolves to its files [{ url, file, name }]
let exporting = false;
const exportName = (list, notesToo) => `${deckName} - ${list.length === 1 ? prefix(list[0]) : "slides"}${notesToo ? " + notes" : ""}`;
const runExport = async (format, list, notesToo) => {
  const name = exportName(list, notesToo);
  const html = await printPage(list, notesToo, name);
  const r = await fetch("/__export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html, name, format, shots: list.map((f) => new URL(f, location.href).href) }),
  });
  if (!r.ok) throw new Error(r.status === 404 || r.status === 405 ? "restart npm run slides to enable it" : (await r.text()) || r.status);
  return (await r.json()).files;
};
// Copies the files where you chose (asked for at the click, while the browser allows it): one file through
// "Save as" (any folder, Desktop and Documents too), several into a folder (Chrome refuses system folders such as
// Desktop, Documents or Downloads themselves: pick or create a folder inside them)
const writeTo = async (target, files) => {
  for (const f of files) {
    const blob = await fetch(f.url, { cache: "no-store" }).then((r) => r.blob());
    const handle = target.kind === "file" ? target : await target.getFileHandle(f.name, { create: true });
    const w = await handle.createWritable();
    await w.write(blob);
    await w.close();
  }
};
const busy = (on) => {
  exporting = on;
  options.querySelectorAll("[data-export]").forEach((b) => (b.disabled = on));
};
options.querySelectorAll("[data-export]").forEach((button) => button.addEventListener("click", async () => {
  if (exporting) return;
  if (!dev) { exportStatus.textContent = "Export needs the dev server: npm run slides."; return; }
  const kind = button.dataset.export;
  const notesToo = withNotes.checked;
  const list = kind === "copy" || kind === "png-one" ? [file] : talk();
  const format = kind === "pdf" ? "pdf" : "png";
  busy(true);
  exportStatus.textContent = list.length > 1 ? `Rendering ${list.length} slides… (about ${Math.ceil(list.length * 0.8)} s)` : "Rendering the slide…";
  try {
    if (kind === "copy") {
      // The clipboard write starts inside the click; the picture arrives when the server has made it
      const files = runExport(format, list, notesToo);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": files.then((f) => fetch(f[0].url, { cache: "no-store" }).then((r) => r.blob())) })]);
      exportStatus.textContent = "Copied: paste it anywhere.";
      return;
    }
    let dir = null;
    if (dest?.value === "pick") {
      const single = list.length === 1 || format === "pdf";
      const ext = format === "pdf" ? "pdf" : "png";
      exportStatus.textContent = "Choose where to save…";
      try {
        dir = single && "showSaveFilePicker" in window
          ? await showSaveFilePicker({
            id: "slides-export",
            suggestedName: `${exportName(list, notesToo)}.${ext}`,
            types: [{ description: ext.toUpperCase(), accept: { [ext === "pdf" ? "application/pdf" : "image/png"]: [`.${ext}`] } }],
          })
          : await showDirectoryPicker({ id: "slides-export", mode: "readwrite" });
      } catch {
        exportStatus.textContent = single ? "Not exported: no file chosen." : "Not exported: no folder chosen (system folders like Desktop or Documents can't be picked: choose or create a folder inside them).";
        return;
      }
    }
    if (dir) exportStatus.textContent = list.length > 1 ? `Rendering ${list.length} slides… (about ${Math.ceil(list.length * 0.8)} s)` : "Rendering the slide…";
    // The PDF opens in a new tab: opened now, inside the click (later the browser would block it)
    const tab = kind === "pdf" && !dir ? window.open("", "_blank") : null;
    tab?.document.write('<title>Exporting PDF…</title><p style="font: 18px sans-serif; padding: 24px">Exporting the PDF…</p>');
    tab?.document.close();
    let files;
    try { files = await runExport(format, list, notesToo); } catch (e) { tab?.close(); throw e; }
    const first = new URL(files[0].url, location.href).href;
    if (tab && !tab.closed) tab.location.replace(first);
    if (dir) {
      exportStatus.textContent = `Saving into ${dir.name}…`;
      await writeTo(dir, files);
    }
    const where = dir ? (dir.kind === "file" ? esc(dir.name) : `the folder ${esc(dir.name)}`) : files.length > 1 ? esc(files[0].file.replace(/\/[^/]*$/, "/")) : "";
    exportStatus.innerHTML = files.length > 1
      ? `Saved ${files.length} PNGs in ${where}`
      : `Saved${dir ? ` in ${where} and` : ""} in <a href="${esc(first)}" target="_blank" rel="noopener">${esc(files[0].file)}</a>`;
  } catch (e) {
    exportStatus.textContent = `Not exported: ${e.message}`;
  } finally {
    busy(false);
  }
}));

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
