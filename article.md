---
title: "Comment moderation with Jev, Next.js and Vercel AI Gateway"
subtitle: "From the Vercel setup to your first moderated comment, step by step"
date: 2026-10-23
author: Fabio Biondi
---

# Comment moderation with Jev, Next.js and Vercel AI Gateway

_From the Vercel setup to your first moderated comment, step by step_

In this tutorial we will build a small **comment moderation** app for a tech blog using **Jev**, the model by TypeSafe AI, called through **Vercel AI Gateway** from a **Next.js** route handler.

The goal of the article is to show you a different way of using an AI model: instead of asking it to _write_ something, we ask it **structured questions** about a text and we get back **probabilities**, not prose. For example:

- Is this comment spam, off topic or relevant?
- How toxic is its tone, on a scale from 0 to 3?
- Does it contain personal data?

Then **our code**, not the model, decides whether to publish, review or reject the comment.

![TODO screenshot: the final demo with a moderated comment and the "Publish / Needs review / Reject" badge](./images/00-final-demo.png)

> 📄 **Prerequisites**
>
> - Node.js 22 or newer (required by the TypeSafe SDK)
> - A [Vercel](https://vercel.com) account
> - Basic knowledge of React and Next.js

## Why Jev?

Most LLMs answer with text. If you ask _"Is this comment toxic?"_ you get a sentence back, and then you have to parse it, hope it's consistent, and guess how confident the model really is.

Jev works differently. You describe **questions** with typed helpers, and every answer comes back as a typed object with **probabilities**:

- **`choice`**: pick one option from a list (e.g. `relevant`, `spam`, `off_topic`) and get the probability of each one.
- **`score`**: rate something on a scale you define (e.g. from "Polite" to "Insults"), with the probability of each level.
- **`noul`**: a yes/no question that returns the probability of _yes_.

This is perfect for moderation: the model measures, and we keep full control of the policy.

## 1. Set up Vercel AI Gateway

Vercel AI Gateway gives us a single endpoint and a single API key to call many models, Jev included, with usage and billing in one place.

Log in to the [Vercel Dashboard](https://vercel.com/dashboard), select your team and open the **AI Gateway** tab in the sidebar:

![TODO screenshot: Vercel dashboard sidebar with the AI Gateway tab highlighted](./images/01-ai-gateway-tab.png)

Go to **API Keys** and click **Create key**:

![TODO screenshot: the API Keys page with the "Create key" button](./images/02-create-key.png)

Give the key a name (for example `jev-demo`) and copy it. **You will see it only once**, so save it somewhere safe:

![TODO screenshot: the new key created, with the copy button](./images/03-copy-key.png)

> ⚠️ **Free credits are not enough for Jev**
>
> Vercel gives every account some free monthly credit for AI Gateway, but not every model is available on the free tier. If you call Jev with free credits only, you'll get this error:
>
> ```
> 403 Free tier users do not have access to this model.
> Upgrade to paid credits for unrestricted access.
> ```
>
> To fix it, open **AI Gateway → Credits** and top up some paid credits. A small amount is plenty for this demo.

![TODO screenshot: the AI Gateway credits page with the "Top up" button](./images/04-top-up-credits.png)

## 2. Create the Next.js project

Create a new Next.js app:

```bash
npx create-next-app@latest demo-next-jev
```

I used the defaults: **TypeScript**, **ESLint**, **Tailwind CSS** and the **App Router**.

![TODO screenshot: terminal with the create-next-app questions](./images/05-create-next-app.png)

Navigate into the directory:

```bash
cd demo-next-jev
```

and install the official TypeSafe SDK:

```bash
npm install @typesafe-ai/sdk
```

## 3. Store the API key

Create a `.env.local` file in the project root and paste the key you created on Vercel:

```bash
# .env.local
AI_GATEWAY_API_KEY=your_key_here
```

> 📄 **Never commit your key**
>
> The default Next.js `.gitignore` already ignores `.env*` files. I also like to commit a `.env.local.example` file with an empty value, so anyone cloning the repo knows which variable to set:
>
> ```bash
> # Vercel AI Gateway key
> # Vercel Dashboard → AI Gateway → API Keys → Create key
> AI_GATEWAY_API_KEY=
> ```
>
> To commit it, add `!.env.local.example` to `.gitignore`, right after the `.env*` line.

> 💡 **Deploying on Vercel?**
>
> When the app runs on Vercel you don't even need the key: Vercel automatically injects an OIDC token (`VERCEL_OIDC_TOKEN`) that the Gateway accepts. Locally you can get the same token with `vercel link` followed by `vercel env pull`.

## 4. Define the questions

Now the interesting part: **what do we ask Jev?**

We'll keep the whole example in a single file: the API route. Create the `app/api/moderate/route.ts` file and start with the questions:

```ts
// app/api/moderate/route.ts
import { choice, noul, score } from "@typesafe-ai/sdk";

/**
 * The questions we ask Jev about every comment.
 * The criteria descriptions are our "prompt": the clearer they are, the better the probabilities.
 */
const questions = {
  category: choice("What kind of comment is this, relative to a post on a tech blog?", {
    relevant: "Comment, opinion or question about the post's content",
    spam: "Advertising, promotional links or unsolicited messages",
    off_topic: "Has nothing to do with the post",
  }),
  toxicity: score("How offensive is the tone of the comment?", [
    "Polite or neutral",
    "Critical but respectful",
    "Combative or sarcastic toward people",
    "Insults, hate or personal attacks",
  ]),
  personal_data: noul(
    "The comment contains personal data such as an email address, phone number or home address",
  ),
};
```

Let's look at the three questions:

- **`category`** uses `choice`: each key (`relevant`, `spam`, `off_topic`) is a possible answer, and its description explains to the model what that answer means.
- **`toxicity`** uses `score`: the array is an ordered scale, so the first item is `0` and the last one is `3`.
- **`personal_data`** uses `noul`: a simple yes/no question.

> 📄 **The descriptions are your prompt**
>
> There is no system prompt here. The quality of the answers depends on how clearly you describe each question and each option. If a result looks wrong, start by rewriting the description.

## 5. Create the API route

We call Jev from the server, so the API key is never exposed to the browser.

In the same file, below the questions, add the call to Jev. Here is the complete file:

```ts
// app/api/moderate/route.ts
import { choice, noul, score, TypeSafeClient } from "@typesafe-ai/sdk";

/**
 * The questions we ask Jev about every comment.
 * The criteria descriptions are our "prompt": the clearer they are, the better the probabilities.
 */
const questions = {
  category: choice("What kind of comment is this, relative to a post on a tech blog?", {
    relevant: "Comment, opinion or question about the post's content",
    spam: "Advertising, promotional links or unsolicited messages",
    off_topic: "Has nothing to do with the post",
  }),
  toxicity: score("How offensive is the tone of the comment?", [
    "Polite or neutral",
    "Critical but respectful",
    "Combative or sarcastic toward people",
    "Insults, hate or personal attacks",
  ]),
  personal_data: noul(
    "The comment contains personal data such as an email address, phone number or home address",
  ),
};

const GATEWAY_URL = "https://ai-gateway.vercel.sh/typesafe";
const MODEL = "typesafe-ai/jev";

let client: TypeSafeClient | undefined;

export async function POST(request: Request) {
  const { text } = await request.json();

  if (typeof text !== "string" || !text.trim()) {
    return Response.json({ error: "Write a comment to analyze." }, { status: 400 });
  }

  const apiKey = process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_OIDC_TOKEN;
  if (!apiKey) {
    return Response.json(
      { error: "Missing AI_GATEWAY_API_KEY: add it to .env.local and restart `npm run dev`." },
      { status: 500 },
    );
  }

  try {
    client ??= new TypeSafeClient({ apiKey, baseURL: GATEWAY_URL, defaultModel: MODEL });
    const start = performance.now();
    const result = await client.systemOne({ state: text, questions });
    const ms = Math.round(performance.now() - start);

    return Response.json({
      model: result.model,
      usage: result.usage,
      ms,
      answers: result.answers,
    });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: `Jev call failed: ${message}` }, { status: 502 });
  }
}
```

Here is what happens:

- **`GATEWAY_URL`**: instead of calling TypeSafe directly, we point the SDK to the Vercel AI Gateway endpoint for TypeSafe.
- **`MODEL`**: the model ID on the Gateway, `typesafe-ai/jev`.
- **`apiKey`**: the Gateway key from `.env.local`, or the OIDC token when the app runs on Vercel.
- **`client ??=`**: the client is created on the first request, not when the module loads. This way `npm run build` doesn't fail if the key isn't set yet.
- **`client.systemOne(...)`**: the actual call. `state` is the text we want to analyze, `questions` are the questions defined at the top of the file.
- **`result.answers`**: one typed answer for each question, with the same keys (`category`, `toxicity`, `personal_data`).

## 6. Hello world: our first moderated comment

Start the dev server:

```bash
npm run dev
```

Before writing any UI, let's test the route from the terminal:

```bash
curl -X POST http://localhost:3000/api/moderate \
  -H "Content-Type: application/json" \
  -d '{"text": "Make $5,000/week from home!!! No experience needed. DM me now"}'
```

You should get something like this (I shortened the output):

```json
{
  "model": "typesafe-ai/jev",
  "ms": 412,
  "answers": {
    "category": {
      "choice": "spam",
      "confidence": 0.97,
      "probabilities": { "relevant": 0.01, "spam": 0.97, "off_topic": 0.02 }
    },
    "toxicity": { "score": 0.4, "confidence": 0.81, "probabilities": { "...": "..." } },
    "personal_data": { "noul": 0.03 }
  }
}
```

<!-- TODO: replace the JSON above with the real response from your run -->

![TODO screenshot: terminal with the real curl response](./images/06-curl-response.png)

That's our hello world: Jev recognized the spam, and every answer comes with its probabilities.

> 📄 **Got a 403?**
>
> If the response is `Jev call failed: 403 Free tier users do not have access to this model`, go back to step 1 and top up some paid credits on AI Gateway.

## 7. A minimal UI

Now let's call the same route from a page. Replace the content of `app/page.tsx`:

```tsx
// app/page.tsx
"use client";

import { useState } from "react";

export default function Home() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  async function analyze() {
    setLoading(true);
    const res = await fetch("/api/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    setResult(await res.json());
    setLoading(false);
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-10">
      <h1 className="text-2xl font-semibold">Comment moderation with Jev</h1>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        className="rounded-xl border border-zinc-300 p-3"
        placeholder="Write a comment…"
      />

      <button
        onClick={analyze}
        disabled={loading || !text.trim()}
        className="self-start rounded-full bg-indigo-600 px-5 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Analyzing…" : "Analyze comment"}
      </button>

      {result !== null && (
        <pre className="overflow-x-auto rounded-xl bg-zinc-100 p-3 text-xs">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </main>
  );
}
```

Open [http://localhost:3000](http://localhost:3000), write a comment and click **Analyze comment**:

![TODO screenshot: the minimal UI with a comment and the raw JSON response](./images/07-minimal-ui.png)

Try a few different comments to see how the probabilities change:

- `Clear explanation of React Server Components. Have you measured how they affect bundle size in a large app?`
- `Your code is wrong and so are you. Delete this blog before you embarrass yourself further.`
- `I had the same bug at work, feel free to reach out on LinkedIn, I'm the only Marco Bianchi at Acme Corp in Milan.`

The last one is interesting: there is no email or phone number, but a name, a company and a city are enough to identify a person. Let's see what `personal_data` says.

![TODO screenshot: the response for the "Marco Bianchi" comment](./images/08-personal-data.png)

## What's next?

Jev gives us probabilities. In the next article we'll use them to build the **moderation policy** in our own code: we'll turn the answers into risk signals, compare them with two thresholds (_review_ and _reject_) and add sliders to change those thresholds in real time, **without calling the model again**.

![TODO screenshot: the full demo with risk signals and threshold sliders](./images/09-next-step.png)

This approach is what makes Jev interesting for real apps: the model measures, and the decision stays in your code, where you can test it, version it and change it whenever you want.

## Resources

- [TypeSafe AI](https://typesafe.ai)
- [`@typesafe-ai/sdk` on npm](https://www.npmjs.com/package/@typesafe-ai/sdk)
- [Vercel AI Gateway](https://vercel.com/docs/ai-gateway)
- [Next.js Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route)
