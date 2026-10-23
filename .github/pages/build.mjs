// Builds the GitHub Pages site in _site/: every deck in docs/ (a folder with _shared/anim.js)
// is copied as is, plus an index.html that lists its slides in the order set in anim.js.
//   node .github/pages/build.mjs
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DOCS = "docs";
const OUT = "_site";

const escape = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);

const decks = readdirSync(DOCS, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(DOCS, d.name, "_shared/anim.js")))
  .map((d) => {
    const dir = join(DOCS, d.name);
    // _export/ holds the local video exports (gitignored), not needed online
    cpSync(dir, join(OUT, d.name), { recursive: true, filter: (src) => !src.includes("/_export") });
    // Slide order comes from the `slides` array in anim.js
    const js = readFileSync(join(dir, "_shared/anim.js"), "utf8");
    const files = [...js.match(/const slides = \[([\s\S]*?)\]/)[1].matchAll(/"([^"]+\.html)"/g)].map((m) => m[1]);
    const slides = files.map((file) => {
      const html = readFileSync(join(dir, file), "utf8");
      return { file, title: html.match(/<title>([\s\S]*?)<\/title>/)?.[1].trim() ?? file };
    });
    return { name: d.name, slides };
  });

const list = decks
  .map(
    (deck) => `
  <section>
    <h2>${escape(deck.name)} <a class="play" href="${deck.name}/${deck.slides[0].file}">▶ Start</a></h2>
    <ol>
${deck.slides.map((s) => `      <li><a href="${deck.name}/${s.file}">${escape(s.title)}</a></li>`).join("\n")}
    </ol>
  </section>`,
  )
  .join("\n");

writeFileSync(
  join(OUT, "index.html"),
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Jev slides</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Architects+Daughter&family=Inter:wght@400;600;700&display=swap">
<style>
  body { margin: 0; padding: 48px 16px; background: #fafbff; color: #1f1f1f; font-family: "Inter", system-ui, sans-serif; }
  main { max-width: 720px; margin: 0 auto; }
  h1 { font-family: "Architects Daughter", cursive; font-size: 48px; margin: 0 0 8px; }
  h1 span { color: #FF00BF; }
  p { color: #6b7280; margin: 0 0 40px; }
  h2 { display: flex; align-items: center; gap: 16px; font-size: 20px; }
  ol { padding-left: 24px; line-height: 1.9; }
  a { color: inherit; text-decoration: none; border-bottom: 1px solid #e8ecf4; }
  a:hover { color: #FF00BF; border-color: #FF00BF; }
  a.play { font-size: 14px; padding: 4px 12px; border: 0; border-radius: 999px; background: #FF00BF; color: #fff; }
  a.play:hover { color: #fff; opacity: .85; }
</style>
</head>
<body>
<main>
  <h1><span>Jev</span> slides</h1>
  <p>← / → to move between slides · Space to pause · R to restart · H to hide the controls</p>
${list}
</main>
</body>
</html>
`,
);

console.log(`Built ${OUT}/ with ${decks.map((d) => `${d.name} (${d.slides.length} slides)`).join(", ")}`);
