"use client";

import { useState } from "react";

export default function Demo2() {
  const [text, setText] = useState(examples[0]);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function analyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/1-jev/demo2/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      console.log(data)
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold">Demo 2 · Choice, score and noul</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          One question of each type: category (choice), toxicity (score) and &ldquo;does it ask the author something?&rdquo; (noul).
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {examples.map((e, i) => (
          <button
            key={i}
            onClick={() => setText(e)}
            className="rounded-full border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Example {i + 1}
          </button>
        ))}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        className="w-full rounded-xl border border-zinc-300 bg-transparent p-3 dark:border-zinc-700"
        placeholder="Write a comment…"
      />

      <button
        onClick={analyze}
        disabled={loading || !text.trim()}
        className="self-start rounded-full bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {loading ? "Analyzing…" : "Analyze comment"}
      </button>

      {error && (
        <p className="rounded-xl bg-rose-100 p-3 text-sm text-rose-900 dark:bg-rose-900/40 dark:text-rose-200">{error}</p>
      )}

      {result && (
        <div className="grid gap-4">
          <Card title="Category" subtitle={`choice: ${result.answers.category.choice}`} question={result.questions.category.instructions}>
            {Object.entries(result.answers.category.probabilities).map(([k, v]) => (
              <Bar
                key={k}
                label={k}
                value={v}
                highlight={k === result.answers.category.choice}
                hint={(result.questions.category.criteria as Record<string, string>)[k]}
              />
            ))}
          </Card>

          <Card title="Toxicity" subtitle={`score: ${result.answers.toxicity.score.toFixed(2)} / 3`} question={result.questions.toxicity.instructions}>
            {Object.entries(result.answers.toxicity.probabilities).map(([k, v]) => (
              <Bar key={k} label={result.answers.toxicity.legend[k] ?? k} value={v} />
            ))}
          </Card>

          {/* noul: a single number, the probability of "yes" */}
          <Card title="Asks the author a question" subtitle={`noul: ${result.answers.asks_author.noul.toFixed(2)}`} question={result.questions.asks_author.instructions}>
            <Bar label="yes" value={result.answers.asks_author.noul} highlight={result.answers.asks_author.noul > 0.5} />
          </Card>
        </div>
      )}
    </main>
  );
}

// ---------- Types ----------

// The questions as the SDK builds them: the text we wrote, and the options or levels.
interface Question {
  type: "noul" | "choice" | "score";
  instructions: string;
  criteria?: Record<string, string> | string[];
}

// The shape of the answers returned by the API route.
interface Answers {
  category: { choice: string; confidence: number; probabilities: Record<string, number> };
  toxicity: { score: number; confidence: number; probabilities: Record<string, number>; legend: Record<string, string> };
  asks_author: { noul: number };
}

interface ApiResult {
  questions: Record<keyof Answers, Question>;
  answers: Answers;
}

// ---------- Constants ----------

const examples = [
  "Clear explanation of React Server Components. Have you measured how they affect bundle size in a large app?",
  "💰 Make $5,000/week from home!!! No experience needed. DM me now 💰",
  "Your code is wrong and so are you. Delete this blog before you embarrass yourself further.",
  "What's the best pizza place near the conference venue? Asking for the meetup tonight.",
];

// ---------- UI ----------

// Small presentational pieces, repeated in every demo page so each file reads on its own.
function Bar({ label, value, highlight, hint }: { label: string; value: number; highlight?: boolean; hint?: string }) {
  return (
    <div className="text-sm">
      <div className="flex items-center gap-3">
        <span className={`w-48 shrink-0 truncate ${highlight ? "font-semibold" : ""}`} title={label}>
          {label}
        </span>
        <div className="h-2 flex-1 rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className={`h-2 rounded-full ${highlight ? "bg-indigo-500" : "bg-zinc-400 dark:bg-zinc-600"}`}
            style={{ width: `${Math.round(value * 100)}%` }}
          />
        </div>
        <span className="w-12 text-right tabular-nums">{Math.round(value * 100)}%</span>
      </div>
      {hint && <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

function Card({ title, subtitle, question, children }: { title: string; subtitle?: string; question?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="font-semibold">{title}</h3>
        {subtitle && <span className="text-xs text-zinc-500">{subtitle}</span>}
      </div>
      {/* the question text we sent to Jev, as written in the API route */}
      {question && <p className="-mt-2 mb-3 text-sm italic text-zinc-500">&ldquo;{question}&rdquo;</p>}
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}
