import { CodePanel, type Snippet } from "../_components/code";
import Demo6 from "./demo";

// A server component: it highlights the key code with Shiki, the interactive demo is in demo.tsx.
export default function Page() {
  return <Demo6 code={<CodePanel snippets={snippets} />} />;
}

// What the API route and the page do, simplified for the talk: the full version is in api/route.ts and demo.tsx.
const snippets: Snippet[] = [
  {
    title: "Three questions, one of each type",
    code: `const jevQuestions = {
  category: choice("What kind of comment is this, relative to a post on a tech blog?", {
    relevant: "Comment, opinion or question about the post's content",
    spam: "Advertising, promotional links or unsolicited messages",
    off_topic: "Has nothing to do with the post",
  }),
  toxicity: score("How offensive is the tone of the comment?", toxicityLevels),
  personal_data: noul("The comment contains personal data such as an email address, phone number or home address"),
};`,
  },
  {
    title: "Both models on every CSV row",
    code: `const [jevResult, geminiResult] = await Promise.all([
  timed(() => jev.systemOne({ state: comment, questions: jevQuestions })),
  // Gemini: the same questions in its instructions, labels instead of probabilities
  timed(() => generateText({ model, instructions, prompt: comment, output: Output.object({ schema: geminiSchema }) })),
]);`,
  },
  {
    title: "The policy lives in our code, not in the model",
    code: `// the same policy for both models: each answer becomes a risk from 0 to 1
const signals = [
  { name: "Spam", risk: a.category.probabilities.spam },
  { name: "Toxicity", risk: a.toxicity.score / 3 },
  { name: "Personal data", risk: a.personal_data.noul },
];

// the thresholds are sliders on the page: the decisions change without calling the models again
const verdict = (risk: number) => (risk >= thresholds.reject ? "reject" : risk >= thresholds.review ? "review" : "publish");
// the most severe verdict wins, then it's compared with the human's expected decision`,
  },
];
