import { CodePanel, type Snippet } from "../../_components/code";
import Demo3 from "./demo";

// A server component: it highlights the key code with Shiki, the interactive demo is in demo.tsx.
export default function Page() {
  return <Demo3 code={<CodePanel snippets={snippets} />} />;
}

// What the API route and the page do, simplified for the talk: the full versions are in api/route.ts and demo.tsx.
const snippets: Snippet[] = [
  {
    title: "1 · Jev answers the questions",
    code: `const questions = {
  category: choice("What kind of comment is this, relative to a post on a tech blog?", {
    relevant: "...", spam: "...", off_topic: "...",
  }),
  toxicity: score("How offensive is the tone of the comment?", ["Polite or neutral", "...", "Insults, hate or personal attacks"]),
  personal_data: noul("The comment contains personal data such as an email address, phone number or home address"),
};

const { answers } = await jev.systemOne({ state: text, questions });`,
  },
  {
    title: "2 · The answers become risk signals",
    code: `// every signal is a number from 0 to 1
const signals = [
  { name: "Spam", risk: answers.category.probabilities.spam },
  { name: "Toxicity", risk: answers.toxicity.score / 3 }, // the score goes from 0 to 3
  { name: "Personal data", risk: answers.personal_data.noul },
  // off topic never justifies a rejection: at most a review
  { name: "Off topic", risk: answers.category.probabilities.off_topic, reviewOnly: true },
];`,
  },
  {
    title: "3 · The decision is our code, not the model",
    code: `const thresholds = { review: 0.5, reject: 0.85 };

const verdict = (s) =>
  s.risk >= thresholds.reject && !s.reviewOnly ? "reject"
  : s.risk >= thresholds.review ? "review"
  : "publish";

// the most severe verdict wins: moving a threshold changes it, with no new call to Jev
const decision = signals.map(verdict).sort(bySeverity).at(-1);`,
  },
];
