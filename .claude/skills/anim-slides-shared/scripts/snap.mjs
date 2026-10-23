// Screenshots animated slides at given points of their timeline and builds a contact sheet.
//   node snap.mjs <slide.html>... [--t 0.25,0.5,0.75,0.94] [--out dir]
// Uses the page's #t= freeze (see anim.js). Chrome path can be overridden with $CHROME.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args.splice(i, 2)[1];
};
const times = opt("--t", "0.25,0.5,0.75,0.94").split(",").map(Number);
const out = path.resolve(opt("--out", fs.mkdtempSync(path.join(os.tmpdir(), "snap-"))));
const files = args.map((f) => path.resolve(f));
if (!files.length) {
  console.error("usage: node snap.mjs <slide.html>... [--t 0.25,0.5,0.75,0.94] [--out dir]");
  process.exit(1);
}
fs.mkdirSync(out, { recursive: true });

const chrome = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = 9400 + Math.floor(Math.random() * 500);
const browser = spawn(chrome, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars", "--window-size=1920,1080",
  `--remote-debugging-port=${port}`, `--user-data-dir=${fs.mkdtempSync(path.join(os.tmpdir(), "snap-profile-"))}`,
  "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pageInfo;
for (let i = 0; i < 50 && !pageInfo; i++) {
  await sleep(200);
  try {
    pageInfo = (await (await fetch(`http://localhost:${port}/json`)).json()).find((p) => p.type === "page");
  } catch {}
}
if (!pageInfo) { browser.kill(); throw new Error("Chrome did not start (set $CHROME?)"); }

const ws = new WebSocket(pageInfo.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = {};
ws.onmessage = (m) => { const d = JSON.parse(m.data); pending[d.id]?.(d.result); delete pending[d.id]; };
const send = (method, params = {}) => new Promise((r) => { pending[++id] = r; ws.send(JSON.stringify({ id, method, params })); });

const tiles = [];
for (const file of files) {
  for (const t of times) {
    await send("Page.navigate", { url: "about:blank" });
    await send("Page.navigate", { url: `file://${file}#t=${t}` });
    await sleep(1200); // fonts + layout
    const { data } = await send("Page.captureScreenshot", { format: "png" });
    const name = `${path.basename(file, ".html")}@${t}.png`;
    fs.writeFileSync(path.join(out, name), Buffer.from(data, "base64"));
    tiles.push(name);
  }
}

// Contact sheet: one row per slide, one column per time.
const cols = times.length;
const w = cols === 1 ? 640 : 560;
fs.writeFileSync(path.join(out, "sheet.html"), `<style>body{margin:0;display:grid;grid-template-columns:repeat(${cols},${w}px);gap:6px;font:14px sans-serif}
figure{margin:0}img{display:block;width:${w}px;border:1px solid #ccc}</style>
${tiles.map((n) => `<figure><img src="${n}"><figcaption>${n}</figcaption></figure>`).join("")}`);
const rows = Math.ceil(tiles.length / cols);
await send("Emulation.setDeviceMetricsOverride", { width: cols * (w + 6), height: rows * (w * 9 / 16 + 30), deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: `file://${path.join(out, "sheet.html")}` });
await sleep(800);
const { data } = await send("Page.captureScreenshot", { format: "jpeg", quality: 75 });
fs.writeFileSync(path.join(out, "sheet.jpg"), Buffer.from(data, "base64"));

ws.close();
browser.kill();
console.log(`frames: ${out}\nsheet:  ${path.join(out, "sheet.jpg")}`);
