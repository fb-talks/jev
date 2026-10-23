---
name: anim-slide-new
description: Creates a new animated HTML slide (CSS-only 1920×1080 animation that plays once, with keyboard navigation) for a video deck, or a whole new deck, and links it from the video script. Use when the user asks for a new slide, animation, screen or scene for a video section, wants to animate part of a video script, or wants to start a new deck of animated slides.
---

# New animated slide

Shared material lives in `../anim-slides-shared/` (relative to this skill's base directory).
Read `../anim-slides-shared/REFERENCE.md` first, every time: page contract, timeline rules
(stop frame at 94%), tokens, building blocks, how to find decks and scripts.

## Workflow

1. **Find the deck and the script** (see "Finding things" in REFERENCE.md). If there are several decks
   or none fits, ask which one, or whether to start a new deck.
2. **Understand the beat.** Read the matching section of the video script (voice, screen and
   animation notes) and the related notes. List the 3–5 visual beats and what the 94% frame must show.
   If the section or the message is unclear, ask before drawing.
3. **Look at 1–2 existing slides in the deck** with a similar shape (comparison, flow, list, two parts)
   and reuse their patterns rather than inventing new ones.
4. **Name and number it** following the deck: `NN-name.html`, a letter for a step inside a section
   (`05g-…`). Don't renumber existing files.
5. **Create it from the template**: copy `../anim-slides-shared/template.html` into the deck folder,
   then fill the header comment, `<title>`, `--loop`, the Timeline comment and the keyframes.
   Short on-screen text; numbers that aren't real get "illustrative, not measured" in the header comment.
6. **Register it** in the `slides` array in `<deck>/_shared/anim.js`, in deck order.
   Without this, ←/→ skip the slide.
7. **Link it from the script**: add or update the 🎬 animation line in that section, in the same format
   as the other sections.
8. **Verify** (mandatory) and fix until clean.

## New deck

1. Create the folder and copy `../anim-slides-shared/assets/anim.css` and `anim.js` into `<deck>/_shared/`.
2. Then create each slide with the workflow above; the `slides` array starts empty.

## Verify

```bash
node ../anim-slides-shared/scripts/snap.mjs <deck>/NN-name.html
```

(Resolve `../anim-slides-shared` against this skill's base directory.) Read the printed `sheet.jpg`:

- [ ] every beat is visible at the expected time; nothing overlaps, overflows a card or is clipped
- [ ] the 94% frame is a complete conclusion, and the bottom-right replay area is free
- [ ] text is readable at a glance (sizes in REFERENCE.md)
- [ ] the Timeline comment matches the keyframes; nothing starts after 94%
- [ ] `node --check <deck>/_shared/anim.js` passes and the slide is in `slides`

Report to the user what the slide shows beat by beat, and anything you could not verify.
