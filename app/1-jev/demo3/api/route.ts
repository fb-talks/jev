import { choice, noul, score, TypeSafeClient } from "@typesafe-ai/sdk";

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
  personal_data: noul(
    "The comment contains personal data such as an email address, phone number or home address",
  ),
};

// Demo 3: all the questions, plus model, usage and latency for the debug panel.
// The decision (publish / review / reject) is made in the page, by our code.
export async function POST(request: Request) {
  const { text } = await request.json();

  if (typeof text !== "string" || !text.trim()) {
    return Response.json({ error: "Write a comment to analyze." }, { status: 400 });
  }

  try {
    // Jev through Vercel AI Gateway, with TypeSafe's official SDK. The key stays on the server:
    // AI_GATEWAY_API_KEY locally, the OIDC token on Vercel. Created here because the
    // constructor throws when the key is missing.
    const jev = new TypeSafeClient({
      apiKey: process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_OIDC_TOKEN,
      baseURL: "https://ai-gateway.vercel.sh/typesafe",
      defaultModel: "typesafe-ai/jev",
    });

    const start = performance.now();
    const result = await jev.systemOne({ state: text, questions });
    const ms = Math.round(performance.now() - start);

    // the questions go back too, so the page shows the exact text Jev received
    return Response.json({
      questions,
      model: result.model,
      usage: result.usage,
      ms,
      answers: result.answers,
    });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: `AI call failed: ${message}` }, { status: 502 });
  }
}
