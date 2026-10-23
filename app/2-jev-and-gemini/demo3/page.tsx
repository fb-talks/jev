"use client";

import { useState } from "react";

export default function Demo3() {
  const [text, setText] = useState("I followed the tutorial but the build fails. Any idea?");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function propose() {
    setLoading(true);
    const res = await fetch("/2-jev-and-gemini/demo3/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    setLoading(false);
    setError(data.error ?? null);
    setResult(data.error ? null : data);
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-10">
      <h1 className="text-2xl font-semibold">Demo 3 · Gemini proposes, Jev picks</h1>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="rounded-xl border border-zinc-300 bg-transparent p-3 dark:border-zinc-700"
      />

      <button onClick={propose} disabled={loading} className="self-start rounded-full bg-indigo-600 px-5 py-2 text-white disabled:opacity-50">
        {loading ? "Thinking…" : "Propose 3 replies"}
      </button>

      {error && <p className="text-rose-600">{error}</p>}
      {result?.replies.map((r, i) => {
        const best = r.text === result.best;
        return (
          <Card key={i} title={`Reply ${i + 1}`} subtitle={best ? "★ best" : undefined} question={result.question}>
            <p>{r.text}</p>
            <Bar label="Helpful & polite" value={r.score} highlight={best} />
          </Card>
        );
      })}
    </main>
  );
}

// ---------- Types ----------

interface Result {
  question: string;
  replies: { text: string; score: number }[];
  best: string;
}

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
