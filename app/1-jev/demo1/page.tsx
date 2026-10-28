import { CodePanel, type Snippet } from "../../_components/code";
import Demo1 from "./demo";

// A server component: it highlights the key code with Shiki, the interactive demo is in demo.tsx.
export default function Page() {
  return <Demo1 code={<CodePanel snippets={snippets} />} />;
}

// What the API route does, simplified for the talk: the full version is in api/route.ts.
const snippets: Snippet[] = [
  {
    title: "The question for Jev",
    code: `import { noul, TypeSafeClient } from "@typesafe-ai/sdk";

// noul: one statement, Jev returns the probability that it's true
const questions = { offensive: noul("The comment is offensive or insulting") };

const jev = new TypeSafeClient({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: "https://ai-gateway.vercel.sh/typesafe",
  defaultModel: "typesafe-ai/jev",
});`,
  },
  {
    title: "One call, one number",
    code: `// the comment is the state: the text Jev looks at
const { answers } = await jev.systemOne({ state: text, questions });

answers.offensive.noul; // 0.78: the probability of "yes", from 0 to 1`,
  },
];
