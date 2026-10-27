import { noul, TypeSafeClient } from "@typesafe-ai/sdk";
import { generateText } from "ai";

const questions = { offensive: noul("The comment is offensive or insulting") };

// Demo 1: Jev measures, Gemini rewrites, Jev measures again.
// The response is a stream of JSON lines, one per step, so the page shows each step (and its speed) as it ends.
export async function POST(request: Request) {
  const { text } = await request.json();

  if (typeof text !== "string" || !text.trim()) {
    return Response.json({ error: "Write a comment to rewrite." }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: object) => controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));

      try {
        // Jev through Vercel AI Gateway, with TypeSafe's official SDK. The key stays on the server:
        // AI_GATEWAY_API_KEY locally, the OIDC token on Vercel. Created here because the
        // constructor throws when the key is missing.
        const jev = new TypeSafeClient({
          apiKey: process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_OIDC_TOKEN,
          baseURL: "https://ai-gateway.vercel.sh/typesafe",
          defaultModel: "typesafe-ai/jev",
        });

        let start = performance.now();
        const before = await jev.systemOne({ state: text, questions });
        // the question goes back too, so the page shows the exact text Jev received
        send({ step: "before", ms: Math.round(performance.now() - start), question: questions.offensive.instructions, offensive: before.answers.offensive.noul });

        // Gemini goes through the same Vercel AI Gateway: with a "provider/model" string
        // the AI SDK uses the Gateway on its own and reads the same credential.
        start = performance.now();
        const gemini = await generateText({
          model: "google/gemini-3.8-flash",
          instructions: "Rewrite the comment in a polite, respectful tone, keeping its meaning and criticism. Only the rewritten comment, no quotes.",
          prompt: text,
        });
        const rewritten = gemini.text.trim();
        send({ step: "gemini", ms: Math.round(performance.now() - start), rewritten });

        start = performance.now();
        const after = await jev.systemOne({ state: rewritten, questions });
        send({ step: "after", ms: Math.round(performance.now() - start), offensive: after.answers.offensive.noul });
      } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : "Unknown error";
        send({ step: "error", error: `AI call failed: ${message}` });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson" } });
}
