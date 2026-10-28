import { CodePanel, type Snippet } from "../_components/code";
import Demo3 from "./demo";

// A server component: it highlights the key code with Shiki, the interactive demo is in demo.tsx.
export default function Page() {
  return <Demo3 code={<CodePanel snippets={snippets} />} />;
}

// What the API route does, simplified for the talk: the full version is in api/route.ts.
const snippets: Snippet[] = [
  {
    title: "1 · Gemini proposes 3 replies, as data",
    code: `import { generateText, jsonSchema, Output } from "ai";

// structured output: always exactly three replies, no text to parse
const repliesSchema = jsonSchema<{ curt: string; friendly: string; detailed: string }>({
  type: "object",
  properties: { curt: { type: "string" }, friendly: { type: "string" }, detailed: { type: "string" } },
  required: ["curt", "friendly", "detailed"],
});

const { output } = await generateText({
  model: "google/gemini-3.8-flash",
  instructions: "Write 3 very different replies to the reader's comment: one curt, one friendly, one detailed.",
  prompt: comment,
  output: Output.object({ schema: repliesSchema }),
});`,
  },
  {
    title: "2 · Jev scores them, in parallel",
    code: `const questions = {
  quality: score("How helpful and polite is this reply from the post's author?", [
    "Rude or dismissive",
    "Polite but unhelpful",
    "Polite and somewhat helpful",
    "Polite, clear and really helpful",
  ]),
};

// 3 calls at the same time: the time is the slowest one, not the sum
const results = await Promise.all(
  replies.map((reply) => jev.systemOne({ state: \`Comment: \${comment}\\nReply: \${reply}\`, questions })),
);`,
  },
  {
    title: "3 · Our code picks the best",
    code: `// the score goes from 0 to 3: normalize it to 0..1
const scores = results.map((r) => r.answers.quality.score / 3); // [0.50, 0.74, 1.00]
const best = scores.indexOf(Math.max(...scores));                // 2: "detailed"`,
  },
];
