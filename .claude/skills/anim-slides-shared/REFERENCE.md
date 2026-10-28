# Animated slides — shared reference

Used by the `anim-slide-new` and `anim-slide-edit` skills. Paths below are relative to this folder
(`anim-slides-shared/`) unless they start with `<deck>/`.

A **deck** is a folder of slides plus a `_shared/` folder with the runtime. Each slide is a
self-contained HTML page with a CSS-only animation, used as the screen for one section of a video script.

## Finding things in the project

| What | How |
|---|---|
| Decks | `find . -path '*/_shared/anim.js' -not -path '*/node_modules/*'` → the deck is the parent of `_shared/` |
| A slide | `grep -rl "visible text" <deck>/*.html` |
| Its video script | `grep -rl "<slide-file>.html" --include='*.md' .` → the section with the 🎬 link to the slide |
| Related notes | other `.md` files next to the script (facts, prices, limits) |

## Files

| File | Role |
|---|---|
| `<deck>/NN-name.html` | One slide. `NN` orders the deck (`05a`, `05b`… for sub-steps). Follow the deck's existing naming and on-screen language. |
| `<deck>/_shared/anim.css` | Design tokens, 1920×1080 `.frame`, building blocks, replay button. **Live copy** for that deck. |
| `<deck>/_shared/anim.js` | Scaling, play-once + replay, keyboard, **slide order** (`slides` array). **Live copy** for that deck. |
| `assets/anim.css`, `assets/anim.js` | Starter runtime, copied into `<deck>/_shared/` when creating a new deck. |
| `template.html` | Starting point for a new slide (copy into the deck folder). |
| `scripts/snap.mjs` | Screenshots slides at chosen points of their timeline (verification). |
| `scripts/export.mjs` | Exports slides as MP4 (frame by frame, 0 → 94%, then holds the last frame) and PNG stills, controls hidden. Output in `<deck>/_export/` (git-ignored). |

When changing the runtime in a deck, ask whether the starter in `assets/` should get the same change.

## Runtime behaviour (anim.js)

- The `.frame` is 1920×1080 and scaled to fit the window: always lay out in absolute pixels for 1920×1080.
- The animation **plays once** and stops at **94% of `--loop`**, then a play button appears bottom-right.
- Keys: `←`/`→` (or PageUp/PageDown) previous/next slide · Space pause/resume (replay when ended) · R restart ·
  H hide/show the on-screen controls (remembered across slides, for recording).
- Bottom-left badge: file prefix + position in `slides` (e.g. `05e · 12 / 15`); clicking it opens a full-height
  slide list (titles from the video script headings). Next to it a **Notes** button (or `N`) opens the speaker
  notes panel at the bottom. Keep that corner free too.
- Speaker notes are not stored in the slides: `const SCRIPT` in `anim.js` points to the video script, and each
  slide shows the script section that holds its 🎬 link (fetched at runtime, so over http, not `file://`).
  To change the notes, edit the script. `.github/pages/build.mjs` publishes the script next to the deck.
- `page.html#t=0.5` freezes the slide at 50% of its timeline (used by `snap.mjs`).
- Navigation follows the `slides` array in `anim.js`, not the file system: **every slide must be listed there**.

## Page contract

```html
<link rel="stylesheet" href="_shared/anim.css">      <!-- in <head> -->
<!-- comment: which script section it animates; "illustrative, not measured" if numbers are made up -->
<style>
  :root { --loop: 12s; }                               /* total timeline length */
  /* page styles, then a Timeline comment, then @keyframes */
</style>
<div class="frame"> … </div>                           <!-- everything animated lives inside .frame -->
<script src="_shared/anim.js"></script>               <!-- last thing in <body> -->
```

`anim.css` gives every element inside `.frame` `animation-duration: var(--loop)` and an infinite iteration
count: an element only needs `animation-name`. **All keyframe percentages are relative to the whole loop**,
so all elements share one clock.

## Timeline rules

- Write a `/* ---------- Timeline (Ns loop) ---------- */` comment listing each beat with its percentages,
  and keep it in sync with the keyframes.
- **0–4%** the scene fades in. **Everything important must be on screen by 94%**: that is the frame the slide
  stops on, so it should be the conclusion (closing title, final result, full diagram).
- **96–100%** fade out (never shown; keeps the page valid as a loop). Nothing new may start after 94%.
- A closing title, when present, fades in around 80–85% and stays at opacity 1 through 94%.
- Pacing: ~3–4% per small step (a card, a row), ≥ 2% for any fade; a 12–16 s loop holds 3–5 beats.
  Pick `--loop` so the narration of that section fits (~2.5 spoken words per second).
- Two-part slides: two absolutely positioned containers (`.beat--a`, `.beat--b`) that cross-fade.
- Animated numbers: `@property --x { syntax: "<integer>"; inherits: false; initial-value: 0; }`,
  then `counter-reset: v var(--x)` and `content: counter(v)` in a pseudo-element.
- Typed text: `clip-path: inset(0 100% 0 0)` → `inset(0 0 0 0)` with `steps(n, end)`.
- `animation-delay` for staggering is allowed but keep `delay + end` ≤ 94% of the loop.

## Visual language (anim.css)

- Background: white dotted grid. Colors only via tokens: `--ink`, `--pink` (accent), `--pink-bg`,
  `--blue`, `--green`, `--amber`, `--red` (+ `-bg` variants), `--muted` (grey / secondary side).
- Fonts: `--hand` (Architects Daughter) for titles, big numbers and "spoken" text; `--sans` (Inter) for UI;
  `--mono` for code, JSON, API names.
- Building blocks: `.kicker` (top-left section heading with `<small>` label), `.card`, `.screen`, `.chip`
  (`.chip--pink`), `.json`, `.code`, `.bar > i` (`--w`), `.underline-pink`, `.cursor`, `.title-overlay`.
- Pink = the subject / the answer / what matters; grey = the alternative or what is discarded.
  One pink highlight per idea.
- Margins: content starts at `left: 80px`/`135px`; leave ≥ 120px free bottom-right for the replay button.
- Captions under the scene: one short sentence, key words in `<b>` or `.underline-pink`.
- Text sizes: ≥ 22px UI text, ≥ 40px titles, ≥ 56px closing titles.

## Verify

```bash
node <this folder>/scripts/snap.mjs <deck>/NN-name.html                       # 25/50/75/94%
node <this folder>/scripts/snap.mjs <deck>/NN-name.html --t 0.5,0.55,0.6      # around one beat
node <this folder>/scripts/snap.mjs <deck>/*.html --t 0.94                    # final frame of every slide
```

It prints the path of a contact sheet (`sheet.jpg`): read it and check that nothing overlaps, overflows
its card or is clipped, and that the 94% frame is a complete conclusion. Needs Google Chrome
(`$CHROME` overrides the macOS default path) and Node ≥ 22.

## Export (video and stills)

```bash
npm run slides:export -- docs/video-talk/slides                          # whole deck: video/*.mp4 + png/*@50.png, *@94.png
npm run slides:export -- docs/video-talk/slides/03e-noul.html --only png --t 0.3,0.6,0.94
npm run slides:export -- docs/video-talk/slides --only video --fps 60 --hold 3 --scale 2   # 4K, 60 fps
```

`--t` fractions of the loop for the PNGs (default `0.5,0.94`) · `--fps` (30) · `--hold` seconds on the final
frame (2) · `--scale` 2 = 3840×2160 · `--only video|png` · `--out dir` (default `<deck>/_export`).
A 18 s slide takes about a minute at 30 fps. Needs `ffmpeg` too.
