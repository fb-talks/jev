// Settings of the <deck> deck. The runtime (playback, stops, notes, drawing, options) is the
// shared engine in docs/_engine/, the same for every deck: change it there. It is loaded right below.

// Slide order: add new pages here
const slides = [
];

// Speaker notes and slide titles: for each slide, the section of this script that holds its 🎬 link
const SCRIPT = "../speaker-notes.md";

// Path from this file to docs/_engine/ (here: a deck at docs/<name>/slides/)
document.write(`<script src="${new URL("../../../_engine/anim.js", document.currentScript.src).href}"><\/script>`);
