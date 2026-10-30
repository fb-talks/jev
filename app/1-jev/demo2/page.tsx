import { CodePanel, type Snippet } from "../../_components/code";
import Demo2 from "./demo";

// A server component: it highlights the key code with Shiki, the interactive demo is in demo.tsx.
export default function Page() {
  return <Demo2 code={<CodePanel snippets={snippets} />} />;
}

// What the API route does, simplified for the talk: the full version is in api/route.ts.
const snippets: Snippet[] = [
  {
    title: "Three questions, one of each type",
    code: `import { choice, noul, score } from "@typesafe-ai/sdk";

// the descriptions are our "prompt": the clearer they are, the better the probabilities
const questions = {
  // choice: one option out of a list
  category: choice("What kind of comment is this, relative to a post on a tech blog?", {
    relevant: "Comment, opinion or question about the post's content",
    spam: "Advertising, promotional links or unsolicited messages",
    off_topic: "Has nothing to do with the post",
    adult: "Sexually explicit or adult content",
  }),
  // score: a level on an ordered scale, from 0 to 3
  toxicity: score("How offensive is the tone of the comment?", [
    "Polite or neutral",
    "Critical but respectful",
    "Combative or sarcastic toward people",
    "Insults, hate or personal attacks",
  ]),
  // noul: a yes/no statement
  asks_author: noul("The comment asks the post's author a question"),
};`,
  },
  {
    title: "One call, three answers",
    code: `const { answers } = await jev.systemOne({ state: text, questions });

answers.category.choice;        // "relevant"
answers.category.probabilities; // { relevant: 0.94, spam: 0.01, off_topic: 0.04, adult: 0.01 }
answers.toxicity.score;         // 0.3 (from 0 to 3)
answers.asks_author.noul;       // 0.91`,
  },
];
