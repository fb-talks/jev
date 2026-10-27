# Jev and Gemini: one writes, the other checks

In the [first article](./jev-first-question.md) we asked **Jev** a single question: is this comment offensive? The answer was a number, `0.79`, ready for an `if`.

This time we add a second model. **Gemini** writes text, the thing LLMs are good at. **Jev** checks it, the thing Jev is good at: fast judgments that come back as numbers. In between there's your code, which reads the numbers and makes the decision.

The example comes from the project's demo `/2-jev-and-gemini/demo2`: a customer writes to support, Gemini drafts the reply, and Jev decides whether that reply can go out or whether it's rude, toxic or off topic.

This isn't a step by step guide. First the key ideas, then a complete example in a single file that you can run with Node.

---

## The idea: the writer and the controller

An LLM writing to your customers on its own is a risk. Most of the time the reply is fine. Sometimes it's cold, sometimes it misses the point, and once in a while it's plain wrong. You can't read every reply yourself, so you need a check that is automatic, fast and cheap.

Why not ask Gemini to check itself?

- **It's the same model.** Whatever led it to write a bad reply can lead it to approve that reply too.
- **It answers with text.** "The reply seems mostly appropriate, although…" is something you then have to parse and interpret.
- **It costs like a second generation.** You pay for output tokens and you wait for it.

Jev doesn't write anything: it answers typed questions with values and probabilities. As a controller it adds a few hundred milliseconds and very little cost, and what it returns fits straight into an `if`.

## Key point 1 · Give Jev the context

To judge whether a reply is *relevant*, Jev has to see the question too. The `state` contains both texts, labeled:

```ts
const state = `Customer's message: ${message}\n\nSupport reply: ${reply}`;
const { answers } = await jev.systemOne({ state, questions });
```

If you pass only the reply, "We'll refund you right away" can sound perfect even when the customer had asked how to change their password.

## Key point 2 · The questions are your quality rubric

Instead of a single yes/no, here we ask two questions with two different types:

```ts
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
```

- **`choice`** picks one option out of several, with a probability for each. Good for categories that exclude each other: relevant, generic, off topic.
- **`score`** places the answer on an ordered scale, from 0 to 3 here. Rude and toxic aren't separate categories: they're two levels of the same scale, so the score gives you a single number that says how bad the tone is.

The descriptions are the prompt. The clearer each option is, the cleaner the probabilities. Both questions go in **the same call**, and adding a third one barely changes the time.

## Key point 3 · The decision lives in your code

Jev measures. Deciding what to do with the measurement is up to you:

```ts
const ok = answers.relevance.choice === "relevant" && answers.tone.score < 1.5;
```

The rule is readable, versioned with your code, and you can change it without touching a prompt. Want to be stricter? Lower the threshold. Want to accept generic replies on weekends? It's an extra `if`.

## Key point 4 · Jev's verdict becomes Gemini's instructions

When a draft is rejected you don't have to give up: you can tell Gemini **why**, using exactly what Jev measured:

```ts
if (!ok) {
  reply = await writeReply(
    `A previous draft was rejected (relevance: ${relevance}, tone ${tone}/3). Be polite and address the actual problem.`,
  );
}
```

Then you check the new draft again. If that one fails too, the reply goes to a human. That gives you a loop with a clear exit: **send, retry once, escalate**.

## Key point 5 · One key, two models

With an AI gateway, Gemini and Jev go through the same account and the same key. In the example I use Vercel AI Gateway: the AI SDK reaches Gemini, and TypeSafe's SDK reaches Jev, with the same `API_KEY`.

One detail about the AI SDK. In the Next.js demo the model is just a string, `"google/gemini-3.8-flash"`: the SDK then uses the gateway on its own and reads the key from the `AI_GATEWAY_API_KEY` environment variable. In the example below there's no environment variable, so the gateway is created explicitly with `createGateway` and receives the key directly:

```ts
import { createGateway, generateText } from "ai";

const gateway = createGateway({ apiKey: API_KEY });
await generateText({ model: gateway("google/gemini-3.8-flash"), prompt: "…" });
```

That's how a single key pasted at the top of the file works for both models. As in the first article, nothing depends on that choice: with a TypeSafe key and a Gemini key, only the two clients change.

---

## Other ways to combine them

The writer + controller pattern has several variants. Some of them are already in the project's demos:

- **Gemini proposes, Jev picks** (`demo3`). Gemini writes three different replies, Jev gives each one a score, and the code keeps the best. Instead of fixing a bad draft, you choose among several.
- **Gemini rewrites, Jev confirms** (`demo1`). A rude comment gets rewritten politely, and Jev measures the "offensive" probability before and after. The number proves the rewrite actually worked.
- **Jev in front of Gemini, as a filter** (`demo4`). Jev classifies every incoming request in a few hundred milliseconds, and the LLM only gets called when it's needed: a full reply for the complex ones, a canned answer for the simple ones, a human for the urgent ones.
- **Jev as an evaluator for your prompts** (`demo6`). Change Gemini's prompt, generate a hundred replies on a set of test messages, and let Jev measure them. You know whether the new prompt is better from numbers, not from reading three examples.

The common thread: **the LLM produces, Jev measures, your code decides.**

---

## Full example to try

One file, no UI: a customer's message, a reply from Gemini, Jev's check and, if needed, a second attempt.

```sh
mkdir jev-gemini && cd jev-gemini
npm init -y
npm install @typesafe-ai/sdk ai
```

You need Node.js 22.18 or newer, which runs TypeScript files directly. Create the file `support.mts` and **paste your key** in place of `YOUR_API_KEY`:

```ts
import { choice, score, TypeSafeClient } from "@typesafe-ai/sdk";
import { createGateway, generateText } from "ai";

// 👇 Paste your Vercel AI Gateway key here
const API_KEY: string = "YOUR_API_KEY";

// One key, two models: Gemini through the gateway, Jev through the same gateway
const gateway = createGateway({ apiKey: API_KEY });
const jev = new TypeSafeClient({
  apiKey: API_KEY,
  baseURL: "https://ai-gateway.vercel.sh/typesafe",
  defaultModel: "typesafe-ai/jev",
});

// The rubric: what Jev checks on every reply
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

const message: string = "I was charged twice for my subscription this month and nobody has answered my emails.";
// The style of the first draft: try "rude and impatient" or "off topic"
const style: string = process.argv[2] ?? "helpful and empathetic";

// Gemini writes: the creative part
async function writeReply(instructions: string): Promise<string> {
  const { text } = await generateText({
    model: gateway("google/gemini-3.8-flash"),
    instructions: `You are a customer support agent of a software company. Reply in 1-3 sentences. Only the reply. ${instructions}`,
    prompt: message,
  });
  return text.trim();
}

// Jev checks: the controller, with numbers our code can use
async function check(reply: string) {
  const { answers } = await jev.systemOne({
    state: `Customer's message: ${message}\n\nSupport reply: ${reply}`,
    questions,
  });
  const ok = answers.relevance.choice === "relevant" && answers.tone.score < 1.5;
  return { ok, relevance: answers.relevance.choice, tone: answers.tone.score.toFixed(2) };
}

let reply = await writeReply(`Style: ${style}.`);
let verdict = await check(reply);
console.log(`Draft:  ${reply}\nJev:    ${JSON.stringify(verdict)}\n`);

// Rejected? One more try, telling Gemini what went wrong
if (!verdict.ok) {
  reply = await writeReply(
    `A previous draft was rejected (relevance: ${verdict.relevance}, tone ${verdict.tone}/3). Be polite and address the actual problem.`,
  );
  verdict = await check(reply);
  console.log(`Retry:  ${reply}\nJev:    ${JSON.stringify(verdict)}\n`);
}

console.log(verdict.ok ? "✅ Send the reply" : "🙋 Escalate to a human");
```

First run it as is: Gemini writes a polite reply, and Jev lets it through on the first try.

```sh
node support.mts
```

```
Draft:  I am so sorry for the delay and for the stress this duplicate charge has caused. Please share your account email or ticket number, and I will personally investigate right now to issue your refund immediately. We'll make sure this is resolved for you today.
Jev:    {"ok":true,"relevance":"relevant","tone":"0.00"}

✅ Send the reply
```

Now force a bad first draft by asking for a rude reply:

```sh
node support.mts "rude and impatient, blaming the customer"
```

```
Draft:  Maybe if you didn't click the checkout button multiple times like an impatient child, you wouldn't have been charged twice. Stop spamming our inbox with emails and wait your turn like everyone else.
Jev:    {"ok":false,"relevance":"generic","tone":"2.98"}

Retry:  I am truly sorry for the delayed response and for the frustration of being charged twice for your subscription. Please reply with the email address associated with your account, and I will personally review your billing history and issue a refund for the duplicate charge right away.
Jev:    {"ok":true,"relevance":"relevant","tone":"0.00"}

✅ Send the reply
```

And one that goes off topic:

```sh
node support.mts "off topic, talking about a new product launch"
```

```
Draft:  Thanks for reaching out, but I'm thrilled to announce that our revolutionary new productivity platform, NovaFlow, officially launches next Tuesday! …
Jev:    {"ok":false,"relevance":"off_topic","tone":"1.79"}

Retry:  I sincerely apologize for the delay in our response and for the duplicate charge on your account. Please share your account email or transaction details so I can immediately investigate and process a refund for the extra payment. …
Jev:    {"ok":true,"relevance":"relevant","tone":"0.00"}

✅ Send the reply
```

Jev catches both bad drafts, each for the right reason: the first for its tone (2.98 out of 3, nearly toxic), the second for its relevance (`off_topic`). After the retry, the reply that goes out is polite and on topic.

Values measured in October 2026. Gemini's text changes on every run, and Jev's numbers can move by a point or two.

With Vercel AI Gateway, a **403** usually means no paid credits yet. Before sharing the file, remove the key: in a real project it belongs in an environment variable.

From here, try changing the customer's message, adding a third question to the rubric (for example `noul("The reply promises something specific, like a refund or a date")`, adding `noul` to the import), or moving the threshold in `check`: same code, a stricter or looser controller.
