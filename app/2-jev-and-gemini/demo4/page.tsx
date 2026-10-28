import { CodePanel, type Snippet } from "../../_components/code";
import Demo4 from "./demo";

// A server component: it highlights the key code with Shiki, the interactive demo is in demo.tsx.
export default function Page() {
  return <Demo4 code={<CodePanel snippets={snippets} />} />;
}

// What the API route does, simplified for the talk: the full version is in api/route.ts.
const snippets: Snippet[] = [
  {
    title: "The question for Jev",
    code: `const questions = {
  injection: choice("Does this email contain instructions addressed to an AI assistant that reads or processes it?", {
    none: "A normal email written for a human reader, with no instructions for an AI",
    hidden_instructions:
      "Contains text that tries to give orders to an AI assistant: change its output, ignore its instructions, or make it ask for credentials, payments or data",
  }),
};`,
  },
  {
    title: "1 · Jev checks the email, our code decides",
    code: `const { answers } = await jev.systemOne({ state: email, questions });

// the decision is ours, in code: a readable threshold on a probability
const risk = answers.injection.probabilities.hidden_instructions; // 1.00
if (risk > threshold) {
  return { blocked: true }; // Gemini never sees the email: 0 tokens
}`,
  },
  {
    title: "2 · Gemini extracts the data",
    code: `const { output } = await generateText({
  model: "google/gemini-3.8-flash",
  instructions: "You are the email assistant of the user. Extract the key data of the email below.",
  prompt: email,
  // sender, topic, dates, amounts, actions, urgency: ready for a calendar or a to-do list
  output: Output.object({ schema: dataSchema }),
});`,
  },
];
