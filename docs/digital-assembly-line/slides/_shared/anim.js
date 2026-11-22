// Settings of the docs/digital-assembly-line/slides deck. The runtime (playback, stops, notes, drawing, options) is the
// shared engine in docs/_engine/, the same for every deck: change it there. It is loaded right below.

// Slide order: add new pages here
const slides = [
  "01-cover.html",
  "02-what-we-do.html",
  "03-how.html",
  "04-who-am-i.html",
  "05-icebreaker-1.html",
  "06-adk.html",
  "07-icebreaker-2.html",
  "08-not-a-test.html",
  "09-bring-to-table.html",
  "10-graveyard.html",
  "11-avoid-all-this.html",
  "12-assembly-line.html",
  "13-example.html",
  "14-requirements.html",
  "15-worst-scenario.html",
  "16-single-agent.html",
  "17-structured-workflow.html",
  "18-one-task-one-agent.html",
  "19-llmagent.html",
  "20-tool.html",
  "21-sub-agents.html",
  "22-demo-1.html",
  "23-context-question.html",
  "24-naive-memory.html",
  "25-structured-handoffs.html",
  "26-session-state.html",
  "27-state-layers.html",
  "28-typed-contracts.html",
  "29-demo-2.html",
  "30-decouple-question.html",
  "31-subagents-vs-tools.html",
  "32-heterogeneity.html",
  "33-mcp-and-a2a.html",
  "34-mcp.html",
  "35-a2a.html",
  "36-mcp-server.html",
  "37-mcp-client.html",
  "38-a2a-code.html",
  "39-demo-3.html",
  "40-evaluating.html",
  "41-eval-metrics.html",
  "42-eval-best-practice.html",
  "43-adk-eval.html",
  "44-in-the-end.html",
  "45-final-architecture.html",
  "46-final-thought.html",
  "47-qa.html",
];

// Speaker notes and slide titles: for each slide, the section of this script that holds its 🎬 link
const SCRIPT = "../speaker-notes.md";

document.write(`<script src="${new URL("../../../_engine/anim.js", document.currentScript.src).href}"><\/script>`);
