"use client";

import { useState } from "react";

// A few ready-made styles, so the demo can show every outcome with one click.
const styles = [
  "helpful and empathetic, with a concrete solution",
  "rude and impatient, blaming the customer",
  "toxic, insulting the customer",
  "off topic, talking about a new product launch",
  "generic boilerplate that ignores the problem",
];

export default function Demo2() {
  const [message, setMessage] = useState("I was charged twice for my subscription this month and nobody has answered my emails.");
  const [style, setStyle] = useState(styles[1]);
  const [gemini, setGemini] = useState<GeminiStep | null>(null);
  const [jev, setJev] = useState<JevStep | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // which step we are waiting for, to show where the request is
  const waitingFor = !loading ? null : !gemini ? "Gemini is writing the reply…" : "Jev is evaluating the reply…";

  async function generate() {
    setLoading(true);
    setGemini(null);
    setJev(null);
    setError(null);
    const res = await fetch("/2-jev-and-gemini/demo2/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, style }),
    });

    if (!res.ok || !res.body) {
      const data = await res.json();
      setError(data.error ?? "Request failed");
      setLoading(false);
      return;
    }

    // one JSON line per step: Gemini's reply first, Jev's evaluation after
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
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-10">
      <h1 className="text-2xl font-semibold">Demo 2 · Gemini replies, Jev evaluates</h1>
      <p className="-mt-2 text-zinc-600 dark:text-zinc-400">Gemini drafts a support reply in the style you choose. Jev checks whether it addresses the customer&apos;s problem and how it treats the customer: the check you run before a reply goes out.</p>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Customer&apos;s message
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="rounded-xl border border-zinc-300 bg-transparent p-3 font-normal dark:border-zinc-700"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Style of the support reply
        <input
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          className="rounded-xl border border-zinc-300 bg-transparent p-3 font-normal dark:border-zinc-700"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        {styles.map((s) => (
          <button
            key={s}
            onClick={() => setStyle(s)}
            className={`rounded-full border px-3 py-1 text-xs ${s === style ? "border-indigo-500 text-indigo-600" : "border-zinc-300 text-zinc-500 dark:border-zinc-700"}`}
          >
            {s}
          </button>
        ))}
      </div>

      <button onClick={generate} disabled={loading} className="self-start rounded-full bg-indigo-600 px-5 py-2 text-white disabled:opacity-50">
        {loading ? "Generating…" : "Generate reply"}
      </button>

      {gemini && (
        <Card title="1 · Gemini writes the reply" subtitle={`${gemini.ms} ms`}>
          <blockquote className="border-l-4 border-indigo-500 pl-3 italic">{gemini.reply}</blockquote>
        </Card>
      )}
      {jev && (
        <>
          <h2 className="mt-2 flex items-baseline justify-between font-semibold">
            2 · Jev evaluates it <span className="text-xs font-normal text-zinc-500">{jev.ms} ms</span>
          </h2>
          <Card title="Relevance" subtitle={`choice: ${jev.answers.relevance.choice}`} question={jev.questions.relevance.instructions}>
            {Object.entries(jev.answers.relevance.probabilities).map(([k, v]) => (
              <Bar
                key={k}
                label={k}
                value={v}
                highlight={k === jev.answers.relevance.choice}
                hint={(jev.questions.relevance.criteria as Record<string, string>)[k]}
              />
            ))}
          </Card>
          <Card title="Tone" subtitle={`score: ${jev.answers.tone.score.toFixed(2)} / 3`} question={jev.questions.tone.instructions}>
            {Object.entries(jev.answers.tone.probabilities).map(([k, v]) => (
              <Bar key={k} label={jev.answers.tone.legend[k] ?? k} value={v} />
            ))}
          </Card>
        </>
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

// The questions as the SDK builds them: the text we wrote, and the options or levels.
interface Question {
  type: "noul" | "choice" | "score";
  instructions: string;
  criteria?: Record<string, string> | string[];
}

// The shape of the answers returned by the API route.
interface Answers {
  relevance: { choice: string; confidence: number; probabilities: Record<string, number> };
  tone: { score: number; confidence: number; probabilities: Record<string, number>; legend: Record<string, string> };
}

// The steps streamed by the API route, one JSON line each.
interface GeminiStep {
  step: "gemini";
  ms: number;
  reply: string;
}
interface JevStep {
  step: "jev";
  ms: number;
  answers: Answers;
  questions: Record<keyof Answers, Question>;
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
