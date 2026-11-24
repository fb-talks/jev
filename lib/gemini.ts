import { GoogleGenAI } from "@google/genai";
import type { ChoiceQuestion, NoulQuestion, ScoreQuestion } from "@typesafe-ai/sdk";
import type { ApiKeys } from "./keys";

// Gemini, always through Google's own SDK (@google/genai) and a Gemini API key. Server only.
export function geminiClient(keys: ApiKeys) {
  if (!keys.gemini) throw new Error("No API key for Gemini: add a Gemini key in the 🔑 panel.");
  return new GoogleGenAI({ apiKey: keys.gemini, apiVersion: "v1beta" });
}

// The SDK's error messages are raw JSON, or say nothing: the readable one is in the body of the response.
function readable(err: unknown): never {
  const body = (err as { body?: unknown })?.body;
  if (typeof body === "string") {
    let message: string | undefined;
    try {
      const data = JSON.parse(body);
      message = (Array.isArray(data) ? data[0] : data)?.error?.message;
    } catch {}
    if (message) throw new Error(`Gemini: ${message}`, { cause: err });
  }
  throw err;
}

// A JSON schema that remembers the type of the data it describes.
export type Schema<T> = { json: object; type?: T };
export const jsonSchema = <T>(json: object): Schema<T> => ({ json });

export type Tokens = { inputTokens: number; outputTokens: number; reasoningTokens: number };

type Request = { model?: string; instructions: string; prompt: string; thinking?: "low" | "medium" | "high" };

// One call to a text model. With a schema, the answer is JSON that follows it.
export async function generate(keys: ApiKeys, request: Request): Promise<{ text: string; tokens: Tokens }>;
export async function generate<T>(keys: ApiKeys, request: Request & { schema: Schema<T> }): Promise<{ text: string; output: T; tokens: Tokens }>;
export async function generate<T>(
  keys: ApiKeys,
  { model = "gemini-3.8-flash", instructions, prompt, thinking, schema }: Request & { schema?: Schema<T> },
) {
  const interaction = await geminiClient(keys)
    .interactions.create({
      model,
      system_instruction: instructions,
      input: prompt,
      store: false, // Google doesn't keep the conversation
      ...(thinking && { generation_config: { thinking_level: thinking } }),
      ...(schema && { response_format: { type: "text" as const, mime_type: "application/json" as const, schema: schema.json } }),
    })
    .catch(readable);

  const text = interaction.output_text;
  if (!text) throw new Error(`Gemini returned no text (${interaction.status})`);

  const u = interaction.usage;
  const inputTokens = u?.total_input_tokens ?? 0;
  const tokens: Tokens = {
    inputTokens,
    outputTokens: (u?.total_tokens ?? inputTokens) - inputTokens, // everything that isn't input: the thinking tokens are billed as output
    reasoningTokens: u?.total_thought_tokens ?? 0,
  };
  return { text, tokens, ...(schema && { output: JSON.parse(text) as T }) };
}

// ---------- Gemini Decision ----------

export type Questions = Record<string, NoulQuestion | ChoiceQuestion | ScoreQuestion>;
type Probabilities = { confidence: number; probabilities: Record<string, number> };
type AnswerTo<Q> = Q extends { type: "noul" }
  ? { noul: number; confidence: number }
  : Q extends { type: "choice" }
    ? Probabilities & { choice: string }
    : Probabilities & { score: number; legend: Record<string, string> };

// One call to the Decisions API: every question answered together, with probabilities and no output tokens.
// noul, choice and score are the same JSON in the two SDKs, so it takes Jev's questions as they are.
export async function decide<Q extends Questions>(keys: ApiKeys, { model = "gemini-decision-1", input, questions }: { model?: string; input: string; questions: Q }) {
  type Params = Parameters<ReturnType<typeof geminiClient>["decisions"]["create"]>[0];
  const { answers, usage } = await geminiClient(keys)
    .decisions.create({
      model,
      input,
      questions: questions as unknown as Params["questions"], // only the types differ: Jev's also allow null and objects
    })
    .catch(readable);

  for (const [id, q] of Object.entries(questions)) {
    if (answers?.[id]?.type !== q.type) throw new Error(`Gemini Decision didn't answer "${id}"`);
  }
  const tokens: Tokens = { inputTokens: usage?.total_input_tokens ?? 0, outputTokens: usage?.total_output_tokens ?? 0, reasoningTokens: 0 };
  return { answers: answers as unknown as { [K in keyof Q]: AnswerTo<Q[K]> }, tokens };
}
