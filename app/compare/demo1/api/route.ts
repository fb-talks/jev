import { noul } from "@typesafe-ai/sdk";
import { experimental_decide as decide, generateText, jsonSchema, Output } from "ai";
import { apiKeys, decisionModel, geminiModel, jevClient } from "@/lib/keys";
import { estimateCost, models, type ModelId } from "../../models";

// The same statement for every model, so the comparison is fair.
const statement = "The comment is offensive or insulting";

// Jev: TypeSafe SDK
const jevQuestions = { offensive: noul(statement) };

// Gemini Decision: the AI SDK decide(), the same kind of typed yes/no question
const decisionQuestions = { offensive: { type: "boolean", instructions: statement } } as const;

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
      const { answers, usage } = await jevClient(keys).systemOne({ state: text, questions: jevQuestions });
      probability = answers.offensive.noul;
      inputTokens = usage.input_tokens ?? 0;
      outputTokens = usage.output_tokens ?? 0;
    } else if (m.kind === "decision") {
      const { answers, usage } = await decide({ model: decisionModel(keys, m.gateway), state: text, questions: decisionQuestions });
      probability = answers.offensive.probability;
      inputTokens = usage.inputTokens ?? 0;
      outputTokens = usage.outputTokens ?? 0;
    } else {
      const { output, usage } = await generateText({
        model: geminiModel(keys, m.gateway),
        instructions,
        prompt: text,
        output: Output.object({ schema }),
      });
      probability = output.probability;
      inputTokens = usage.inputTokens ?? 0;
      outputTokens = usage.outputTokens ?? 0; // reasoning tokens included: they are billed as output
      reasoningTokens = usage.outputTokenDetails.reasoningTokens ?? 0;
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
