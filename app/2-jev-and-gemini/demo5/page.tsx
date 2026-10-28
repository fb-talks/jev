import { CodePanel, type Snippet } from "../../_components/code";
import Demo5 from "./demo";

// A server component: it highlights the key code with Shiki, the interactive demo is in demo.tsx.
export default function Page() {
  return <Demo5 code={<CodePanel snippets={snippets} />} />;
}

// What the API route does, simplified for the talk: the full version is in api/route.ts.
const snippets: Snippet[] = [
  {
    title: "The same criteria for both models",
    code: `// written once: Jev gets them as questions, Gemini in its instructions and schema
const types = { ecommerce: "Online shop: product pages, cart, prices", news: "News outlet or magazine", /* … */ };
const sectors = { tech: "Technology, software, developer tools", finance: "Banking, payments", /* … */ };

const jevQuestions = {
  type: choice("What kind of website is this?", types),
  sector: choice("Which sector does this website belong to?", sectors),
  commercial: score("How commercial is this page?", commercialLevels),
};

const geminiSchema = jsonSchema({
  type: "object",
  properties: {
    type: { type: "string", enum: Object.keys(types) },
    sector: { type: "string", enum: Object.keys(sectors) },
    commercial: { type: "integer", minimum: 0, maximum: 3 },
  },
});`,
  },
  {
    title: "Same text, both models, at the same time",
    code: `const page = await scrape(url); // title, description and visible text, once

const [jevResult, geminiResult] = await Promise.all([
  timed(() => jev.systemOne({ state: page.text, questions: jevQuestions })),
  timed(() =>
    generateText({
      model: "google/gemini-3.8-flash",
      instructions: geminiInstructions,
      prompt: page.text,
      output: Output.object({ schema: geminiSchema }),
    }),
  ),
]);
// each with its own stopwatch: jevResult.ms vs geminiResult.ms`,
  },
];
