// Serves the decks locally with caching off, so edits to slides, anim.js/anim.css and the scripts show up on reload.
//   node serve.mjs [dir] [--port 3210]      (dir defaults to docs)
// URLs keep their .html: anim.js finds the current slide from the file name, so no clean-URL redirects.
// Dev mode: every response carries X-Slides-Dev, which makes the speaker notes editable in anim.js, and
// POST /__notes saves an edited section back into the script .md. Listens on localhost only.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const i = args.indexOf("--port");
const port = i === -1 ? 3210 : Number(args.splice(i, 2)[1]);
const root = path.resolve(args[0] ?? "docs");
const inside = (file) => file === root || file.startsWith(root + path.sep);

const types = {
  ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json",
  ".md": "text/markdown", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".webp": "image/webp", ".mp4": "video/mp4", ".woff2": "font/woff2", ".ico": "image/x-icon",
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

http.createServer((req, res) => {
  if (req.url === "/__notes") return req.method === "POST" ? saveNotes(req, res) : res.writeHead(405, headers).end();
  let file = path.join(root, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!inside(file)) return res.writeHead(403, headers).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  fs.readFile(file, (err, data) => {
    if (err) return res.writeHead(404, headers).end("Not found");
    res.writeHead(200, {
      ...headers,
      "Content-Type": `${types[path.extname(file).toLowerCase()] ?? "application/octet-stream"}; charset=utf-8`,
    }).end(data);
  });
}).listen(port, "localhost", () => console.log(`Slides: http://localhost:${port}/ (serving ${path.relative(process.cwd(), root) || "."}, no cache, notes editable)`));
