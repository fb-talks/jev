"use client";

import { useState } from "react";

export default function Demo3() {
  const [text, setText] = useState(examples[0]);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [thresholds, setThresholds] = useState<Thresholds>(defaultThresholds);

  async function analyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/1-jev/demo3/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      console.log(data)
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  // The decision is recomputed locally when you move the thresholds: no new call to Jev.
  const outcome = result ? decide(result.answers, thresholds) : null;
  const a = result?.answers;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold">Demo 3 · Moderation policy</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Jev returns probabilities; our code makes the decision based on the thresholds.
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

      {result && outcome && a && (
        <>
          {/* the decision and the thresholds that produce it, together */}
          <Card accent title="Decision" subtitle="drag the handles: the decision changes without calling Jev again">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-4 py-1.5 text-lg font-semibold ${decisionStyle[outcome.decision].className}`}>
                {decisionStyle[outcome.decision].label}
              </span>
              <span className="text-sm text-zinc-500">
                strongest signal: {outcome.reason.name} ({Math.round(outcome.reason.risk * 100)}%)
              </span>
            </div>
            <ThresholdSlider thresholds={thresholds} onChange={setThresholds} risk={outcome.reason.risk} />
          </Card>

          <Card title="Risk signals" subtitle="derived from Jev's answers">
            {outcome.signals.map((s) => (
              <Bar key={s.name} label={s.name} value={s.risk} highlight={s.name === outcome.reason.name} />
            ))}
          </Card>

          <div className="grid gap-4">
            <Card title="category · choice" subtitle={`choice: ${a.category.choice} · confidence ${a.category.confidence.toFixed(2)}`} question={result.questions.category.instructions}>
              {Object.entries(a.category.probabilities).map(([k, v]) => (
                <Bar
                  key={k}
                  label={k}
                  value={v}
                  highlight={k === a.category.choice}
                  hint={(result.questions.category.criteria as Record<string, string>)[k]}
                />
              ))}
            </Card>

            <Card title="toxicity · score" subtitle={`score: ${a.toxicity.score.toFixed(2)} / 3 · confidence ${a.toxicity.confidence.toFixed(2)}`} question={result.questions.toxicity.instructions}>
              {Object.entries(a.toxicity.probabilities).map(([k, v]) => (
                <Bar key={k} label={`${k} · ${a.toxicity.legend[k] ?? ""}`} value={v} />
              ))}
            </Card>

            <Card title="personal_data · noul" subtitle="probability of yes" question={result.questions.personal_data.instructions}>
              <Bar label="contains personal data" value={a.personal_data.noul} highlight />
            </Card>
          </div>

          <p className="text-xs text-zinc-500">
            {result.model} · {result.ms} ms · {result.usage.input_tokens ?? "?"} input tokens
          </p>

          <details className="text-sm">
            <summary className="cursor-pointer text-zinc-500">Raw response</summary>
            <pre className="mt-2 overflow-x-auto rounded-xl bg-zinc-100 p-3 text-xs dark:bg-zinc-900">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
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
  personal_data: { noul: number };
}

type Decision = "publish" | "review" | "reject";

interface Thresholds {
  /** Above this risk the comment is rejected automatically. */
  reject: number;
  /** Above this risk the comment goes to the moderation queue. */
  review: number;
}

interface Signal {
  name: string;
  risk: number; // 0..1
  /** true when this signal alone can never reject the comment: at most a review. */
  reviewOnly?: boolean;
}

interface ApiResult {
  questions: Record<keyof Answers, Question>;
  model: string;
  ms: number;
  usage: { input_tokens: number | null };
  answers: Answers;
}

// ---------- Constants ----------

const defaultThresholds: Thresholds = { reject: 0.85, review: 0.5 };

const examples = [
  "Clear explanation of React Server Components. Have you measured how they affect bundle size in a large app?",
  "Wow, another 'ultimate guide' that copies the docs word for word. Truly groundbreaking stuff.",
  "Nice write-up! I wrote a follow-up on my blog that covers the edge cases you skipped: devnotes.example/rsc-edge-cases",
  "Your code is wrong and so are you. Delete this blog before you embarrass yourself further.",
  "I had the same bug at work, feel free to reach out on LinkedIn, I'm the only Marco Bianchi at Acme Corp in Milan.",
  "💰 Make $5,000/week from home!!! No experience needed. DM me now 💰",
  "What's the best pizza place near the conference venue? Asking for the meetup tonight.",
  "This approach is garbage. useMemo here kills readability and the benchmark proves nothing.",
];

const decisionStyle: Record<Decision, { label: string; className: string }> = {
  publish: { label: "✅ Publish", className: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200" },
  review: { label: "🕵️ Needs review", className: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200" },
  reject: { label: "⛔ Reject", className: "bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-200" },
};

// ---------- Policy ----------

/**
 * The policy lives in OUR code, not in the model:
 * Jev gives probabilities, we decide what to do with them.
 */
function decide(a: Answers, thresholds: Thresholds) {
  const signals: Signal[] = [
    { name: "Spam", risk: a.category.probabilities.spam ?? 0 },
    // the score goes from 0 to 3: normalize it to 0..1
    { name: "Toxicity", risk: a.toxicity.score / 3 },
    { name: "Personal data", risk: a.personal_data.noul },
    // off topic doesn't justify a rejection: at most a review
    { name: "Off topic (not rejectable)", risk: a.category.probabilities.off_topic ?? 0, reviewOnly: true },
  ];

  // each signal gets its own verdict; the risk stays the raw value from Jev
  const verdict = (s: Signal): Decision =>
    s.risk >= thresholds.reject && !s.reviewOnly
      ? "reject"
      : s.risk >= thresholds.review
        ? "review"
        : "publish";

  // the most severe verdict wins; on a tie, the higher risk
  const severity: Record<Decision, number> = { publish: 0, review: 1, reject: 2 };
  const worst = signals.reduce((a, b) => {
    const diff = severity[verdict(b)] - severity[verdict(a)];
    return diff > 0 || (diff === 0 && b.risk > a.risk) ? b : a;
  });

  return { decision: verdict(worst), signals, reason: worst };
}

/** Keeps review below reject: the slider you move stops at the other one, so the review band never disappears. */
function clampThresholds(t: Thresholds, key: keyof Thresholds, value: number): Thresholds {
  const gap = 0.05; // one slider step
  const round = (n: number) => Math.round(n * 100) / 100; // 0.85 - 0.05 is 0.7999… in floating point
  return key === "review"
    ? { ...t, review: round(Math.min(value, t.reject - gap)) }
    : { ...t, reject: round(Math.max(value, t.review + gap)) };
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

function Card({ title, subtitle, question, accent, children }: { title: string; subtitle?: string; question?: string; accent?: boolean; children: React.ReactNode }) {
  return (
    <section
      className={`rounded-xl border p-4 ${accent ? "border-indigo-300 bg-indigo-50/50 dark:border-indigo-500/60 dark:bg-indigo-950/20" : "border-zinc-200 dark:border-zinc-800"
        }`}
    >
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

// Both handles share one track; only the thumbs catch the pointer, so each one can be dragged.
const thumb =
  "pointer-events-none absolute inset-0 h-6 w-full appearance-none bg-transparent " +
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-zinc-500 [&::-webkit-slider-thumb]:bg-white " +
  "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-zinc-500 [&::-moz-range-thumb]:bg-white";

/** One bar, two handles: the three bands of the policy, and where the strongest signal falls. */
function ThresholdSlider({ thresholds, onChange, risk }: { thresholds: Thresholds; onChange: (t: Thresholds) => void; risk: number }) {
  const pct = (n: number) => `${n * 100}%`;
  return (
    <div className="text-sm">
      <div className="relative h-6">
        {/* inset by half a thumb, so the bands line up with the thumb centers */}
        <div className="absolute inset-x-2.5 top-2 flex h-2 overflow-hidden rounded-full">
          <div className="bg-emerald-400" style={{ width: pct(thresholds.review) }} />
          <div className="bg-amber-400" style={{ width: pct(thresholds.reject - thresholds.review) }} />
          <div className="flex-1 bg-rose-400" />
        </div>
        <div className="absolute inset-x-2.5 top-0">
          <div className="absolute h-6 w-1 -translate-x-1/2 animate-pulse rounded bg-pink-500" style={{ left: pct(risk) }} />
        </div>
        {(["review", "reject"] as const).map((k) => (
          <input
            key={k}
            type="range" min={0} max={1} step={0.05} value={thresholds[k]}
            aria-label={k === "reject" ? "Auto-reject from" : "Review from"}
            onChange={(e) => onChange(clampThresholds(thresholds, k, Number(e.target.value)))}
            className={thumb}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
        <span>✅ publish below {Math.round(thresholds.review * 100)}%</span>
        <span>🕵️ review from {Math.round(thresholds.review * 100)}%</span>
        <span>⛔ reject from {Math.round(thresholds.reject * 100)}%</span>
        <span className="text-pink-500">▍ strongest signal {Math.round(risk * 100)}%</span>
      </div>
    </div>
  );
}
