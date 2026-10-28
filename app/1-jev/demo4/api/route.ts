import { choice, noul, score } from "@typesafe-ai/sdk";
import { apiKeys, jevClient } from "@/lib/keys";

// The same questions as Demo 3: the evaluation measures this exact moderation setup.
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

// Demo 4: one CSV row per call. The page sends the rows a few at a time
// and compares Jev's decision with the expected one.
export async function POST(request: Request) {
  const { text } = await request.json();
  const keys = await apiKeys();

  if (typeof text !== "string" || !text.trim()) {
    return Response.json({ error: "Empty comment." }, { status: 400 });
  }

  try {
    // Jev with the key from the 🔑 panel, or the server one (see lib/keys.ts)
    const jev = jevClient(keys);

    const start = performance.now();
    const result = await jev.systemOne({ state: text, questions });
    const ms = Math.round(performance.now() - start);

    return Response.json({ answers: result.answers, usage: result.usage, ms });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: `AI call failed: ${message}` }, { status: 502 });
  }
}
