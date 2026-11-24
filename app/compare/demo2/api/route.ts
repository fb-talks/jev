import { choice, noul, score } from "@typesafe-ai/sdk";
import { decide, generate, jsonSchema } from "@/lib/gemini";
import { apiKeys, jevClient } from "@/lib/keys";
import { estimateCost, models, type ModelId } from "../../models";

// The criteria of 1-jev/demo4, written once and shared by every model, so the comparison is fair.
const categoryQuestion = "What kind of comment is this, relative to a post on a tech blog?";
const categories = {
  relevant: "Comment, opinion or question about the post's content",
  spam: "Advertising, promotional links or unsolicited messages",
  off_topic: "Has nothing to do with the post",
};
const toxicityQuestion = "How offensive is the tone of the comment?";
const toxicityLevels = [
  "Polite or neutral",
  "Critical but respectful",
  "Combative or sarcastic toward people",
  "Insults, hate or personal attacks",
];
const personalData = "The comment contains personal data such as an email address, phone number or home address";

// Jev and Gemini Decision take the very same questions
const questions = {
  category: choice(categoryQuestion, categories),
  toxicity: score(toxicityQuestion, toxicityLevels),
  personal_data: noul(personalData),
};

// Gemini Flash / Flash Lite: the same questions in the prompt, the probabilities written as JSON.
type LlmAnswers = {
  category: { relevant: number; spam: number; off_topic: number };
  toxicity: number;
  personal_data: number;
};
const schema = jsonSchema<LlmAnswers>({
  type: "object",
  properties: {
    category: {
      type: "object",
      properties: Object.fromEntries(Object.keys(categories).map((k) => [k, { type: "number", minimum: 0, maximum: 1 }])),
      required: Object.keys(categories),
      additionalProperties: false,
    },
    toxicity: { type: "number", minimum: 0, maximum: 3 },
    personal_data: { type: "number", minimum: 0, maximum: 1 },
  },
  required: ["category", "toxicity", "personal_data"],
  additionalProperties: false,
});
const instructions = `You moderate comments on a tech blog. Answer three questions about the comment.

category: ${categoryQuestion} Give the probability of each option, from 0 to 1, summing to 1:
${Object.entries(categories).map(([k, v]) => `- ${k}: ${v}`).join("\n")}

toxicity: ${toxicityQuestion} The expected level, from 0 to 3 (decimals allowed):
${toxicityLevels.map((l, i) => `- ${i}: ${l}`).join("\n")}

personal_data: the probability, from 0 to 1, that this is true: ${personalData}`;

// What the policy reads, the same shape for every model: risks from 0 to 1.
export type Signals = { spam: number; off_topic: number; toxicity: number; personal_data: number };

// Compare demo 2: one CSV row and one model per call. The page sends every model at the same time.
export async function POST(request: Request) {
  const { text, model } = (await request.json()) as { text: unknown; model: ModelId };
  const keys = await apiKeys();
  const m = models.find((m) => m.id === model);

  if (typeof text !== "string" || !text.trim()) {
    return Response.json({ error: "Empty comment." }, { status: 400 });
  }
  if (!m) {
    return Response.json({ error: `Unknown model: ${model}` }, { status: 400 });
  }

  try {
    const start = performance.now();
    let signals: Signals, inputTokens: number, outputTokens: number, reasoningTokens = 0;

    if (m.id === "jev") {
      // Jev with the key from the 🔑 panel, or the server one (see lib/keys.ts)
      const { answers, usage } = await jevClient(keys).systemOne({ state: text, questions });
      signals = {
        spam: answers.category.probabilities.spam ?? 0,
        off_topic: answers.category.probabilities.off_topic ?? 0,
        toxicity: answers.toxicity.score / 3, // the score goes from 0 to 3: normalize it to 0..1
        personal_data: answers.personal_data.noul,
      };
      inputTokens = usage.input_tokens ?? 0;
      outputTokens = usage.output_tokens ?? 0;
    } else if (m.kind === "decision") {
      const { answers, tokens } = await decide(keys, { model: m.model, input: text, questions });
      signals = {
        spam: answers.category.probabilities.spam ?? 0,
        off_topic: answers.category.probabilities.off_topic ?? 0,
        toxicity: answers.toxicity.score / 3,
        personal_data: answers.personal_data.noul,
      };
      ({ inputTokens, outputTokens } = tokens);
    } else {
      const { output, tokens } = await generate(keys, { model: m.model, instructions, prompt: text, schema });
      signals = {
        spam: output.category.spam,
        off_topic: output.category.off_topic,
        toxicity: output.toxicity / 3,
        personal_data: output.personal_data,
      };
      ({ inputTokens, outputTokens, reasoningTokens } = tokens); // outputTokens includes the thinking: it's billed as output
    }

    return Response.json({
      signals,
      ms: Math.round(performance.now() - start),
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
