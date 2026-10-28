import { CodePanel, type Snippet } from "../../_components/code";
import Demo2 from "./demo";

// A server component: it highlights the key code with Shiki, the interactive demo is in demo.tsx.
export default function Page() {
  return <Demo2 code={<CodePanel snippets={snippets} />} />;
}

// What the API route does, simplified for the talk: the full version is in api/route.ts.
const snippets: Snippet[] = [
  {
    title: "The questions for Jev",
    code: `import { choice, score } from "@typesafe-ai/sdk";

const questions = {
  // choice: one option among several, each with a description
  relevance: choice("Relative to the customer's message, what does the support reply do?", {
    relevant: "Addresses the customer's actual problem or question",
    generic: "Vague or boilerplate: replies without really addressing the problem",
    off_topic: "Talks about something unrelated to the customer's request",
  }),
  // score: a scale, Jev returns the probability of each level and a weighted average
  tone: score("How does the support agent treat the customer?", [
    "Polite and empathetic",
    "Neutral or a bit cold",
    "Rude, dismissive or condescending",
    "Toxic: insults or personal attacks",
  ]),
};`,
  },
  {
    title: "1 · Gemini writes the reply",
    code: `const { text: reply } = await generateText({
  model: "google/gemini-3.8-flash",
  instructions: "You are a customer support agent of a software company. Reply in 1-3 sentences.",
  prompt: \`Customer's message: \${message}\\n\\nReply with this style: \${style}\`,
});`,
  },
  {
    title: "2 · Jev evaluates it",
    code: `// Jev sees both texts: relevance only makes sense against the customer's message
const state = \`Customer's message: \${message}\\n\\nSupport reply: \${reply}\`;
const { answers } = await jev.systemOne({ state, questions });

answers.relevance.choice; // "generic"
answers.tone.score;       // 2.74 (out of 3)`,
  },
];
