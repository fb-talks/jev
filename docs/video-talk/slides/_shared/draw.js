// Drawing toolbar over the slide, for presenting live. Loaded by anim.js (not in the notes window).
//   D = open / close the toolbar (open state, tool and color are remembered across slides)
//   Tools: pen · ellipse (dashed guide, then drawn like a pen) · spotlight (the rest dims and blurs) · arrow
//   1–5 = color · Z (or ⌘/Ctrl+Z) = undo · Esc (or C) = clear the slide · the pointer tool lets clicks reach the slide
// Drawings live in a layer outside .frame, so they are not paused or replayed with the slide; they last
// until the page changes. The layer is 1920×1080 like the slide and follows its position and scale.
(() => {
  const frame = document.querySelector(".frame");
  const root = document.documentElement;
  const NS = "http://www.w3.org/2000/svg";
  const css = getComputedStyle(root);
  const colors = ["--pink", "--red", "--blue", "--green", "--amber"].map((v) => css.getPropertyValue(v).trim());

  const STATE = "anim-draw";
  const state = { open: false, tool: "pen", color: 0 };
  try { Object.assign(state, JSON.parse(localStorage.getItem(STATE))); } catch {}
  const save = () => { try { localStorage.setItem(STATE, JSON.stringify(state)); } catch {} };

  const svgEl = (name, attrs = {}) => {
    const e = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  };
  const icon = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;

  // ---------- Layer: same box as the scaled .frame ----------
  const layer = document.createElement("div");
  layer.className = "draw-layer";
  const svg = svgEl("svg", { viewBox: "0 0 1920 1080", width: 1920, height: 1080 });
  layer.append(svg);
  document.body.append(layer);

  const follow = () => {
    const r = frame.getBoundingClientRect();
    layer.style.left = `${r.left}px`;
    layer.style.top = `${r.top}px`;
    layer.style.transform = `scale(${r.width / 1920})`;
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
  const spotlight = (b) => {
    const r = Math.min(18, b.w / 2, b.h / 2);
    const spot = document.createElement("div");
    spot.className = "draw-spot";
    const dim = document.createElement("div");
    dim.className = "draw-spot-dim";
    dim.style.clipPath = `path(evenodd, "M0 0H1920V1080H0Z ${roundRect(b, r)}")`;
    const ring = document.createElement("div");
    ring.className = "draw-spot-ring";
    Object.assign(ring.style, { left: `${b.x}px`, top: `${b.y}px`, width: `${b.w}px`, height: `${b.h}px`, borderRadius: `${r}px` });
    spot.append(dim, ring);
    return spot;
  };

  // ---------- Drawing ----------
  const items = []; // undo stack: one element per shape
  let current = null;
  const add = (e) => { items.push(e); return e; };
  const remove = (e) => { e.remove(); items.splice(items.indexOf(e), 1); };

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
      if (!tiny) layer.insertBefore(add(spotlight(b)), svg);
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
  const tools = {
    "": ["Pointer", '<path d="M6 3.5l12 6.8-5.3 1.7-2.3 5.5z"/>'],
    pen: ["Pen", '<path d="M4 20l1.2-4.2L16 5l3 3L8.2 18.8z"/><path d="M14 7l3 3"/>'],
    ellipse: ["Ellipse", '<ellipse cx="12" cy="12" rx="9" ry="6.5"/>'],
    spot: ["Spotlight", '<rect x="3" y="4" width="18" height="16" rx="2" stroke-dasharray="2.5 2.5"/><rect x="8" y="9" width="8" height="6" rx="1" fill="currentColor"/>'],
    arrow: ["Arrow", '<path d="M5 19L19 5"/><path d="M10 5h9v9"/>'],
  };
  const bar = document.createElement("div");
  bar.className = "draw-bar";
  bar.setAttribute("role", "toolbar");
  bar.setAttribute("aria-label", "Draw on the slide");
  bar.innerHTML =
    Object.entries(tools).map(([k, [title, d]]) => `<button data-tool="${k}" title="${title}" aria-label="${title}">${icon(d)}</button>`).join("") +
    "<hr>" +
    colors.map((c, i) => `<button class="draw-color" data-color="${i}" style="--c: ${c}" title="Color ${i + 1}" aria-label="Color ${i + 1}"></button>`).join("") +
    "<hr>" +
    `<button data-act="undo" title="Undo (Z)" aria-label="Undo">${icon('<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 010 12h-3"/>')}</button>` +
    `<button data-act="clear" title="Clear (Esc)" aria-label="Clear">${icon('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>')}</button>` +
    `<button data-act="close" title="Close (D)" aria-label="Close the toolbar">${icon('<path d="M6 6l12 12M18 6L6 18"/>')}</button>`;
  const launcher = document.createElement("button");
  launcher.className = "draw-launcher";
  launcher.title = "Draw (D)";
  launcher.setAttribute("aria-label", "Draw on the slide");
  launcher.innerHTML = icon(tools.pen[1]);
  document.body.append(bar, launcher);

  const penCursor = (c) =>
    `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="${NS}" width="16" height="16"><circle cx="8" cy="8" r="5" fill="${c}" stroke="white" stroke-width="2"/></svg>`)}") 8 8, crosshair`;
  const render = () => {
    const tool = state.open ? state.tool : "";
    root.classList.toggle("draw-open", state.open);
    root.classList.toggle("drawing", !!tool);
    bar.style.setProperty("--draw-color", colors[state.color]);
    bar.querySelectorAll("[data-tool]").forEach((b) => b.classList.toggle("on", b.dataset.tool === tool));
    bar.querySelectorAll("[data-color]").forEach((b) => b.classList.toggle("on", +b.dataset.color === state.color));
    layer.style.cursor = tool === "pen" ? penCursor(colors[state.color]) : "";
    save();
  };
  const setTool = (tool) => { state.tool = tool; render(); };
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
    else if (b.dataset.color) { state.color = +b.dataset.color; if (!state.tool) state.tool = "pen"; render(); }
    else if (b.dataset.act === "undo") undo();
    else if (b.dataset.act === "clear") clear();
    else if (b.dataset.act === "close") setOpen(false);
  });
  launcher.addEventListener("click", () => { launcher.blur(); setOpen(true); });

  addEventListener("keydown", (e) => {
    if (e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === "z" && !e.shiftKey) { if (e.metaKey || e.ctrlKey) e.preventDefault(); return undo(); }
    if (e.metaKey || e.ctrlKey) return;
    if (k === "d") setOpen(!state.open);
    else if (k === "c" || k === "escape") clear();
    else if (state.open && /^[1-5]$/.test(e.key)) { state.color = +e.key - 1; render(); }
  });

  render();
})();
