// Shared runtime for the docs/digital-assembly-line/slides animations.
//   Plays once, then shows a play button (bottom right) to watch it again
//   Space = pause / resume (replay once ended) · R = restart · page.html#t=0.3 = freeze at 30%
//   ← / → (or PageUp / PageDown) = previous / next slide
//   H = hide / show the on-screen controls (slide number, play button), remembered across slides
//   N = open / close the speaker notes (bottom panel) · click the slide number = jump to any slide
//   P = open the speaker notes in their own window (e.g. a second monitor), kept in sync with the slides
//   D = drawing toolbar over the slide: pen, ellipse, spotlight, arrow (see draw.js)
const frame = document.querySelector(".frame");

// Slide order: add new pages here
const slides = [
  "01-cover.html",
  "02-what-we-do.html",
  "03-how.html",
  "04-who-am-i.html",
  "05-icebreaker-1.html",
  "06-adk.html",
  "07-icebreaker-2.html",
  "08-not-a-test.html",
  "09-bring-to-table.html",
  "10-graveyard.html",
  "11-avoid-all-this.html",
  "12-assembly-line.html",
  "13-example.html",
  "14-requirements.html",
  "15-worst-scenario.html",
  "16-single-agent.html",
  "17-structured-workflow.html",
  "18-one-task-one-agent.html",
  "19-llmagent.html",
  "20-tool.html",
  "21-sub-agents.html",
  "22-demo-1.html",
  "23-context-question.html",
  "24-naive-memory.html",
  "25-structured-handoffs.html",
  "26-session-state.html",
  "27-state-layers.html",
  "28-typed-contracts.html",
  "29-demo-2.html",
  "30-decouple-question.html",
  "31-subagents-vs-tools.html",
  "32-heterogeneity.html",
  "33-mcp-and-a2a.html",
  "34-mcp.html",
  "35-a2a.html",
  "36-mcp-server.html",
  "37-mcp-client.html",
  "38-a2a-code.html",
  "39-demo-3.html",
  "40-evaluating.html",
  "41-eval-metrics.html",
  "42-eval-best-practice.html",
  "43-adk-eval.html",
  "44-in-the-end.html",
  "45-final-architecture.html",
  "46-final-thought.html",
  "47-qa.html",
];

// Speaker notes and slide titles are read from the video script (the only copy): for each slide,
// the section that holds its 🎬 link. Fetched at runtime, so they need http (not file://).
const SCRIPT = "../speaker-notes.md";

const file = location.pathname.split("/").pop();
const go = (step) => {
  const i = slides.indexOf(file);
  const next = slides[i + step];
  if (i !== -1 && next) location.href = next;
};

// page.html?notes is the notes window opened with P: only the notes, full height. It follows the slides
// window and drives it (arrows, Space, R) over a BroadcastChannel, one per deck.
const presenter = new URLSearchParams(location.search).has("notes");
document.documentElement.classList.toggle("presenter", presenter);
if (presenter) document.title = `Notes · ${document.title}`;
const deck = location.pathname.replace(/[^/]*$/, "");
const channel = "BroadcastChannel" in window ? new BroadcastChannel(`anim-deck:${deck}`) : null;
const send = (msg) => channel?.postMessage(msg);

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
dock.append(badge, notesToggle, notesWindow);

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
  if (presenter) return;
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

const showNotes = () => {
  editing = false;
  notesBody.innerHTML = section
    ? `<h2>${inline(section.title)}</h2>${render(section.body)}`
    : `<p class="notes-empty">No section in the script links to ${esc(file)}.</p>`;
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
    if (!editing) showNotes();
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
loadNotes();

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
    if (!fence && cur.length && l.startsWith(">") !== cur[0].startsWith(">")) flush("\n");
    if (l.startsWith("```")) fence = !fence;
    cur.push(l);
  }
  flush("");
  return out;
};
// Spoken parts (> quotes) are edited without the "> ", added back on save. The 🎬 line (it ties the section
// to the slide) and --- separators are kept as they are, not editable.
const isQuote = (c) => c.split("\n").every((l) => l.startsWith(">"));
const fixed = (c) => c.startsWith("🎬") || c === "---";

const editNotes = () => {
  editing = true;
  const [heading, ...rest] = section.part.split("\n");
  const text = rest.join("\n");
  const lead = text.match(/^\s*/)[0];
  const trail = text.slice(lead.length).match(/\s*$/)[0];
  const original = section.part;

  const form = document.createElement("form");
  form.className = "notes-form";
  const blocks = [];
  const area = (kind, value, sep = "\n\n") => {
    const label = document.createElement("label");
    label.textContent = kind === "quote" ? "Spoken" : value.startsWith("```") ? "Code" : "Text";
    const ta = document.createElement("textarea");
    ta.className = kind;
    ta.rows = 1;
    ta.value = value;
    const grow = () => { ta.style.height = "auto"; ta.style.height = `${ta.scrollHeight + 2}px`; };
    ta.addEventListener("input", grow);
    label.append(ta);
    actions.before(label);
    requestAnimationFrame(grow);
    blocks.push({ kind, ta, sep });
    return ta;
  };

  const actions = document.createElement("div");
  actions.className = "notes-actions";
  actions.innerHTML = '<button type="submit" class="notes-btn save">Save</button><button type="button" class="notes-btn cancel">Cancel</button>'
    + '<button type="button" class="notes-btn add-quote">+ Spoken</button><button type="button" class="notes-btn add-text">+ Text</button>'
    + '<span class="notes-status">⌘S save · Esc cancel</span>';
  form.append(actions);
  for (const { sep, text: c } of chunks(text)) {
    if (fixed(c)) blocks.push({ kind: "fixed", value: c, sep });
    else if (isQuote(c)) area("quote", c.split("\n").map((l) => l.replace(/^>\s?/, "")).join("\n"), sep);
    else area("text", c, sep);
  }
  actions.querySelector(".add-quote").addEventListener("click", () => area("quote", "").focus());
  actions.querySelector(".add-text").addEventListener("click", () => area("text", "").focus());
  actions.querySelector(".cancel").addEventListener("click", () => loadNotes().then(showNotes));
  const status = actions.querySelector(".notes-status");

  const save = () => {
    let out = "";
    for (const b of blocks) {
      const v = b.kind === "fixed" ? b.value : b.ta.value.replace(/\s+$/, "");
      if (!v.trim()) continue;
      out += (out ? b.sep || "\n\n" : "") + (b.kind === "quote" ? v.split("\n").map((l) => (l.trim() ? `> ${l}` : ">")).join("\n") : v);
    }
    const updated = `${heading}\n${lead}${out}${trail}`;
    status.textContent = "Saving…";
    fetch("/__notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: new URL(SCRIPT, location.href).pathname, original, updated }),
    }).then((r) => {
      if (r.status === 409) {
        status.textContent = "The section changed in the file: not saved, reload the notes (Cancel) and edit again.";
        return;
      }
      if (!r.ok) throw r.status;
      editing = false;
      loadNotes();
      send({ notes: true });
    }).catch(() => (status.textContent = "Not saved: is npm run slides still running?"));
  };
  form.addEventListener("submit", (e) => { e.preventDefault(); save(); });
  form.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); save(); }
    else if (e.key === "Escape") loadNotes().then(showNotes);
  });

  notesBody.innerHTML = `<h2>${inline(section.title)}</h2>`;
  notesBody.append(form);
  form.querySelector("textarea")?.focus();
};

// H hides the controls; the choice is remembered so it stays off while recording the whole deck
const BARE = "anim-bare";
const setBare = (on) => {
  if (presenter) return;
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
  if (data.go) go(data.go);
  if (data.key === "space") ended ? restart() : togglePause();
  if (data.key === "restart") restart();
};
send(presenter ? { hello: true } : { slide: file });

addEventListener("keydown", (e) => {
  if (e.target.closest?.("textarea, input")) return;
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
    ended ? restart() : togglePause();
  } else if (e.key === "Escape") {
    openMenu(false);
  } else if (e.key === "n" || e.key === "N") {
    setNotes(!document.documentElement.classList.contains("notes-open"));
  } else if (e.key === "p" || e.key === "P") {
    openNotesWindow();
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

// Drawing toolbar (D), next to this file; not in the notes window
if (!presenter) document.body.append(Object.assign(document.createElement("script"), { src: new URL("draw.js", document.currentScript.src).href }));

const t = Number(new URLSearchParams(location.hash.slice(1)).get("t"));
if (t) seek(t * loop);
