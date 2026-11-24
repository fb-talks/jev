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
    title: "Gemini Decision: the very same question",
    code: `import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const { answers, usage } = await ai.decisions.create({
  model: "gemini-decision-1",
  input: text,
  questions, // the same object as Jev: { type: "noul", instructions: "..." }
});

answers.offensive.noul;  // the probability of "yes", from 0 to 1
usage.total_input_tokens; // only input is billed: 0 output tokens`,
  },
  {
    title: "Gemini Flash: we ask for a number",
    code: `const interaction = await ai.interactions.create({
  model: "gemini-3.8-flash", // or "gemini-3.5-flash-lite"
  system_instruction: 'Return the probability, from 0 to 1, that this statement is true: "The comment is offensive or insulting".',
  input: text,
  response_format: { type: "text", mime_type: "application/json", schema },
});

JSON.parse(interaction.output_text).probability; // a number the model writes, token by token`,
  },
];
