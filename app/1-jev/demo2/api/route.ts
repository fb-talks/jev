import { choice, noul, score } from "@typesafe-ai/sdk";
import { apiKeys } from "@/lib/keys";
import { ask } from "../../ask";
import { models, type ModelId } from "../../models";

// The descriptions are our "prompt": the clearer they are, the better the probabilities.
const questions = {
  category: choice("What kind of comment is this, relative to a post on a tech blog about Angular framework?", {
    relevant: "Comment, opinion or question about the post's content",
    spam: "Advertising, promotional links or unsolicited messages",
    off_topic: "Has nothing to do with the post",
    adult: "Sexually explicit or adult content",
  }),
  toxicity: score("How offensive is the tone of the comment?", [
    "Polite or neutral",
    "Critical but respectful",
    "Combative or sarcastic toward people",
    "Insults, hate or personal attacks",
  ]),
  asks_author: noul("The comment asks the post's author a question"),
};

// Demo 2: one question of each type (choice, score, noul), with all their probabilities.
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
    // Jev, Gemini Decision or an LLM: the same questions, the answers in the same shape (see ask.ts)
    const { model: modelId, answers, usage } = await ask(keys, m, text, questions);
    // the questions go back too, so the page shows the exact text the model received
    return Response.json({ questions, model: modelId, answers, usage });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: `AI call failed: ${message}` }, { status: 502 });
  }
}
