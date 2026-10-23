"use client";

import { useState } from "react";

export default function Demo1() {
  const [topic, setTopic] = useState("an angry reader who thinks the post is useless");
  const [comment, setComment] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers | null>(null);
  const [questions, setQuestions] = useState<Record<keyof Answers, Question> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    const res = await fetch("/2-jev-and-gemini/demo1/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
    });
    const data = await res.json();
    setLoading(false);
    setError(data.error ?? null);
    setComment(data.comment ?? null);
    setAnswers(data.answers ?? null);
    setQuestions(data.questions ?? null);
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-10">
      <h1 className="text-2xl font-semibold">Demo 1 · Gemini writes, Jev moderates</h1>

      <input
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        className="rounded-xl border border-zinc-300 bg-transparent p-3 dark:border-zinc-700"
      />

      <button onClick={generate} disabled={loading} className="self-start rounded-full bg-indigo-600 px-5 py-2 text-white disabled:opacity-50">
        {loading ? "Generating…" : "Generate comment"}
      </button>

      {error && <p className="text-rose-600">{error}</p>}
      {comment && <blockquote className="border-l-4 border-indigo-500 pl-3 italic">{comment}</blockquote>}
      {answers && questions && (
        <>
          <Card title="Category" subtitle={`choice: ${answers.category.choice}`} question={questions.category.instructions}>
            {Object.entries(answers.category.probabilities).map(([k, v]) => (
              <Bar
                key={k}
                label={k}
                value={v}
                highlight={k === answers.category.choice}
                hint={(questions.category.criteria as Record<string, string>)[k]}
              />
            ))}
          </Card>
          <Card title="Toxicity" subtitle={`score: ${answers.toxicity.score.toFixed(2)} / 3`} question={questions.toxicity.instructions}>
            {Object.entries(answers.toxicity.probabilities).map(([k, v]) => (
              <Bar key={k} label={answers.toxicity.legend[k] ?? k} value={v} />
            ))}
          </Card>
        </>
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
