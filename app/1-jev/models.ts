// The models of the Jev demos, shared by the pages and the API routes.
// kind: "jev" = TypeSafe SDK; "decision" = Google SDK, decisions.create();
// "llm" = Google SDK, a text model that writes the probability as JSON.
// To add an LLM: one line here.
export const models = [
  { id: "jev", name: "Jev", kind: "jev", model: "typesafe-ai/jev" },
  { id: "gemini-decision", name: "Gemini Decision 1", kind: "decision", model: "gemini-decision-1" },
  { id: "gemini-carbon", name: "Gemini 4 Carbon", kind: "llm", model: "gemini-4-carbon" },
  { id: "gemini-neon", name: "Gemini 4 Neon", kind: "llm", model: "gemini-4-neon" },
  { id: "gemini-hydrogen", name: "Gemini 4 Hydrogen", kind: "llm", model: "gemini-4-hydrogen" },
] as const;

export type Model = (typeof models)[number];
export type ModelId = Model["id"];

// The lowest thinking level the three Gemini 4 models list in their docs: the same for all of them.
export const llmThinking = "low";

// What every answer costs, the same shape for every model. outputTokens includes the reasoning tokens.
export type Usage = { ms: number; inputTokens: number; outputTokens: number; reasoningTokens: number };

// The answers of demos 2 and 3, the same shape for every model (it's the one Jev returns).
// confidence: reported by Jev and Gemini Decision, each with its own definition; the LLMs don't have one.
export type ChoiceAnswer = { choice: string; confidence?: number; probabilities: Record<string, number> };
export type ScoreAnswer = { score: number; confidence?: number; probabilities: Record<string, number>; legend: Record<string, string> };
export type NoulAnswer = { noul: number };
