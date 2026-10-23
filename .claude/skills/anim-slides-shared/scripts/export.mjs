// Exports animated slides as MP4 videos and PNG stills.
//   node export.mjs <slide.html | deck-folder>... [--t 0.5,0.94] [--fps 30] [--hold 2] [--scale 1]
//                   [--only video|png] [--out dir]
// Video: frame by frame from 0 to 94% of --loop (where playback stops), seeking every CSS animation
// to the exact time, so the result is smooth and identical on every run; then --hold seconds on
// the final frame. Stills: one PNG per --t (fraction of the loop). On-screen controls are hidden.
// Output: <out>/video/NN-name.mp4 and <out>/png/NN-name@50.png (default out: <deck>/_export).
// Needs Google Chrome ($CHROME overrides the macOS default path), ffmpeg and Node >= 22.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args.splice(i, 2)[1];
};
const times = opt("--t", "0.5,0.94").split(",").map(Number);
const fps = Number(opt("--fps", "30"));
const hold = Number(opt("--hold", "2"));
const scale = Number(opt("--scale", "1")); // 2 = 3840×2160
const only = opt("--only", "");
const outOpt = opt("--out", "");

// Slides: html files as given, or every NN-*.html of a deck folder, in name order
const files = args.flatMap((a) => {
  const p = path.resolve(a);
  return fs.statSync(p).isDirectory()
    ? fs.readdirSync(p).filter((f) => /^\d.*\.html$/.test(f)).sort().map((f) => path.join(p, f))
    : [p];
});
if (!files.length || (only && !["video", "png"].includes(only))) {
  console.error("usage: node export.mjs <slide.html | deck-folder>... [--t 0.5,0.94] [--fps 30] [--hold 2] [--scale 1] [--only video|png] [--out dir]");
  process.exit(1);
}
const out = path.resolve(outOpt || path.join(path.dirname(files[0]), "_export"));
const W = 1920, H = 1080;

const chrome = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = 9400 + Math.floor(Math.random() * 500);
const browser = spawn(chrome, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars", `--window-size=${W},${H}`,
  `--remote-debugging-port=${port}`, `--user-data-dir=${fs.mkdtempSync(path.join(os.tmpdir(), "export-profile-"))}`,
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
ws.onmessage = (m) => { const d = JSON.parse(m.data); pending[d.id]?.(d); delete pending[d.id]; };
const send = (method, params = {}) => new Promise((resolve, reject) => {
  pending[++id] = (d) => (d.error ? reject(new Error(`${method}: ${d.error.message}`)) : resolve(d.result));
  ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
  return r.result.value;
};

await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: scale, mobile: false });

// Opens a slide paused at 0 with the controls hidden; returns the length of --loop in ms
const open = async (file) => {
  await send("Page.navigate", { url: "about:blank" });
  await send("Page.navigate", { url: `file://${file}` });
  for (let i = 0; i < 50 && !(await evaluate(`document.readyState === "complete" && !!document.querySelector(".frame")`)); i++) {
    await sleep(100);
  }
  return evaluate(`(async () => {
    await document.fonts.ready;
    document.documentElement.classList.add("bare");
    document.querySelectorAll(".replay, .slide-id").forEach((e) => (e.style.display = "none"));
    const frame = document.querySelector(".frame");
    return parseFloat(getComputedStyle(frame).getPropertyValue("--loop")) * 1000;
  })()`);
};

// Moves every animation of the slide to `ms` and waits for it to be painted
const seek = (ms) => evaluate(`(async () => {
  document.querySelector(".frame").getAnimations({ subtree: true })
    .forEach((a) => { a.pause(); a.currentTime = ${ms}; });
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
})()`);

const shot = async () => Buffer.from((await send("Page.captureScreenshot", { format: "png" })).data, "base64");

const ffmpeg = (target) => {
  const p = spawn("ffmpeg", [
    "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-i", "-",
    "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart", target,
  ], { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((resolve, reject) => p.on("close", (c) => (c ? reject(new Error(`ffmpeg exited with ${c}`)) : resolve())));
  const write = (buf) => (p.stdin.write(buf) ? Promise.resolve() : new Promise((r) => p.stdin.once("drain", r)));
  return { write, end: () => (p.stdin.end(), done) };
};

const END = 0.94; // where anim.js stops playback: the last frame with everything on screen
if (only !== "png") fs.mkdirSync(path.join(out, "video"), { recursive: true });
if (only !== "video") fs.mkdirSync(path.join(out, "png"), { recursive: true });

try {
  for (const file of files) {
    const name = path.basename(file, ".html");
    const loop = await open(file);
    if (!loop) throw new Error(`${name}: no --loop on .frame`);

    if (only !== "video") {
      for (const t of times) {
        await seek(t * loop);
        fs.writeFileSync(path.join(out, "png", `${name}@${Math.round(t * 100)}.png`), await shot());
      }
    }

    if (only !== "png") {
      const target = path.join(out, "video", `${name}.mp4`);
      const enc = ffmpeg(target);
      const frames = Math.round((END * loop / 1000) * fps);
      let last;
      for (let i = 0; i <= frames; i++) {
        await seek((i / frames) * END * loop);
        last = await shot();
        await enc.write(last);
        if (process.stdout.isTTY) process.stdout.write(`\r${name}: frame ${i + 1}/${frames + 1}`);
      }
      for (let i = 0; i < Math.round(hold * fps); i++) await enc.write(last);
      await enc.end();
      const secs = ((frames + 1 + Math.round(hold * fps)) / fps).toFixed(1);
      process.stdout.write(`${process.stdout.isTTY ? "\r\x1b[K" : ""}${name}: ${secs}s video${only ? "" : `, ${times.length} png`}\n`);
    } else {
      console.log(`${name}: ${times.length} png`);
    }
  }
} finally {
  ws.close();
  browser.kill();
}
console.log(`output: ${out}`);
