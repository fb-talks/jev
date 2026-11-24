import { noul } from "@typesafe-ai/sdk";
import { decide, generate, jsonSchema } from "@/lib/gemini";
import { apiKeys, jevClient } from "@/lib/keys";
import { estimateCost, models, type ModelId } from "../../models";

// The same statement for every model, so the comparison is fair.
const statement = "The comment is offensive or insulting";

// Jev and Gemini Decision take the very same question
const questions = { offensive: noul(statement) };

// Gemini Flash / Flash Lite can't return a probability by themselves: we ask for one, as a number from 0 to 1.
const schema = jsonSchema<{ probability: number }>({
  type: "object",
  properties: { probability: { type: "number", minimum: 0, maximum: 1 } },
  required: ["probability"],
  additionalProperties: false,
});
const instructions = `Read the comment and return the probability, from 0 to 1, that this statement is true: "${statement}".`;

// One model per call: the page calls them one at a time, or all together, and each answer has its own stopwatch.
export async function POST(request: Request) {
  const { text, model } = (await request.json()) as { text: unknown; model: ModelId };
  const keys = await apiKeys();
  const m = models.find((m) => m.id === model);

  if (typeof text !== "string" || !text.trim()) {
    return Response.json({ error: "Write a comment to analyze." }, { status: 400 });
  }
  if (!m) {
    return Response.json({ error: `Unknown model: ${model}` }, { status: 400 });
  }

  try {
    const start = performance.now();
    let probability: number, inputTokens: number, outputTokens: number, reasoningTokens = 0;

    if (m.id === "jev") {
      // Jev with the key from the 🔑 panel, or the server one (see lib/keys.ts)
      const { answers, usage } = await jevClient(keys).systemOne({ state: text, questions });
      probability = answers.offensive.noul;
      inputTokens = usage.input_tokens ?? 0;
      outputTokens = usage.output_tokens ?? 0;
    } else if (m.kind === "decision") {
      const { answers, tokens } = await decide(keys, { model: m.model, input: text, questions });
      probability = answers.offensive.noul;
      ({ inputTokens, outputTokens } = tokens);
    } else {
      const { output, tokens } = await generate(keys, {
        model: m.model,
        instructions,
        prompt: text,
        schema,
      });
      probability = output.probability;
      ({ inputTokens, outputTokens, reasoningTokens } = tokens); // outputTokens includes the thinking: it's billed as output
    }

    const ms = Math.round(performance.now() - start);
    return Response.json({
      probability,
      ms,
      inputTokens,
      outputTokens,
      reasoningTokens,
      cost: estimateCost(m.id, inputTokens, outputTokens),
    });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: `AI call failed: ${message}` }, { status: 502 });
  }
}
