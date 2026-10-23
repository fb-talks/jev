import { noul, TypeSafeClient } from "@typesafe-ai/sdk";
import { generateText } from "ai";

const questions = { offensive: noul("The comment is offensive or insulting") };

// Demo 2: Jev measures, Gemini rewrites, Jev measures again.
export async function POST(request: Request) {
  const { text } = await request.json();

  if (typeof text !== "string" || !text.trim()) {
    return Response.json({ error: "Write a comment to rewrite." }, { status: 400 });
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

    const before = await jev.systemOne({ state: text, questions });

    // Gemini goes through the same Vercel AI Gateway: with a "provider/model" string
    // the AI SDK uses the Gateway on its own and reads the same credential.
    const gemini = await generateText({
      model: "google/gemini-3.8-flash",
      instructions: "Rewrite the comment in a polite, respectful tone, keeping its meaning and criticism. Only the rewritten comment, no quotes.",
      prompt: text,
    });
    const rewritten = gemini.text.trim();

    const after = await jev.systemOne({ state: rewritten, questions });

    // the questions go back too, so the page shows the exact text Jev received
    return Response.json({
      question: questions.offensive.instructions,
      before: before.answers.offensive.noul,
      rewritten,
      after: after.answers.offensive.noul,
    });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: `AI call failed: ${message}` }, { status: 502 });
  }
}
