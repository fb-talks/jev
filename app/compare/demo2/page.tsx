import { CodePanel, type Snippet } from "../../_components/code";
import CompareCsv from "./demo";

// A server component: it highlights the key code with Shiki, the interactive demo is in demo.tsx.
export default function Page() {
  return <CompareCsv code={<CodePanel snippets={snippets} />} />;
}

// What the page and the API route do, simplified for the talk: the full version is in demo.tsx and api/route.ts.
const snippets: Snippet[] = [
  {
    title: "1 · The same three questions, to every model",
    code: `// Jev and Gemini Decision: typed questions, probabilities by design
const questions = {
  category: { type: "choice", instructions: "What kind of comment is this?", criteria: categories },
  toxicity: { type: "score", instructions: "How offensive is the tone?", criteria: toxicityLevels },
  personal_data: { type: "noul", instructions: "The comment contains personal data" },
};
await jev.systemOne({ state: text, questions });                                      // TypeSafe SDK
await ai.decisions.create({ model: "gemini-decision-1", input: text, questions });   // Google SDK, the same questions

// Gemini Flash / Flash Lite: the same questions in the prompt, the probabilities written as JSON
await ai.interactions.create({ model: "gemini-3.8-flash", system_instruction, input: text, response_format });`,
  },
  {
    title: "2 · Every model on its own, all at the same time",
    code: `// one pool of 5 calls per model: a slow model never holds back a fast one
await Promise.all(
  models.map((model) =>
    runPool(rows, 5, (row) => fetch("/compare/demo2/api", { method: "POST", body: JSON.stringify({ text: row.comment, model }) })),
  ),
);`,
  },
  {
    title: "3 · The same policy on the answers",
    code: `// every answer becomes the same four risks, from 0 to 1
const signals = { spam, off_topic, toxicity: score / 3, personal_data };

// our policy, not the model's: moving the thresholds recomputes accuracy, with no new calls
const correct = rows.filter((r) => decide(r.signals, thresholds).decision === r.expected).length;`,
  },
];
