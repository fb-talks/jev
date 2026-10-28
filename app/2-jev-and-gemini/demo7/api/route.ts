import { choice } from "@typesafe-ai/sdk";
import { generateText } from "ai";
import { apiKeys, geminiModel, jevClient } from "@/lib/keys";

// The descriptions are our "prompt": the clearer they are, the better the probabilities.
const questions = {
  intent: choice("What does the customer need from this support message?", {
    greeting: "Only a greeting, thanks or small talk: no request and no problem",
    order_status: "Only asks where an order is or when it will arrive, with no other problem",
    password_reset: "Only asks how to reset or recover the password; not a problem with the reset itself, like an email that never arrives",
    complex: "Anything else: a problem, a complaint, several issues, or a question that needs a real answer",
  }),
};

// The simple intents get a ready answer: no Gemini, no tokens.
const templates: Record<string, (message: string) => string> = {
  greeting: () => "Thanks for your message! 😊 If you need anything else, just write to us.",
  order_status: (message) => {
    const order = message.match(/#?(\d{4,})/)?.[1];
    return `You can follow ${order ? `order #${order}` : "your order"} in your account, under Orders → Track: updates appear there in real time.`;
  },
  password_reset: () => "You can reset your password from the login page: click “Forgot password?” and follow the link we email you.",
};

// Demo 7: the same support message, handled in two ways.
// "gemini": Gemini answers every message. "router": Jev classifies it first, and only the
// complex or uncertain ones reach Gemini; the simple ones get a template right away.
export async function POST(request: Request) {
  const { message, mode, threshold } = await request.json();
  const keys = await apiKeys();

  if (typeof message !== "string" || !message.trim() || (mode !== "gemini" && mode !== "router") || typeof threshold !== "number") {
    return Response.json({ error: "Write a support message." }, { status: 400 });
  }

  try {
    const start = performance.now();
    let jev = null;

    if (mode === "router") {
      // Jev with the key from the 🔑 panel, or the server one (see lib/keys.ts)
      const client = jevClient(keys);
      const { answers } = await client.systemOne({ state: message, questions });
      const { choice: intent, probabilities } = answers.intent;
      jev = { intent, probability: probabilities[intent], ms: Math.round(performance.now() - start) };

      // the decision is ours, in code: a simple intent, and Jev sure enough about it
      if (intent in templates && jev.probability >= threshold) {
        const reply = templates[intent](message);
        return Response.json({ route: "template", reply, jev, gemini: null, ms: Math.round(performance.now() - start) });
      }
    }

    // Gemini through Vercel AI Gateway, with the same key choice (see lib/keys.ts)
    const geminiStart = performance.now();
    const { text, usage } = await generateText({
      model: geminiModel(keys),
      instructions:
        "You are a customer support agent of a software company. Reply to the customer's message in 1-3 sentences. Only the reply, no quotes, no signature.",
      prompt: message,
    });
    const gemini = { ms: Math.round(performance.now() - geminiStart), tokens: usage.totalTokens ?? 0 };

    return Response.json({ route: "gemini", reply: text.trim(), jev, gemini, ms: Math.round(performance.now() - start) });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: `AI call failed: ${message}` }, { status: 502 });
  }
}
