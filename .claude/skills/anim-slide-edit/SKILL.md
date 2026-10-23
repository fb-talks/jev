---
name: anim-slide-edit
description: Modifies existing animated HTML slides of a video deck (CSS-only 1920×1080 pages sharing _shared/anim.css and _shared/anim.js): text, layout, timing, keyframes, colors, shared styles, playback or keyboard controls. Use when the user asks to change, fix, retime, restyle, reorder or remove a slide or animation, or reports something wrong in one.
---

# Edit animated slides

Shared material lives in `../anim-slides-shared/` (relative to this skill's base directory).
Read `../anim-slides-shared/REFERENCE.md` first, every time: page contract, timeline rules
(stop frame at 94%), tokens, building blocks, how to find decks and scripts.

## Workflow

1. **Locate.** Find the deck and the slide (see "Finding things" in REFERENCE.md). Read the whole file:
   the Timeline comment tells you which percentages each beat uses.
2. **Decide the scope.**
   - One slide only → edit that file.
   - Same look/behaviour on every slide → edit `<deck>/_shared/anim.css` or `anim.js`, never copy into
     each page; then ask whether the starter in `../anim-slides-shared/assets/` should change too.
   - Same text repeated across slides (a label, a price) → `grep -rn` and change every occurrence,
     including the video script and related notes if they say the same thing.
3. **Edit, keeping the timeline consistent.**
   - Moving a beat means moving every keyframe that depends on it, then updating the Timeline comment.
   - Keep the rules: scene in by 4%, everything final on screen by 94%, nothing new after 94%.
   - Changing `--loop` rescales the whole slide: check the narration still fits (~2.5 words/s).
   - Changing size or position of a card: check its neighbours and the bottom-right replay area.
4. **Keep facts consistent.** Prices, limits and claims must match the notes or the source the user gave;
   if the slide and the notes disagree, say so instead of silently picking one.
5. **Sync the outside.** Renamed/added/removed slide → update the `slides` array in `<deck>/_shared/anim.js`
   and the 🎬 links in the video script. Changed content the narration refers to → update that section
   of the script.
6. **Verify** (mandatory) and fix until clean.

## Verify

```bash
node ../anim-slides-shared/scripts/snap.mjs <deck>/NN-name.html                      # one slide, 4 moments
node ../anim-slides-shared/scripts/snap.mjs <deck>/NN-name.html --t 0.5,0.55,0.6     # around a changed beat
node ../anim-slides-shared/scripts/snap.mjs <deck>/*.html --t 0.94                    # after shared changes
```

(Resolve `../anim-slides-shared` against this skill's base directory.) Read the printed `sheet.jpg`:

- [ ] the changed part looks right at the moments it is on screen
- [ ] nothing overlaps, overflows a card or is clipped; the 94% frame is complete
- [ ] after a shared change, every slide still ends on a sensible frame
- [ ] `node --check <deck>/_shared/anim.js` passes after any change to it

Tell the user what changed (file:line), what you checked visually, and anything you could not verify.
