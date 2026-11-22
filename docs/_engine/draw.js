// Drawing toolbar over the slide, for presenting live. Loaded by anim.js (not in the notes window).
//   D = open / close the toolbar (open state, tool, color and place are remembered across slides)
//   It sits top right, next to the notes panel or the window edge; the ‹ menu can put it at the bottom
//   center instead (between the slide number and the notes button), laid out in a row
//   Tools: pen (B) · ellipse (E: dashed guide, then drawn like a pen) · spotlight (S: the rest dims and blurs) · arrow (A)
//   Esc = clear the drawings and back to the pointer tool (clicks reach the slide again); Esc and Delete work even
//   with the keyboard shortcuts switched off
//   1–5 = color · Z (or ⌘/Ctrl+Z) = undo · Delete / Backspace = clear the slide
//   The toolbar shows the tools, the timer, the color (its button opens the 5 colors beside the toolbar) and close;
//   the gear below opens, beside it, undo, clear, Export (the options of anim.js: Export PDF) and a switch that turns off
//   every keyboard shortcut of the toolbar (O too)
//   T = timer (on by default): each shape fades out 4s after it is drawn; off, shapes stay until Delete
// Drawings live in a layer outside .frame, so they are not paused or replayed with the slide; they last
// until the page changes (or the timer takes them). The layer covers the whole window, so drawings can start and
// spill outside the slide; inside it a 1920×1080 stage follows the slide's position and scale.
(() => {
  const frame = document.querySelector(".frame");
  const root = document.documentElement;
  const NS = "http://www.w3.org/2000/svg";
  const css = getComputedStyle(root);
  const colors = ["--pink", "--red", "--blue", "--green", "--amber"].map((v) => css.getPropertyValue(v).trim());

  const STATE = "anim-draw";
  const state = { open: false, tool: "pen", color: 0, timer: true };
  try { Object.assign(state, JSON.parse(localStorage.getItem(STATE))); } catch {}
  const save = () => { try { localStorage.setItem(STATE, JSON.stringify(state)); } catch {} };

  const svgEl = (name, attrs = {}) => {
    const e = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  };
  const icon = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;

  // ---------- Layer: the whole window; the stage inside it is the same box as the scaled .frame ----------
  const layer = document.createElement("div");
  layer.className = "draw-layer";
  const stage = document.createElement("div");
  stage.className = "draw-stage";
  const svg = svgEl("svg", { viewBox: "0 0 1920 1080", width: 1920, height: 1080 });
  stage.append(svg);
  layer.append(stage);
  document.body.append(layer);

  const follow = () => {
    const r = frame.getBoundingClientRect();
    stage.style.left = `${r.left}px`;
    stage.style.top = `${r.top}px`;
    stage.style.transform = `scale(${r.width / 1920})`;
  };
  new MutationObserver(follow).observe(frame, { attributes: true, attributeFilter: ["style"] });
  addEventListener("resize", follow);
  follow();

  const point = (e) => {
    const r = frame.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * 1920) / r.width, y: ((e.clientY - r.top) * 1080) / r.height };
  };

  // ---------- Shapes ----------
  const f = (p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  // Quadratic curves through the midpoints: a smooth line through noisy points
  const smooth = (pts) => {
    if (pts.length < 3) return `M${f(pts[0])}L${f(pts.at(-1))}`;
    let d = `M${f(pts[0])}`;
    for (let i = 1; i < pts.length - 1; i++) {
      d += `Q${f(pts[i])} ${f({ x: (pts[i].x + pts[i + 1].x) / 2, y: (pts[i].y + pts[i + 1].y) / 2 })}`;
    }
    return d + `L${f(pts.at(-1))}`;
  };
  // A hand-drawn ellipse: starts top-left, goes a bit more than a full turn and drifts outwards at the end
  const handEllipse = (cx, cy, rx, ry) => {
    const pts = [];
    const n = 80, start = -Math.PI * 0.62, sweep = Math.PI * 2 * 1.08;
    for (let i = 0; i <= n; i++) {
      const t = i / n, a = start + sweep * t;
      const k = 0.985 + 0.045 * t + 0.012 * Math.sin(t * Math.PI * 3);
      pts.push({ x: cx + rx * k * Math.cos(a), y: cy + ry * k * Math.sin(a) });
    }
    return smooth(pts);
  };
  const arrowPath = (a, b) => {
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    const head = Math.min(40, Math.hypot(b.x - a.x, b.y - a.y) * 0.45);
    const wing = (s) => ({ x: b.x - head * Math.cos(ang + s * 0.5), y: b.y - head * Math.sin(ang + s * 0.5) });
    return `M${f(a)}L${f(b)}M${f(wing(1))}L${f(b)}L${f(wing(-1))}`;
  };
  const box = (a, b) => ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) });
  const roundRect = ({ x, y, w, h }, r) =>
    `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}` +
    `H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;

  // Spotlight: one at a time, under the strokes. The dim + blur layer has a hole cut out with clip-path.
  // Its edges and corners can be dragged to resize it: handles show up when the pointer is near them, with the
  // matching arrows (↔ ↕ ⤡ ⤢), with any tool or none.
  const SPILL = 4000;
  const MIN = 40;
  // While resizing only the ring moves (its wide shadow dims the rest): changing the clip-path of the blurred
  // layer on every move made Chrome paint it for a frame without its hole (the whole slide dimmed, a flicker)
  const placeSpot = (spot, b, dim = true) => {
    spot.box = b;
    const r = Math.min(18, b.w / 2, b.h / 2);
    if (dim) {
      const hole = roundRect({ ...b, x: b.x + SPILL, y: b.y + SPILL }, r);
      spot.dim.style.clipPath = `path(evenodd, "M0 0H${1920 + 2 * SPILL}V${1080 + 2 * SPILL}H0Z ${hole}")`;
    }
    Object.assign(spot.ring.style, { left: `${b.x}px`, top: `${b.y}px`, width: `${b.w}px`, height: `${b.h}px`, borderRadius: `${r}px` });
  };
  // [handle, cursor]: n/s move the top/bottom edge, e/w the right/left one, the corners both
  const HANDLES = [["n", "ns-resize"], ["s", "ns-resize"], ["e", "ew-resize"], ["w", "ew-resize"],
    ["nw", "nwse-resize"], ["se", "nwse-resize"], ["ne", "nesw-resize"], ["sw", "nesw-resize"]];
  const spotlight = (b) => {
    const spot = document.createElement("div");
    spot.className = "draw-spot";
    spot.dim = document.createElement("div");
    spot.dim.className = "draw-spot-dim";
    // The dim spills SPILL px past the slide on every side so the margins dim too; the path is in its own coordinates
    spot.dim.style.inset = `-${SPILL}px`;
    spot.ring = document.createElement("div");
    spot.ring.className = "draw-spot-ring";
    spot.append(spot.dim, spot.ring);
    for (const [side, cursor] of HANDLES) {
      const el = document.createElement("div");
      el.className = `draw-spot-handle h-${side}`;
      el.style.cursor = cursor;
      el.addEventListener("pointerenter", () => spot.classList.add("resizable"));
      el.addEventListener("pointerleave", () => { if (!spot.resizing) spot.classList.remove("resizable"); });
      el.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        el.setPointerCapture(e.pointerId);
        clearTimeout(timers.get(spot));
        timers.delete(spot);
        spot.getAnimations().forEach((a) => a.cancel());
        spot.resizing = { start: point(e), box: { ...spot.box } };
        spot.classList.add("resizable", "resizing");
      });
      el.addEventListener("pointermove", (e) => {
        if (!spot.resizing) return;
        const p = point(e);
        const o = spot.resizing.box;
        const dx = p.x - spot.resizing.start.x, dy = p.y - spot.resizing.start.y;
        let { x, y, w, h } = o;
        if (side.includes("w")) { x = Math.min(o.x + dx, o.x + o.w - MIN); w = o.x + o.w - x; }
        if (side.includes("e")) w = Math.max(MIN, o.w + dx);
        if (side.includes("n")) { y = Math.min(o.y + dy, o.y + o.h - MIN); h = o.y + o.h - y; }
        if (side.includes("s")) h = Math.max(MIN, o.h + dy);
        placeSpot(spot, { x, y, w, h }, false);
      });
      const end = () => {
        if (!spot.resizing) return;
        spot.resizing = null;
        // The blurred layer gets its new hole while still hidden, and shows again two frames later
        placeSpot(spot, spot.box);
        requestAnimationFrame(() => requestAnimationFrame(() => { if (!spot.resizing) spot.classList.remove("resizing"); }));
        if (state.timer) expire(spot);
      };
      el.addEventListener("pointerup", end);
      el.addEventListener("pointercancel", end);
      spot.ring.append(el);
    }
    placeSpot(spot, b);
    return spot;
  };

  // ---------- Drawing ----------
  const items = []; // undo stack: one element per shape
  let current = null;
  const TIMER_MS = 4000;
  const timers = new Map(); // shape → pending fade-out
  const expire = (e) => {
    if (timers.has(e)) return;
    timers.set(e, setTimeout(() => {
      e.animate([{ opacity: 0 }], { duration: 400, easing: "ease-in", fill: "forwards" }).finished.then(() => items.includes(e) && remove(e));
    }, TIMER_MS));
  };
  const add = (e) => { items.push(e); if (state.timer) expire(e); return e; };
  const remove = (e) => { clearTimeout(timers.get(e)); timers.delete(e); e.remove(); items.splice(items.indexOf(e), 1); };

  layer.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || !state.tool) return;
    e.preventDefault();
    layer.setPointerCapture(e.pointerId);
    const p = point(e);
    const color = colors[state.color];
    if (state.tool === "pen") {
      const path = svgEl("path", { class: "draw-stroke", stroke: color, d: smooth([p, p]) });
      svg.append(path);
      current = { el: path, pts: [p], last: p };
    } else if (state.tool === "arrow") {
      const path = svgEl("path", { class: "draw-stroke", stroke: color });
      svg.append(path);
      current = { el: path, start: p };
    } else {
      // Ellipse and spotlight: a light dashed guide while dragging
      const guide = svgEl(state.tool === "ellipse" ? "ellipse" : "rect", { class: "draw-guide", stroke: color, rx: 0 });
      svg.append(guide);
      current = { el: guide, start: p };
    }
    current.tool = state.tool;
    current.color = color;
  });

  layer.addEventListener("pointermove", (e) => {
    if (!current) return;
    if (current.tool === "pen") {
      // Light low-pass filter on every coalesced point, then the midpoint curves
      for (const ev of e.getCoalescedEvents?.() ?? [e]) {
        const raw = point(ev);
        const p = { x: current.last.x + (raw.x - current.last.x) * 0.5, y: current.last.y + (raw.y - current.last.y) * 0.5 };
        current.last = p;
        if (Math.hypot(p.x - current.pts.at(-1).x, p.y - current.pts.at(-1).y) > 2) current.pts.push(p);
      }
      current.el.setAttribute("d", smooth(current.pts));
      return;
    }
    const p = point(e);
    current.end = p;
    if (current.tool === "arrow") return current.el.setAttribute("d", arrowPath(current.start, p));
    const b = box(current.start, p);
    if (current.tool === "ellipse") {
      for (const [k, v] of Object.entries({ cx: b.x + b.w / 2, cy: b.y + b.h / 2, rx: b.w / 2, ry: b.h / 2 })) current.el.setAttribute(k, v);
    } else {
      for (const [k, v] of Object.entries({ x: b.x, y: b.y, width: b.w, height: b.h, rx: Math.min(18, b.w / 2, b.h / 2) })) current.el.setAttribute(k, v);
    }
  });

  const finish = (e) => {
    if (!current) return;
    const c = current;
    current = null;
    const end = e.type === "pointerup" ? point(e) : c.end;
    if (c.tool === "pen") {
      c.pts.push(end ?? c.pts.at(-1)); // the filter lags behind: end on the real last point
      c.el.setAttribute("d", smooth(c.pts));
      return add(c.el);
    }
    const tiny = !end || Math.hypot(end.x - c.start.x, end.y - c.start.y) < 12;
    if (c.tool === "arrow") {
      if (tiny) return c.el.remove();
      c.el.setAttribute("d", arrowPath(c.start, end));
      return add(c.el);
    }
    c.el.remove();
    const b = box(c.start, end ?? c.start);
    if (c.tool === "spot") {
      // A click without a drag just switches the spotlight off
      items.filter((i) => i.classList.contains("draw-spot")).forEach(remove);
      if (!tiny) stage.insertBefore(add(spotlight(b)), svg);
      return;
    }
    if (tiny) return;
    // Ellipse: the dashed guide stays a moment, then a pen stroke draws the ellipse over it and the guide fades
    const g = add(svgEl("g"));
    const guide = svgEl("ellipse", { class: "draw-guide", stroke: c.color, cx: b.x + b.w / 2, cy: b.y + b.h / 2, rx: b.w / 2, ry: b.h / 2 });
    const stroke = svgEl("path", { class: "draw-stroke", stroke: c.color, d: handEllipse(b.x + b.w / 2, b.y + b.h / 2, b.w / 2, b.h / 2) });
    g.append(guide, stroke);
    svg.append(g);
    const len = stroke.getTotalLength();
    stroke.setAttribute("stroke-dasharray", len);
    stroke.setAttribute("stroke-dashoffset", len);
    stroke.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 750, delay: 150, easing: "cubic-bezier(.5,0,.25,1)", fill: "forwards" });
    guide.animate([{ opacity: 0 }], { duration: 300, delay: 800, fill: "forwards" });
  };
  layer.addEventListener("pointerup", finish);
  layer.addEventListener("pointercancel", finish);

  const undo = () => items.length && remove(items.at(-1));
  const clear = () => [...items].forEach(remove);

  // ---------- Toolbar ----------
  // [name, shortcut, icon]
  const tools = {
    "": ["Pointer", "Esc", '<path d="M6 3.5l12 6.8-5.3 1.7-2.3 5.5z"/>'],
    pen: ["Pen", "B", '<path d="M4 20l1.2-4.2L16 5l3 3L8.2 18.8z"/><path d="M14 7l3 3"/>'],
    ellipse: ["Ellipse", "E", '<ellipse cx="12" cy="12" rx="9" ry="6.5"/>'],
    spot: ["Spotlight", "S", '<rect x="3" y="4" width="18" height="16" rx="2" stroke-dasharray="2.5 2.5"/><rect x="8" y="9" width="8" height="6" rx="1" fill="currentColor"/>'],
    arrow: ["Arrow", "A", '<path d="M5 19L19 5"/><path d="M10 5h9v9"/>'],
  };
  const toolKeys = Object.fromEntries(Object.entries(tools).filter(([k]) => k).map(([k, [, key]]) => [key.toLowerCase(), k]));
  const bar = document.createElement("div");
  bar.className = "draw-bar";
  bar.setAttribute("role", "toolbar");
  bar.setAttribute("aria-label", "Draw on the slide");
  bar.innerHTML =
    // A small ✕ in the corner
    '<div class="draw-top">' +
    `<button class="draw-x" data-act="close" data-tip="Close (D)" aria-label="Close the toolbar">${icon('<path d="M7 7l10 10M17 7L7 17"/>')}</button>` +
    "</div>" +
    Object.entries(tools).map(([k, [name, key, d]]) => `<button data-tool="${k}" data-tip="${name} (${key})" aria-label="${name}">${icon(d)}</button>`).join("") +
    "<hr>" +
    `<button data-act="timer" data-tip="Timer: fade after 4s (T)" aria-label="Timer">${icon('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>')}</button>` +
    `<button class="draw-swatch" data-act="colors" data-tip="Color (1–5)" aria-label="Color" aria-haspopup="true"></button>` +
    `<button class="draw-chevron" data-act="menu" data-tip="Settings" aria-label="Settings" aria-haspopup="true">${icon('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/>')}</button>`;
  // Flyouts (colors, more) next to the button that opens them: left of it with the toolbar on the right,
  // above it with the toolbar at the bottom. On the body, not in the toolbar, which scrolls and would clip them.
  const bottom = () => state.dock === "bottom";
  const flyout = (el, on, anchor) => {
    el.classList.toggle("on", on);
    if (!on) return;
    const b = anchor.getBoundingClientRect(), r = bar.getBoundingClientRect();
    const w = el.offsetWidth, h = el.offsetHeight;
    el.classList.toggle("up", bottom());
    if (bottom()) {
      el.style.left = `${Math.max(4, Math.min(b.left + b.width / 2 - w / 2, innerWidth - w - 4))}px`;
      el.style.top = `${r.top - h - 10}px`;
    } else {
      el.style.left = `${Math.max(4, r.left - w - 10)}px`;
      el.style.top = `${Math.max(4, Math.min(b.top + b.height / 2 - h / 2, innerHeight - h - 4))}px`;
    }
  };
  // Colors: a vertical bar
  const palette = document.createElement("div");
  palette.className = "draw-palette";
  palette.setAttribute("role", "menu");
  palette.innerHTML = colors.map((c, i) => `<button class="draw-color" data-color="${i}" style="--c: ${c}" data-tip="Color ${i + 1} (${i + 1})" aria-label="Color ${i + 1}"><span class="draw-key">${i + 1}</span></button>`).join("");
  // More: undo, clear, options, and the switch for the toolbar's keyboard shortcuts
  const menu = document.createElement("div");
  menu.className = "draw-menu";
  menu.setAttribute("role", "menu");
  menu.innerHTML =
    `<button data-act="undo">${icon('<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 010 12h-3"/>')}<span>Undo</span><kbd>Z</kbd></button>` +
    `<button data-act="clear">${icon('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>')}<span>Clear drawings</span><kbd>Del</kbd></button>` +
    `<button data-act="options">${icon('<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>')}<span>Export</span><kbd>O</kbd></button>` +
    `<hr><label class="draw-switch"><input type="checkbox" data-act="hotkeys"><span>Keyboard shortcuts</span><i></i></label>` +
    `<label class="draw-switch"><input type="checkbox" data-act="dock"><span>Toolbar at the bottom</span><i></i></label>`;
  const showPalette = (on) => { if (on) flyout(menu, false); flyout(palette, on, bar.querySelector(".draw-swatch")); };
  const showMenu = (on) => { if (on) flyout(palette, false); flyout(menu, on, bar.querySelector(".draw-chevron")); };
  palette.addEventListener("click", (e) => {
    const b = e.target.closest("[data-color]");
    if (!b) return;
    state.color = +b.dataset.color;
    if (!state.tool) state.tool = "pen";
    showPalette(false);
    render();
  });
  menu.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    b.blur();
    showMenu(false);
    if (b.dataset.act === "undo") undo();
    else if (b.dataset.act === "clear") clear();
    else if (b.dataset.act === "options") dispatchEvent(new CustomEvent("anim-options"));
  });
  menu.querySelector("[data-act=hotkeys]").addEventListener("change", (e) => { state.hotkeys = e.target.checked; render(); });
  menu.querySelector("[data-act=dock]").addEventListener("change", (e) => {
    state.dock = e.target.checked ? "bottom" : "right";
    showMenu(false);
    render();
  });
  addEventListener("pointerdown", (e) => {
    if (palette.classList.contains("on") && !palette.contains(e.target) && !e.target.closest?.(".draw-swatch")) showPalette(false);
    if (menu.classList.contains("on") && !menu.contains(e.target) && !e.target.closest?.(".draw-chevron")) showMenu(false);
  });
  // Each button shows its shortcut, the key in brackets in its tooltip ("Pen (B)" → B)
  bar.querySelectorAll("[data-tip]:not(.draw-x)").forEach((b) => {
    const k = b.dataset.tip.match(/\(([^)]+)\)$/)?.[1];
    if (k) b.insertAdjacentHTML("beforeend", `<span class="draw-key">${k === "Delete" ? "Del" : k}</span>`);
  });
  const launcher = document.createElement("button");
  launcher.className = "draw-launcher";
  launcher.dataset.tip = "Draw (D)";
  launcher.setAttribute("aria-label", "Draw on the slide");
  launcher.innerHTML = icon(tools.pen[2]);
  // Tooltip: one element on the body, left of the hovered button (the bar scrolls, so it cannot hold it)
  const tip = document.createElement("div");
  tip.className = "draw-tip";
  document.body.append(bar, launcher, tip, palette, menu);
  const showTip = (e) => {
    const b = e.target.closest?.("[data-tip]");
    if (!b) return tip.classList.remove("on");
    const r = b.getBoundingClientRect();
    tip.textContent = b.dataset.tip;
    // Left of the button, or above it with the toolbar at the bottom
    tip.classList.toggle("up", bottom());
    tip.style.left = bottom() ? `${r.left + r.width / 2}px` : "";
    tip.style.right = bottom() ? "" : `${innerWidth - r.left + 10}px`;
    tip.style.top = bottom() ? `${r.top - 10}px` : `${r.top + r.height / 2}px`;
    tip.classList.add("on");
  };
  for (const el of [bar, launcher, palette]) {
    el.addEventListener("pointerover", showTip);
    el.addEventListener("pointerleave", () => tip.classList.remove("on"));
  }

  // ---------- Place: top right (next to the notes on the right, or the window edge) or bottom center; CSS does
  // the rest (--notes-w / --notes-h from anim.js). Open flyouts follow.
  delete state.pos;
  const place = () => {
    root.classList.toggle("draw-bottom", bottom());
    for (const [el, show, a] of [[palette, showPalette], [menu, showMenu]]) if (el.classList.contains("on")) show(true);
  };
  addEventListener("resize", place);
  addEventListener("anim-layout", place);

  const penCursor = (c) =>
    `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="${NS}" width="16" height="16"><circle cx="8" cy="8" r="5" fill="${c}" stroke="white" stroke-width="2"/></svg>`)}") 8 8, crosshair`;
  const render = () => {
    const tool = state.open ? state.tool : "";
    root.classList.toggle("draw-open", state.open);
    tip.classList.remove("on");
    root.classList.toggle("drawing", !!tool);
    bar.style.setProperty("--draw-color", colors[state.color]);
    bar.querySelectorAll("[data-tool]").forEach((b) => b.classList.toggle("on", b.dataset.tool === tool));
    palette.querySelectorAll("[data-color]").forEach((b) => b.classList.toggle("on", +b.dataset.color === state.color));
    bar.querySelector(".draw-swatch").style.setProperty("--c", colors[state.color]);
    if (!state.open) { showPalette(false); showMenu(false); }
    // Shortcuts off: no key does anything to the toolbar, and the buttons stop showing them
    const hotkeys = state.hotkeys !== false;
    root.classList.toggle("draw-no-keys", !hotkeys);
    menu.querySelector("[data-act=hotkeys]").checked = hotkeys;
    menu.querySelector("[data-act=dock]").checked = bottom();
    const timerBtn = bar.querySelector('[data-act="timer"]');
    timerBtn.classList.toggle("on", state.timer);
    timerBtn.setAttribute("aria-pressed", state.timer);
    layer.style.cursor = tool === "pen" ? penCursor(colors[state.color]) : "";
    place();
    save();
  };
  const setTool = (tool) => { state.tool = tool; render(); };
  // Off: pending fades are cancelled, the shapes stay. On: shapes already there get their 4s too.
  const setTimer = (on) => {
    state.timer = on;
    if (on) items.forEach(expire);
    else { timers.forEach(clearTimeout); timers.clear(); }
    render();
  };
  const setOpen = (on) => {
    state.open = on;
    if (on && !state.tool) state.tool = "pen";
    render();
  };

  bar.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    b.blur();
    if (b.dataset.tool !== undefined) setTool(b.dataset.tool);
    else if (b.dataset.act === "colors") showPalette(!palette.classList.contains("on"));
    else if (b.dataset.act === "menu") showMenu(!menu.classList.contains("on"));
    else if (b.dataset.act === "timer") setTimer(!state.timer);
    else if (b.dataset.act === "close") setOpen(false);
  });
  launcher.addEventListener("click", () => { launcher.blur(); setOpen(true); });

  addEventListener("keydown", (e) => {
    if (e.altKey || e.target.closest?.("textarea, input")) return;
    const k = e.key.toLowerCase();
    // Esc and Delete work even with the shortcuts off. Esc: drawings cleared and back to the pointer, unless it is
    // closing something else (slide menu, Export panel, a flyout)
    if (k === "escape") {
      const busy = palette.classList.contains("on") || menu.classList.contains("on")
        || document.querySelector(".slide-menu.open, .options:not([hidden])");
      showPalette(false);
      showMenu(false);
      if (!busy) { clear(); setTool(""); }
      return;
    }
    if (k === "delete" || k === "backspace") { e.preventDefault(); return clear(); }
    if (state.hotkeys === false) return;
    if (k === "z" && !e.shiftKey) { if (e.metaKey || e.ctrlKey) e.preventDefault(); return undo(); }
    if (e.metaKey || e.ctrlKey) return;
    if (k === "d") setOpen(!state.open);
    else if (toolKeys[k]) { state.tool = toolKeys[k]; setOpen(true); }
    else if (k === "t") setTimer(!state.timer);
    else if (state.open && /^[1-5]$/.test(e.key)) { state.color = +e.key - 1; render(); }
  }, true); // capture: before anim.js closes the slide menu or the Export panel on the same Esc

  render();
})();
