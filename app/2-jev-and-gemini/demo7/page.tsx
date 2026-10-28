import { CodePanel, type Snippet } from "../_components/code";
import Demo7 from "./demo";

// A server component: it highlights the key code with Shiki, the interactive demo is in demo.tsx.
export default function Page() {
  return <Demo7 code={<CodePanel snippets={snippets} />} />;
}

// What the API route does, simplified for the talk: the full version is in api/route.ts.
const snippets: Snippet[] = [
  {
    title: "The question for Jev: what does the customer need?",
    code: `const questions = {
  intent: choice("What does the customer need from this support message?", {
    greeting: "Only a greeting, thanks or small talk: no request and no problem",
    order_status: "Only asks where an order is or when it will arrive, with no other problem",
    password_reset: "Only asks how to reset or recover the password; not a problem with the reset itself",
    complex: "Anything else: a problem, a complaint, several issues, or a question that needs a real answer",
  }),
};`,
  },
  {
    title: "1 · Jev classifies every message",
    code: `const { answers } = await jev.systemOne({ state: message, questions });
const { choice: intent, probabilities } = answers.intent;
const probability = probabilities[intent]; // e.g. "order_status", 0.99 in ~0.3 s`,
  },
  {
    title: "2 · Our code routes it",
    code: `// a simple intent, and Jev sure enough about it: a ready answer, no Gemini, 0 tokens
if (intent in templates && probability >= threshold) {
  return { route: "template", reply: templates[intent](message) };
}

// everything else, or when Jev isn't sure: Gemini writes the reply
const { text } = await generateText({
  model: "google/gemini-3.8-flash",
  instructions: "You are a customer support agent of a software company. Reply in 1-3 sentences.",
  prompt: message,
});
return { route: "gemini", reply: text };`,
  },
];
