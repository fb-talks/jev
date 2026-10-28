import { CodePanel, type Snippet } from "../_components/code";
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
    title: "1 · Jev measures the original",
    code: `const before = await jev.systemOne({ state: text, questions });
before.answers.offensive.noul; // 0.78`,
  },
  {
    title: "2 · Gemini rewrites it",
    code: `import { generateText } from "ai";

const { text: rewritten } = await generateText({
  model: "google/gemini-3.8-flash", // same AI Gateway, same key
  instructions:
    "Rewrite the comment in a polite, respectful tone, keeping its meaning and criticism.",
  prompt: text,
});`,
  },
  {
    title: "3 · Jev measures the rewrite",
    code: `// same question, new text: the number proves the rewrite worked
const after = await jev.systemOne({ state: rewritten, questions });
after.answers.offensive.noul; // 0.11`,
  },
];
