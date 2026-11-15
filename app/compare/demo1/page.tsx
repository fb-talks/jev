import { CodePanel, type Snippet } from "../../_components/code";
import Compare from "./demo";

// A server component: it highlights the key code with Shiki, the interactive table is in demo.tsx.
export default function Page() {
  return <Compare code={<CodePanel snippets={snippets} />} />;
}

// What the API route does, simplified for the talk: the full version is in api/route.ts.
const snippets: Snippet[] = [
  {
    title: "Jev: a probability by design",
    code: `const questions = { offensive: noul("The comment is offensive or insulting") };

const { answers, usage } = await jev.systemOne({ state: text, questions });

answers.offensive.noul; // 0.78
usage.input_tokens;     // what we pay: Jev has no output tokens`,
  },
  {
    title: "Gemini Decision: the same kind of question",
    code: `import { experimental_decide as decide } from "ai";

const { answers, usage } = await decide({
  model: gateway.decision("google/gemini-decision-1"),
  state: text,
  questions: { offensive: { type: "boolean", instructions: "The comment is offensive or insulting" } },
});

answers.offensive.probability; // 0.92
usage.inputTokens;             // only input is billed: 0 output tokens`,
  },
  {
    title: "Gemini Flash: we ask for a number",
    code: `const { output, usage } = await generateText({
  model: gateway("google/gemini-3.8-flash"), // or "google/gemini-3.5-flash-lite"
  instructions: 'Return the probability, from 0 to 1, that this statement is true: "The comment is offensive or insulting".',
  prompt: text,
  output: Output.object({ schema }), // { probability: number }
});

output.probability;            // a number the model writes, token by token
usage.inputTokens + usage.outputTokens; // output includes the reasoning tokens`,
  },
];
