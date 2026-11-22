// Settings of the docs/video-talk/slides deck. The runtime (playback, stops, notes, drawing, options) is the
// shared engine in docs/_engine/, the same for every deck: change it there. It is loaded right below.

// Slide order: add new pages here
const slides = [
  "00-copertina.html",
  "01a-titolo.html",
  "01d-hook.html",
  "01b-speaker.html",
  "01c-jev.html",
  "01e-classificatori.html",
  "02-cos-e.html",
  "02a-tre-modi.html",
  "05-casi-uso.html",
  "05c-immobiliare-chiavi.html",
  "03a-state-domande.html",
  "03b-tipi-domanda.html",
  "03c-noul-base.html",
  "03d-codice.html",
  "03e-noul.html",
  "03f-choice.html",
  "03g-score.html",
  "04-tre-fasce.html",
  "06-come-sa.html",
  "06a0-modello-base.html",
  "06a-parola-dopo.html",
  "06b-coordinate.html",
  "06c-attention.html",
  "06d-opzioni.html",
  "06e-scommettere.html",
  "06f-scommessa.html",
  "06g-quando-sbaglia.html",
  "07a-limiti.html",
  "07b-costi.html",
  "07c-non-solo-jev.html",
  "08-chiusura.html",
  "09a-immagini.html",
  "09-soggetto.html",
  "09b-box.html",
  "09c-sempre-box.html",
  "09d-descrivi.html",
  "09e-tempi-limiti.html",
  "10-combinare.html",
  "10a-riscrive.html",
  "10b-risponde.html",
  "10c-propone.html",
  "10d-email.html",
  "10e-siti.html",
  "10f-csv.html",
  "10g-router.html",
  "10h-demo.html",
  "11-sommario.html",
];

// Slides kept out of the talk without deleting them (set from ⋮ in the notes or in the slide list):
// "draft" = shown with a DRAFT badge; "hidden" = skipped by ← / →, the numbering and the export, only in the slide list
const slideStatus = {
  "10h-demo.html": "hidden",
};

// Speaker notes and slide titles: for each slide, the section of this script that holds its 🎬 link
const SCRIPT = "../01-intro-jev-video-script.md";

document.write(`<script src="${new URL("../../../_engine/anim.js", document.currentScript.src).href}"><\/script>`);
