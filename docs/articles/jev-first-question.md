# Jev in 5 minutes: your first question

**Jev** is a model by [TypeSafe AI](https://typesafe.ai), the first of what they call "System One" models: fast, intuitive judgments instead of long reasoning. You give it some data and a few typed questions, and it answers each one with a **value and its probability**, not with text.

Why not just use an LLM?

- **Numbers, not prose.** An LLM writes text for people; your code then has to parse it. Jev returns typed values your code can use directly.
- **Fast and cheap.** Answers come back in a few hundred milliseconds, you pay only for input, and adding questions to the same call barely changes the time.
- **Honest uncertainty.** You get a probability for every answer, so you can tell a confident "yes" from a coin toss, and decide when to ask a human.

Where it fits: small, high-volume decisions. Moderating comments, routing support tickets, tagging content, checking a form, scoring leads. It doesn't replace an LLM: it works next to one.

There are already plenty of articles about what Jev is and how it works. This one is short and practical: one example in **TypeScript**, step by step, to see what it can do.

---

A comment lands on your blog: "Who taught you to code? Useless post." Is it offensive?

An LLM would answer with a paragraph. **Jev** answers with a number: `0.79`, offensive at 79%. A number your code can use right away, in an `if`.

In this article we walk through the first demo of the project (`/1-jev/demo1`): a page with a text field, an **Analyze** button and a percentage. At the end you'll find a complete example, with no UI, that you can try in a minute by changing only the API key.

## Step 1 · The key

Jev is called through an API. You can reach it in two ways, and the code is the same SDK either way:

- **straight from TypeSafe**, with a key from [console.typesafe.ai](https://console.typesafe.ai);
- **through an AI gateway**: a service that sits between your app and the model providers, with one account and one bill for many models.

In this article I use **Vercel AI Gateway**, but it's just my choice: nothing here depends on it. Any gateway that exposes Jev works the same way, and so does TypeSafe's own API. The only thing that changes is how you create the client:

```ts
// Vercel AI Gateway (what I use in this article)
const jev = new TypeSafeClient({
  apiKey: "YOUR_GATEWAY_KEY",
  baseURL: "https://ai-gateway.vercel.sh/typesafe",
  defaultModel: "typesafe-ai/jev",
});

// TypeSafe directly: no baseURL, no model, the SDK defaults point to TypeSafe
const jev = new TypeSafeClient({ apiKey: "YOUR_TYPESAFE_KEY" });

// Another gateway: its own base URL and model name, from its docs
const jev = new TypeSafeClient({ apiKey: "…", baseURL: "…", defaultModel: "…" });
```

If you follow along with Vercel:

1. On Vercel, open **AI Gateway → API Keys** and create a key.
2. Top up some paid credits. With the free credit alone, Jev answers **403**. You need very little: Jev costs about 4 cents per million input tokens, and output is free.

## Step 2 · The SDK

You need Node.js 22.18 or newer: it runs TypeScript files directly, with no build step.

```sh
npm install @typesafe-ai/sdk
```

## Step 3 · The question

With Jev you don't write a prompt: you write **typed questions**. For a yes/no you use `noul`, written as a **statement** that can be true or false:

```ts
import { noul } from "@typesafe-ai/sdk";

const questions = {
  offensive: noul("The comment is offensive or insulting"),
};
```

A `noul` answer is a single number from 0 to 1: the probability that the statement is true. 0 means "surely not", 1 "surely yes", 0.5 "can't tell".

## Step 4 · The call

Create the client and call `systemOne` with two things: the **state**, the data to evaluate (here, the comment), and the **questions**.

```ts
import { TypeSafeClient } from "@typesafe-ai/sdk";

const jev = new TypeSafeClient({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: "https://ai-gateway.vercel.sh/typesafe",
  defaultModel: "typesafe-ai/jev",
});

const { answers } = await jev.systemOne({ state: text, questions });

answers.offensive.noul; // 0.79
```

No text to read, no JSON to parse: `answers` already has the shape of your questions, and in TypeScript the right types too.

## Step 5 · In the demo: the key stays on the server

In the Next.js demo the call to Jev lives in a **route handler** (`app/1-jev/demo1/api/route.ts`), not in the page. That way the key never reaches the browser.

```ts
export async function POST(request: Request) {
  const { text } = await request.json();

  if (typeof text !== "string" || !text.trim()) {
    return Response.json({ error: "Write a comment to analyze." }, { status: 400 });
  }

  try {
    // created here: the constructor throws when the key is missing
    const jev = new TypeSafeClient({ /* as above */ });

    const { answers } = await jev.systemOne({ state: text, questions });
    return Response.json({ offensive: answers.offensive.noul });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: `AI call failed: ${message}` }, { status: 502 });
  }
}
```

Three details:

- the input is checked before calling the model: an empty comment doesn't cost a call;
- the client is created **inside** the `try`: if the key is missing, the error comes back as a 502 response instead of crashing the server;
- the response is just the number: the page needs nothing else.

The page (`app/1-jev/demo1/page.tsx`) does a `fetch` to this route and shows `Math.round(offensive * 100)`, that is "Offensive: 79%".

## Step 6 · What to do with the number

The number isn't a decision: you make the decision, in your code.

```ts
if (answers.offensive.noul > 0.8) hideComment();
```

And you pick the threshold depending on how strict you want to be. In the next demos of the project the same number becomes a three-band policy: publish, send to review, reject.

## Full example to try

One file, no UI. Create a folder and install the SDK:

```sh
mkdir jev-hello && cd jev-hello
npm init -y
npm install @typesafe-ai/sdk
```

Create the file `jev.mts` and **paste your key** in place of `YOUR_API_KEY`:

```ts
import { noul, TypeSafeClient } from "@typesafe-ai/sdk";

// 👇 Paste your key here
const API_KEY: string = "YOUR_API_KEY";

const jev = new TypeSafeClient({
  apiKey: API_KEY,
  // Vercel AI Gateway. With a TypeSafe key, delete these two lines;
  // with another gateway, use its base URL and model name.
  baseURL: "https://ai-gateway.vercel.sh/typesafe",
  defaultModel: "typesafe-ai/jev",
});

// The comment to analyze: the one written after `node jev.mts`, or this one
const comment: string = process.argv[2] ?? "Who taught you to code? Useless post.";

const { answers } = await jev.systemOne({
  state: comment,
  questions: {
    offensive: noul("The comment is offensive or insulting"),
  },
});

// typed by the SDK: `offensive` exists because we asked it, and `noul` is a number
const percent: number = Math.round(answers.offensive.noul * 100);
console.log(`"${comment}"`);
console.log(`Offensive: ${percent}%`);
```

Run it, first with a friendly comment:

```sh
node jev.mts "Great article, thanks!"
```

```
"Great article, thanks!"
Offensive: 1%
```

Then with an offensive one:

```sh
node jev.mts "Who taught you to code? Useless post."
```

```
"Who taught you to code? Useless post."
Offensive: 79%
```

Same code, same question: only the comment changes, and the number follows it.

Values measured in October 2026: they can move by a point or two from one call to the next.

With Vercel AI Gateway, a **403** usually means no paid credits yet. Before sharing the file, remove the key: in a real project it belongs in an environment variable, as in the demo.

From here, try changing the statement inside `noul(...)`: "The comment asks a question", "The comment is about JavaScript". Same code, a different question.
