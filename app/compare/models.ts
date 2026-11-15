// The models we compare, shared by the page and the API route.
// kind: "decision" = typed questions, a probability by design, no output tokens (Jev, Gemini Decision);
//       "llm"      = a text model asked to write the probability as JSON (Gemini Flash, Flash Lite).
// Prices: USD per million tokens, paid tier, standard (not batch), from ai.google.dev pricing and the
// Vercel AI Gateway price list, November 2026. To add a model: one line here.
export const models = [
  {
    id: "jev",
    name: "Jev",
    kind: "decision",
    gateway: "typesafe-ai/jev",
    input: 0.042,
    output: 0,
    billing: "Input tokens only: the comment and the question. No output tokens.",
  },
  {
    id: "gemini-decision",
    name: "Gemini Decision 1",
    kind: "decision",
    gateway: "google/gemini-decision-1",
    input: 0.1,
    output: 0,
    billing: "Input tokens only: the comment and the question. No output tokens.",
  },
  {
    id: "gemini-flash",
    name: "Gemini 3.8 Flash",
    kind: "llm",
    gateway: "google/gemini-3.8-flash",
    input: 0.75,
    output: 3.75,
    billing: "Input + output, and output includes the thinking tokens. Doubles from 1 Jan 2027 ($1.50 / $7.50).",
  },
  {
    id: "gemini-flash-lite",
    name: "Gemini 3.5 Flash Lite",
    kind: "llm",
    gateway: "google/gemini-3.5-flash-lite",
    input: 0.3,
    output: 2.5,
    billing: "Input + output, and output includes the thinking tokens.",
  },
] as const;

export type Model = (typeof models)[number];
export type ModelId = Model["id"];

// The estimated cost of one call, in USD: tokens × price list
export function estimateCost(id: ModelId, inputTokens: number, outputTokens: number) {
  const m = models.find((m) => m.id === id)!;
  return (inputTokens * m.input + outputTokens * m.output) / 1_000_000;
}
