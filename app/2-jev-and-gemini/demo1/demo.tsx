"use client";

import { useState } from "react";
import { FlowDiagram } from "../_components/flow";

// The interactive part of the demo; the code panel comes from the server, already highlighted.
export default function Demo1({ code }: { code: React.ReactNode }) {
  const [text, setText] = useState("Who taught you to code? Useless post.");
  const [before, setBefore] = useState<BeforeStep | null>(null);
  const [gemini, setGemini] = useState<GeminiStep | null>(null);
  const [after, setAfter] = useState<AfterStep | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // which step we are waiting for, to show where the request is
  const waitingFor = !loading ? null : !before ? "Jev is measuring the comment…" : !gemini ? "Gemini is rewriting…" : "Jev is measuring the rewrite…";

  async function rewrite() {
    setLoading(true);
    setBefore(null);
    setGemini(null);
    setAfter(null);
    setError(null);
    const res = await fetch("/2-jev-and-gemini/demo1/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!res.ok || !res.body) {
      const data = await res.json();
      setError(data.error ?? "Request failed");
      setLoading(false);
      return;
    }

    // one JSON line per step: Jev, then Gemini, then Jev again
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines.filter(Boolean)) {
        const event: Step = JSON.parse(line);
        if (event.step === "before") setBefore(event);
        if (event.step === "gemini") setGemini(event);
        if (event.step === "after") setAfter(event);
        if (event.step === "error") setError(event.error);
      }
    }
    setLoading(false);
  }

  return (
    // talk layout, one column: what it does, how it works (diagram, then code), the live demo
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold">Demo 1 · Gemini rewrites, Jev confirms</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          A rude comment goes in. Jev measures how offensive it is, Gemini rewrites it politely, and Jev measures it again: the drop in probability
          proves the rewrite worked.
        </p>
      </header>

      <section className="flex flex-col gap-4">

        <FlowDiagram
          lanes={[
            {
              columns: [
                [{ label: "Comment" }],
                [{ label: "Jev measures", note: "P(offensive) before", kind: "jev" }],
                [{ label: "Gemini rewrites", note: "polite, same meaning", kind: "gemini" }],
                [{ label: "Jev measures again", note: "P(offensive) after", kind: "jev" }],
                [{ label: "Before vs after", note: "did the rewrite work?", kind: "ok" }],
              ],
            },
          ]}
          caption="Jev measures the same question twice, on the original and on Gemini's rewrite: the drop in probability is the proof that the rewrite worked."
          wide={false}
        />

        {code}
      </section>

      <section className="flex flex-col gap-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="rounded-xl border border-zinc-300 bg-transparent p-3 dark:border-zinc-700"
        />

        <button onClick={rewrite} disabled={loading} className="self-start rounded-full bg-indigo-600 px-5 py-2 text-white disabled:opacity-50">
          {loading ? "Rewriting…" : "Rewrite politely"}
        </button>

        {before && (
          <Card title="1 · Jev measures the original" subtitle={`${before.ms} ms`} question={before.question}>
            <p>{text}</p>
            <Bar label="Offensive" value={before.offensive} />
          </Card>
        )}
        {gemini && (
          <Card title="2 · Gemini rewrites it" subtitle={`${gemini.ms} ms`}>
            <blockquote className="border-l-4 border-indigo-500 pl-3 italic">{gemini.rewritten}</blockquote>
          </Card>
        )}
        {after && before && (
          <Card title="3 · Jev measures the rewrite" subtitle={`${after.ms} ms`} question={before.question}>
            <Bar label="Offensive" value={after.offensive} highlight />
          </Card>
        )}
        {waitingFor && <p className="animate-pulse text-sm text-zinc-500">{waitingFor}</p>}
        {before && gemini && after && (
          <p className="text-sm text-zinc-500">
            Jev, twice: {before.ms + after.ms} ms · Gemini: {gemini.ms} ms
          </p>
        )}
        {error && <p className="text-rose-600">{error}</p>}
      </section>
    </main>
  );
}

// ---------- Types ----------

// The steps streamed by the API route, one JSON line each.
interface BeforeStep {
  step: "before";
  ms: number;
  question: string;
  offensive: number;
}
interface GeminiStep {
  step: "gemini";
  ms: number;
  rewritten: string;
}
interface AfterStep {
  step: "after";
  ms: number;
  offensive: number;
}
type Step = BeforeStep | GeminiStep | AfterStep | { step: "error"; error: string };

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
