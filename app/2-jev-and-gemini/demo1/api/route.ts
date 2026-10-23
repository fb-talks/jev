import { choice, score, TypeSafeClient } from "@typesafe-ai/sdk";
import { generateText } from "ai";

// The descriptions are our "prompt": the clearer they are, the better the probabilities.
const questions = {
  category: choice("What kind of comment is this, relative to a post on a tech blog?", {
    relevant: "Comment, opinion or question about the post's content",
    spam: "Advertising, promotional links or unsolicited messages",
    off_topic: "Has nothing to do with the post",
  }),
  toxicity: score("How offensive is the tone of the comment?", [
    "Polite or neutral",
    "Critical but respectful",
    "Combative or sarcastic toward people",
    "Insults, hate or personal attacks",
  ]),
};

// Demo 1: Gemini writes a comment, Jev moderates it.
export async function POST(request: Request) {
  const { topic } = await request.json();

  if (typeof topic !== "string" || !topic.trim()) {
    return Response.json({ error: "Describe the comment to write." }, { status: 400 });
  }

  try {
    // Gemini goes through the same Vercel AI Gateway: with a "provider/model" string
    // the AI SDK uses the Gateway on its own and reads the same credential.
    const { text } = await generateText({
      model: "google/gemini-3.8-flash",
      instructions: "You are a reader of a tech blog. Write a single comment of 1-2 sentences. Only the comment, no quotes.",
      prompt: `Write a comment with this intent: ${topic}`,
    });
    const comment = text.trim();

    // Jev through Vercel AI Gateway, with TypeSafe's official SDK. The key stays on the server:
    // AI_GATEWAY_API_KEY locally, the OIDC token on Vercel. Created here because the
    // constructor throws when the key is missing.
    const jev = new TypeSafeClient({
      apiKey: process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_OIDC_TOKEN,
      baseURL: "https://ai-gateway.vercel.sh/typesafe",
      defaultModel: "typesafe-ai/jev",
    });

    const { answers } = await jev.systemOne({ state: comment, questions });

    // the questions go back too, so the page shows the exact text Jev received
    return Response.json({ comment, questions, answers });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: `AI call failed: ${message}` }, { status: 502 });
  }
}
