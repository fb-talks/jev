import { score, TypeSafeClient } from "@typesafe-ai/sdk";
import { generateText, jsonSchema, Output } from "ai";

const questions = {
  quality: score("How helpful and polite is this reply from the post's author?", [
    "Rude or dismissive",
    "Polite but unhelpful",
    "Polite and somewhat helpful",
    "Polite, clear and really helpful",
  ]),
};

// Gemini returns the 3 replies as data, one per style: no parsing of free text, always exactly three.
const styles = ["curt", "friendly", "detailed"] as const;
const repliesSchema = jsonSchema<Record<(typeof styles)[number], string>>({
  type: "object",
  properties: Object.fromEntries(styles.map((s) => [s, { type: "string" }])),
  required: [...styles],
  additionalProperties: false,
});

// Demo 3: Gemini proposes 3 replies, Jev scores them, our code picks the best one.
// The response is a stream of JSON lines, one per step, so the page shows each step (and its speed) as it ends.
export async function POST(request: Request) {
  const { text } = await request.json();

  if (typeof text !== "string" || !text.trim()) {
    return Response.json({ error: "Write a comment to reply to." }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: object) => controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));

      try {
        // Gemini goes through the same Vercel AI Gateway: with a "provider/model" string
        // the AI SDK uses the Gateway on its own and reads the same credential.
        let start = performance.now();
        const { output } = await generateText({
          model: "google/gemini-3.8-flash",
          instructions: "You are the author of a tech blog post. Write 3 very different replies to the reader's comment: one curt, one friendly, one detailed.",
          prompt: text,
          output: Output.object({ schema: repliesSchema }),
        });
        const replies = styles.map((style) => ({ style, text: output[style].trim() }));
        send({ step: "gemini", ms: Math.round(performance.now() - start), replies });

        // Jev through Vercel AI Gateway, with TypeSafe's official SDK. The key stays on the server:
        // AI_GATEWAY_API_KEY locally, the OIDC token on Vercel. Created here because the
        // constructor throws when the key is missing.
        const jev = new TypeSafeClient({
          apiKey: process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_OIDC_TOKEN,
          baseURL: "https://ai-gateway.vercel.sh/typesafe",
          defaultModel: "typesafe-ai/jev",
        });

        // the 3 Jev calls run in parallel: the time is the slowest of the three, not the sum
        start = performance.now();
        const results = await Promise.all(
          replies.map((reply) => jev.systemOne({ state: `Comment: ${text}\nReply: ${reply.text}`, questions })),
        );

        // the score goes from 0 to 3: normalize it to 0..1
        const scores = results.map((r) => r.answers.quality.score / 3);
        // our code picks: the index of the highest score
        const best = scores.indexOf(Math.max(...scores));

        // the question goes back too, so the page shows the exact text Jev received
        send({ step: "jev", ms: Math.round(performance.now() - start), question: questions.quality.instructions, scores, best });
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
