// Serves the decks locally with caching off, so edits to slides, anim.js/anim.css and the scripts show up on reload.
//   node serve.mjs [dir] [--port 3210]      (dir defaults to docs)
// URLs keep their .html: anim.js finds the current slide from the file name, so no clean-URL redirects.
// Dev mode: every response carries X-Slides-Dev, which makes the speaker notes editable in anim.js, and
// POST /__notes saves an edited section back into the script .md, and POST /__pdf renders the Export PDF of
// the options (anim.js) with headless Chrome ($CHROME overrides the macOS default path). Listens on localhost only.
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const i = args.indexOf("--port");
const port = i === -1 ? 3210 : Number(args.splice(i, 2)[1]);
const root = path.resolve(args[0] ?? "docs");
const inside = (file) => file === root || file.startsWith(root + path.sep);

const types = {
  ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json",
  ".md": "text/markdown", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".webp": "image/webp", ".mp4": "video/mp4", ".pdf": "application/pdf", ".woff2": "font/woff2", ".ico": "image/x-icon",
};
const headers = { "Cache-Control": "no-store", "X-Slides-Dev": "1" };

// { path, original, updated }: replaces the section `original` of a script .md with `updated`.
// 409 when `original` is not in the file exactly once (e.g. the file was edited meanwhile): nothing is written.
const saveNotes = (req, res) => {
  // Only JSON from this origin: a page on another site cannot send it without a CORS preflight, which fails here
  const origin = req.headers.origin;
  if ((origin && new URL(origin).host !== req.headers.host) || req.headers["content-type"] !== "application/json") {
    return res.writeHead(403, headers).end();
  }
  let body = "";
  req.on("data", (c) => {
    body += c;
    if (body.length > 1e6) req.destroy();
  });
  req.on("end", () => {
    try {
      const { path: p, original, updated } = JSON.parse(body);
      const file = path.join(root, decodeURIComponent(p));
      if (!inside(file) || path.extname(file) !== ".md" || typeof original !== "string" || typeof updated !== "string" || !original) {
        return res.writeHead(400, headers).end();
      }
      const md = fs.readFileSync(file, "utf8");
      if (md.split(original).length !== 2) return res.writeHead(409, headers).end("Section changed in the file");
      fs.writeFileSync(file, md.replace(original, () => updated));
      console.log(`notes saved: ${path.relative(process.cwd(), file)}`);
      res.writeHead(204, headers).end();
    } catch {
      res.writeHead(400, headers).end();
    }
  });
};

// { html, shots, name }: shots are slide URLs of this server (opened with ?still, their last frame). Each one is
// screenshotted at 2× in headless Chrome, html (the print page built by anim.js, with <img data-shot="i">) gets
// the pictures, and Chrome prints it to <slides folder>/_export/<name>.pdf; the reply is { url } of that file. Pictures, not iframes: Chrome fails to print a page
// with dozens of slide iframes. One export at a time.
let rendering = false;
const exportPdf = (req, res) => {
  const origin = req.headers.origin;
  if ((origin && new URL(origin).host !== req.headers.host) || req.headers["content-type"] !== "application/json") {
    return res.writeHead(403, headers).end();
  }
  if (rendering) return res.writeHead(409, headers).end("An export is already running");
  let body = "";
  req.on("data", (c) => {
    body += c;
    if (body.length > 5e6) req.destroy();
  });
  req.on("end", async () => {
    let browser, dir;
    try {
      const { html, shots, name } = JSON.parse(body);
      const base = `http://${req.headers.host}/`;
      if (typeof html !== "string" || !Array.isArray(shots) || !shots.length || shots.some((u) => typeof u !== "string" || !u.startsWith(base))) {
        return res.writeHead(400, headers).end();
      }
      // Next to the slides, in _export/ (ignored by git, like the videos and stills of export.mjs)
      const slidesDir = path.dirname(path.join(root, decodeURIComponent(new URL(shots[0]).pathname)));
      const outFile = path.join(slidesDir, "_export", `${String(name || "slides").replace(/[^\w .+-]/g, "_")}.pdf`);
      if (!inside(outFile)) return res.writeHead(400, headers).end();
      rendering = true;
      dir = fs.mkdtempSync(path.join(os.tmpdir(), "slides-pdf-"));
      const chrome = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
      const debug = 9800 + Math.floor(Math.random() * 150);
      browser = spawn(chrome, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--window-size=1920,1080",
        `--remote-debugging-port=${debug}`, `--user-data-dir=${path.join(dir, "profile")}`, "about:blank"], { stdio: "ignore" });
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      let target;
      for (let n = 0; n < 50 && !target; n++) {
        await sleep(200);
        try { target = (await (await fetch(`http://localhost:${debug}/json`)).json()).find((p) => p.type === "page"); } catch {}
      }
      if (!target) throw new Error("Chrome did not start (set $CHROME?)");
      const ws = new WebSocket(target.webSocketDebuggerUrl);
      await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
      let id = 0;
      const pending = {};
      ws.onmessage = (m) => { const d = JSON.parse(m.data); pending[d.id]?.(d); delete pending[d.id]; };
      const send = (method, params = {}) => new Promise((r) => { pending[++id] = r; ws.send(JSON.stringify({ id, method, params })); });
      const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
      const loaded = async () => {
        for (let n = 0; n < 100 && (await evaluate("document.readyState")) !== "complete"; n++) await sleep(100);
      };

      await send("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1080, deviceScaleFactor: 2, mobile: false });
      for (const [n, url] of shots.entries()) {
        const u = new URL(url);
        u.searchParams.set("still", "");
        await send("Page.navigate", { url: u.href });
        await loaded();
        await evaluate("document.fonts.ready.then(() => new Promise((r) => setTimeout(r, 250)))");
        const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 90 });
        fs.writeFileSync(path.join(dir, `shot-${n}.jpg`), Buffer.from(shot.result.data, "base64"));
        if ((n + 1) % 10 === 0 || n + 1 === shots.length) console.log(`pdf export: ${n + 1} / ${shots.length} slides`);
      }
      console.log("pdf export: printing");
      fs.writeFileSync(path.join(dir, "print.html"), html.replace(/data-shot="(\d+)"/g, (_, n) => `src="shot-${n}.jpg"`));
      await send("Page.navigate", { url: `file://${path.join(dir, "print.html")}` });
      await loaded();
      for (let n = 0; n < 100 && !(await evaluate("window.pdfReady === true")); n++) await sleep(100);
      // As a stream, read in chunks: a PDF of dozens of slides is too big for a single DevTools message
      const pdf = await send("Page.printToPDF", { preferCSSPageSize: true, printBackground: true, transferMode: "ReturnAsStream" });
      if (!pdf.result) throw new Error(pdf.error?.message ?? "Printing failed");
      const chunks = [];
      for (;;) {
        const { result: c } = await send("IO.read", { handle: pdf.result.stream, size: 1 << 20 });
        chunks.push(Buffer.from(c.data, c.base64Encoded ? "base64" : "utf8"));
        if (c.eof) break;
      }
      await send("IO.close", { handle: pdf.result.stream });
      ws.close();
      const file = Buffer.concat(chunks);
      fs.mkdirSync(path.dirname(outFile), { recursive: true });
      fs.writeFileSync(outFile, file);
      console.log(`pdf exported: ${path.relative(process.cwd(), outFile)} (${shots.length} slides, ${(file.length / 1e6).toFixed(1)} MB)`);
      const url = "/" + path.relative(root, outFile).split(path.sep).map(encodeURIComponent).join("/");
      res.writeHead(200, { ...headers, "Content-Type": "application/json" }).end(JSON.stringify({ url, file: path.relative(process.cwd(), outFile) }));
    } catch (e) {
      console.error(`pdf export failed: ${e.message}`);
      if (!res.headersSent) res.writeHead(500, headers).end(e.message);
    } finally {
      rendering = false;
      browser?.kill();
      if (dir) setTimeout(() => fs.rmSync(dir, { recursive: true, force: true }), 2000);
    }
  });
};

// Decks are the folders of root with a slides/ folder; a deck's first slide is its first .html by name
const decks = () => fs.readdirSync(root).filter((d) => fs.existsSync(path.join(root, d, "slides"))).sort();
const firstSlide = (dir) => {
  const slides = path.join(dir, "slides");
  const html = fs.existsSync(slides) ? fs.readdirSync(slides).filter((f) => f.endsWith(".html")).sort() : [];
  return html.length ? path.join(slides, html[0]) : null;
};
const deckList = () =>
  `<!doctype html><meta charset="utf-8"><title>Slides</title><h1>Slides</h1><ul>${decks()
    .map((d) => `<li><a href="/${d}/">${d}</a></li>`)
    .join("")}</ul>`;

http.createServer((req, res) => {
  if (req.url === "/__notes") return req.method === "POST" ? saveNotes(req, res) : res.writeHead(405, headers).end();
  if (req.url === "/__pdf") return req.method === "POST" ? exportPdf(req, res) : res.writeHead(405, headers).end();
  let file = path.join(root, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!inside(file)) return res.writeHead(403, headers).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory() && !fs.existsSync(path.join(file, "index.html"))) {
    // A deck folder (or its slides/ folder) jumps to the first slide; the root lists the decks
    if (path.resolve(file) === root) return res.writeHead(200, { ...headers, "Content-Type": "text/html; charset=utf-8" }).end(deckList());
    const first = firstSlide(path.basename(file) === "slides" ? path.dirname(file) : file);
    if (first) return res.writeHead(302, { ...headers, Location: "/" + path.relative(root, first).split(path.sep).join("/") }).end();
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  fs.readFile(file, (err, data) => {
    if (err) return res.writeHead(404, headers).end("Not found");
    res.writeHead(200, {
      ...headers,
      "Content-Type": `${types[path.extname(file).toLowerCase()] ?? "application/octet-stream"}; charset=utf-8`,
    }).end(data);
  });
}).listen(port, "localhost", () => {
  console.log(`Slides: http://localhost:${port}/ (serving ${path.relative(process.cwd(), root) || "."}, no cache, notes editable)`);
  for (const d of decks()) console.log(`  ${d}: http://localhost:${port}/${d}/`);
});
