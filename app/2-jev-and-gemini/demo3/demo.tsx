"use client";

import { useState } from "react";
import { FlowDiagram } from "../_components/flow";

// The interactive part of the demo; the code panel comes from the server, already highlighted.
export default function Demo3({ code }: { code: React.ReactNode }) {
  const [text, setText] = useState("I followed the tutorial but the build fails. Any idea?");
  const [gemini, setGemini] = useState<GeminiStep | null>(null);
  const [jev, setJev] = useState<JevStep | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // which step we are waiting for, to show where the request is
  const waitingFor = !loading ? null : !gemini ? "Gemini is writing 3 replies…" : "Jev is scoring the replies…";

  async function propose() {
    setLoading(true);
    setGemini(null);
    setJev(null);
    setError(null);
    const res = await fetch("/2-jev-and-gemini/demo3/api", {
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

    // one JSON line per step: Gemini's replies first, Jev's scores after
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
        if (event.step === "gemini") setGemini(event);
        if (event.step === "jev") setJev(event);
        if (event.step === "error") setError(event.error);
      }
    }
    setLoading(false);
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-10">
      <h1 className="text-2xl font-semibold">Demo 3 · Gemini proposes, Jev picks</h1>
      <p className="-mt-2 text-zinc-600 dark:text-zinc-400">Gemini writes three different replies to a blog comment. Jev scores each one, and our code keeps the best: instead of fixing one draft, you choose among several.</p>

      <FlowDiagram
        wide={false}
        lanes={[
          {
            columns: [
              [{ label: "Blog comment" }],
              [{ label: "Gemini proposes", note: "3 replies, structured", kind: "gemini" }],
              [
                { label: "Jev scores", note: "curt", kind: "jev" },
                { label: "Jev scores", note: "friendly", kind: "jev" },
                { label: "Jev scores", note: "detailed", kind: "jev" },
              ],
              [{ label: "highest\nscore?", kind: "code" }],
              [{ label: "Best reply", note: "picked by our code", kind: "ok" }],
            ],
          },
        ]}
        caption="Gemini returns three replies as structured data; Jev scores them in parallel, and our code keeps the one with the highest score."
      />

      {code}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="rounded-xl border border-zinc-300 bg-transparent p-3 dark:border-zinc-700"
      />

      <button onClick={propose} disabled={loading} className="self-start rounded-full bg-indigo-600 px-5 py-2 text-white disabled:opacity-50">
        {loading ? "Thinking…" : "Propose 3 replies"}
      </button>

      {gemini && (
        <Card title="1 · Gemini proposes 3 replies" subtitle={`${gemini.ms} ms`}>
          <ol className="flex list-decimal flex-col gap-2 pl-5">
            {gemini.replies.map((r) => (
              <li key={r.style}>
                <span className="text-xs uppercase tracking-wide text-zinc-500">{r.style}</span>
                <p>{r.text}</p>
              </li>
            ))}
          </ol>
        </Card>
      )}
      {gemini && jev && (
        <Card title="2 · Jev scores them" subtitle={`${jev.ms} ms · 3 calls in parallel`} question={jev.question}>
          {jev.scores.map((score, i) => (
            <Bar key={i} label={`Reply ${i + 1} · ${gemini.replies[i].style}`} value={score} highlight={i === jev.best} />
          ))}
        </Card>
      )}
      {gemini && jev && (
        <Card title="3 · Our code picks the best" subtitle={`★ reply ${jev.best + 1} · ${gemini.replies[jev.best].style}`}>
          <blockquote className="border-l-4 border-indigo-500 pl-3 italic">{gemini.replies[jev.best].text}</blockquote>
        </Card>
      )}
      {waitingFor && <p className="animate-pulse text-sm text-zinc-500">{waitingFor}</p>}
      {gemini && jev && (
        <p className="text-sm text-zinc-500">
          Gemini: {gemini.ms} ms · Jev: {jev.ms} ms
        </p>
      )}
      {error && <p className="text-rose-600">{error}</p>}
    </main>
  );
}

// ---------- Types ----------

// The steps streamed by the API route, one JSON line each.
interface GeminiStep {
  step: "gemini";
  ms: number;
  replies: { style: string; text: string }[];
}
interface JevStep {
  step: "jev";
  ms: number;
  question: string;
  scores: number[];
  best: number;
}
type Step = GeminiStep | JevStep | { step: "error"; error: string };

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
