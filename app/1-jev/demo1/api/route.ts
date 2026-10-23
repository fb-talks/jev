import { noul, TypeSafeClient } from "@typesafe-ai/sdk";

const questions = {
  offensive: noul("The comment is offensive or insulting"),
};

// Demo 1: one comment, one yes/no question.
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

    const { answers } = await jev.systemOne({ state: text, questions });

    // noul = probability of "yes", from 0 to 1; the question text goes back for the page
    return Response.json({ question: questions.offensive.instructions, offensive: answers.offensive.noul });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: `AI call failed: ${message}` }, { status: 502 });
  }
}
