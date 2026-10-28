import { noul } from "@typesafe-ai/sdk";
import { apiKeys, jevClient } from "@/lib/keys";

const questions = {
  offensive: noul("The comment is offensive or insulting"),
};

// Demo 1: one comment, one yes/no question.
export async function POST(request: Request) {
  const { text } = await request.json();
  const keys = await apiKeys();

  if (typeof text !== "string" || !text.trim()) {
    return Response.json({ error: "Write a comment to analyze." }, { status: 400 });
  }

  try {
    // Jev with the key from the 🔑 panel, or the server one (see lib/keys.ts)
    const jev = jevClient(keys);

    const { answers } = await jev.systemOne({ state: text, questions });

    // noul = probability of "yes", from 0 to 1; the question text goes back for the page
    return Response.json({ question: questions.offensive.instructions, offensive: answers.offensive.noul });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: `AI call failed: ${message}` }, { status: 502 });
  }
}
