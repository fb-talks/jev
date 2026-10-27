import { choice, noul, score, TypeSafeClient } from "@typesafe-ai/sdk";
import { generateText, jsonSchema, Output } from "ai";

// The criteria, written once and shared by both models, so the comparison is fair.
const categories = {
  relevant: "Comment, opinion or question about the post's content",
  spam: "Advertising, promotional links or unsolicited messages",
  off_topic: "Has nothing to do with the post",
};

const toxicityLevels = [
  "Polite or neutral",
  "Critical but respectful",
  "Combative or sarcastic toward people",
  "Insults, hate or personal attacks",
];

const personalData = "The comment contains personal data such as an email address, phone number or home address";

const jevQuestions = {
  category: choice("What kind of comment is this, relative to a post on a tech blog?", categories),
  toxicity: score("How offensive is the tone of the comment?", toxicityLevels),
  personal_data: noul(personalData),
};

// Gemini answers the same three questions, with labels instead of probabilities.
const geminiSchema = jsonSchema<{ category: keyof typeof categories; toxicity: number; personal_data: boolean }>({
  type: "object",
  properties: {
    category: { type: "string", enum: Object.keys(categories) },
    toxicity: { type: "integer", minimum: 0, maximum: 3 },
    personal_data: { type: "boolean" },
  },
  required: ["category", "toxicity", "personal_data"],
  additionalProperties: false,
});

const geminiInstructions = `You moderate comments on a tech blog. Answer three questions about the comment.
category, what kind of comment is this, relative to a post on a tech blog:
${Object.entries(categories).map(([k, v]) => `- ${k}: ${v}`).join("\n")}

toxicity, how offensive is the tone of the comment, from 0 to 3:
${toxicityLevels.map((l, i) => `- ${i}: ${l}`).join("\n")}

personal_data, true if: ${personalData}`;

// Demo 6: one CSV row per call, classified by the chosen models (Jev, Gemini or both) at the same time.
export async function POST(request: Request) {
  const { text, models = ["jev", "gemini"] } = await request.json();
  const runJev = models.includes("jev");
  const runGemini = models.includes("gemini");

  if (typeof text !== "string" || !text.trim()) {
    return Response.json({ error: "Empty comment." }, { status: 400 });
  }

  try {
    // Jev through Vercel AI Gateway: AI_GATEWAY_API_KEY locally, the OIDC token on Vercel.
    const jev = new TypeSafeClient({
      apiKey: process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_OIDC_TOKEN,
      baseURL: "https://ai-gateway.vercel.sh/typesafe",
      defaultModel: "typesafe-ai/jev",
    });

    // the chosen models at the same time, each with its own stopwatch
    const [jevResult, geminiResult] = await Promise.all([
      runJev ? timed(() => jev.systemOne({ state: text, questions: jevQuestions })) : null,
      runGemini
        ? timed(() =>
            generateText({
              model: "google/gemini-3.8-flash",
              instructions: geminiInstructions,
              prompt: text,
              output: Output.object({ schema: geminiSchema }),
            }),
          )
        : null,
    ]);

    return Response.json({
      jev: jevResult && { answers: jevResult.value.answers, ms: jevResult.ms },
      gemini: geminiResult && { answers: geminiResult.value.output, ms: geminiResult.ms },
    });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: `AI call failed: ${message}` }, { status: 502 });
  }
}

async function timed<T>(fn: () => Promise<T>) {
  const start = performance.now();
  const value = await fn();
  return { value, ms: Math.round(performance.now() - start) };
}
