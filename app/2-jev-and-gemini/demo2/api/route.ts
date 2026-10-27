import { choice, score, TypeSafeClient } from "@typesafe-ai/sdk";
import { generateText } from "ai";

// The descriptions are our "prompt": the clearer they are, the better the probabilities.
const questions = {
  relevance: choice("Relative to the customer's message, what does the support reply do?", {
    relevant: "Addresses the customer's actual problem or question",
    generic: "Vague or boilerplate: replies without really addressing the problem",
    off_topic: "Talks about something unrelated to the customer's request",
  }),
  tone: score("How does the support agent treat the customer?", [
    "Polite and empathetic",
    "Neutral or a bit cold",
    "Rude, dismissive or condescending",
    "Toxic: insults or personal attacks",
  ]),
};

// Demo 2: Gemini plays the support agent, Jev evaluates the reply.
// The response is a stream of JSON lines, one per step, so the page shows each step (and its speed) as it ends.
export async function POST(request: Request) {
  const { message, style } = await request.json();

  if (typeof message !== "string" || !message.trim() || typeof style !== "string" || !style.trim()) {
    return Response.json({ error: "Write the customer's message and the style of the reply." }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: object) => controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));

      try {
        // Gemini goes through the same Vercel AI Gateway: with a "provider/model" string
        // the AI SDK uses the Gateway on its own and reads the same credential.
        let start = performance.now();
        const { text } = await generateText({
          model: "google/gemini-3.8-flash",
          instructions:
            "You are a customer support agent of a software company. Reply to the customer's message in 1-3 sentences. Only the reply, no quotes, no signature.",
          prompt: `Customer's message: ${message}\n\nReply with this style: ${style}`,
        });
        const reply = text.trim();
        send({ step: "gemini", ms: Math.round(performance.now() - start), reply });

        // Jev through Vercel AI Gateway, with TypeSafe's official SDK. The key stays on the server:
        // AI_GATEWAY_API_KEY locally, the OIDC token on Vercel. Created here because the
        // constructor throws when the key is missing.
        const jev = new TypeSafeClient({
          apiKey: process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_OIDC_TOKEN,
          baseURL: "https://ai-gateway.vercel.sh/typesafe",
          defaultModel: "typesafe-ai/jev",
        });

        // Jev sees both texts: relevance only makes sense against the customer's message
        const state = `Customer's message: ${message}\n\nSupport reply: ${reply}`;
        start = performance.now();
        const { answers } = await jev.systemOne({ state, questions });

        // the questions go back too, so the page shows the exact text Jev received
        send({ step: "jev", ms: Math.round(performance.now() - start), questions, answers });
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
