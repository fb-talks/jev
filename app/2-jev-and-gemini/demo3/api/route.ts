import { score, TypeSafeClient } from "@typesafe-ai/sdk";
import { generateText } from "ai";

const questions = {
  quality: score("How helpful and polite is this reply from the post's author?", [
    "Rude or dismissive",
    "Polite but unhelpful",
    "Polite and somewhat helpful",
    "Polite, clear and really helpful",
  ]),
};

// Demo 3: Gemini proposes 3 replies, Jev scores them, our code picks the best one.
export async function POST(request: Request) {
  const { text } = await request.json();

  if (typeof text !== "string" || !text.trim()) {
    return Response.json({ error: "Write a comment to reply to." }, { status: 400 });
  }

  try {
    // Gemini goes through the same Vercel AI Gateway: with a "provider/model" string
    // the AI SDK uses the Gateway on its own and reads the same credential.
    const gemini = await generateText({
      model: "google/gemini-3.8-flash",
      instructions: "You are the author of a tech blog post. Write 3 very different replies to the reader's comment: one curt, one friendly, one detailed. One reply per line, no numbering, no quotes.",
      prompt: text,
    });
    const replies = gemini.text.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 3);

    // Jev through Vercel AI Gateway, with TypeSafe's official SDK. The key stays on the server:
    // AI_GATEWAY_API_KEY locally, the OIDC token on Vercel. Created here because the
    // constructor throws when the key is missing.
    const jev = new TypeSafeClient({
      apiKey: process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_OIDC_TOKEN,
      baseURL: "https://ai-gateway.vercel.sh/typesafe",
      defaultModel: "typesafe-ai/jev",
    });

    // the 3 Jev calls run in parallel
    const results = await Promise.all(
      replies.map((reply) => jev.systemOne({ state: `Comment: ${text}\nReply: ${reply}`, questions })),
    );

    // the score goes from 0 to 3: normalize it to 0..1
    const scored = replies.map((reply, i) => ({ text: reply, score: results[i].answers.quality.score / 3 }));
    const best = scored.reduce((a, b) => (b.score > a.score ? b : a));

    // the questions go back too, so the page shows the exact text Jev received
    return Response.json({ question: questions.quality.instructions, replies: scored, best: best.text });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: `AI call failed: ${message}` }, { status: 502 });
  }
}
