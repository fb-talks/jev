"use client";

import { useState } from "react";

export default function Demo6() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [wallMs, setWallMs] = useState<number | null>(null);
  const [thresholds, setThresholds] = useState<Thresholds>(defaultThresholds);
  const [models, setModels] = useState<Model[]>(["jev", "gemini"]);

  async function loadSample() {
    const res = await fetch("/samples/comments.csv");
    load(await res.text());
  }

  async function loadFile(file: File | undefined) {
    if (file) load(await file.text());
  }

  function load(csv: string) {
    setError(null);
    setWallMs(null);
    setDone(0);
    try {
      setRows(parseRows(csv));
    } catch (e) {
      setRows([]);
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function evaluate(chosen: Model[]) {
    setModels(chosen);
    setRunning(true);
    setDone(0);
    setWallMs(null);
    setRows((rs) => rs.map((r) => ({ ...r, result: undefined, error: undefined })));
    const start = performance.now();

    // a few rows at a time: each request calls the chosen models
    await runPool(rows, CONCURRENCY, async (row, i) => {
      const update = (patch: Partial<Row>) =>
        setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
      try {
        const res = await fetch("/2-jev-and-gemini/demo6/api", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: row.comment, models: chosen }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        update({ result: data });
      } catch (e) {
        update({ error: e instanceof Error ? e.message : String(e) });
      } finally {
        setDone((d) => d + 1);
      }
    });

    setWallMs(Math.round(performance.now() - start));
    setRunning(false);
  }

  // The same policy for every model that ran, recomputed locally when you move the thresholds.
  const both = models.length === 2;
  const scored = rows.flatMap((r) =>
    r.result
      ? [{ ...r, ...outcomes(r.result, thresholds) }]
      : [],
  );
  const jevCorrect = scored.filter((r) => r.jev?.decision === r.expected).length;
  const geminiCorrect = scored.filter((r) => r.gemini?.decision === r.expected).length;
  const jevStats = stats(scored.flatMap((r) => (r.result!.jev ? [r.result!.jev.ms] : [])));
  const geminiStats = stats(scored.flatMap((r) => (r.result!.gemini ? [r.result!.gemini.ms] : [])));
  const maxAvg = Math.max(jevStats.avg, geminiStats.avg);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold">Demo 6 · CSV evaluation: Jev vs Gemini</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Both models answer the same three questions; our policy turns the answers into a decision. Who agrees more with the human, and how fast?
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-full border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900">
          Upload CSV
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => loadFile(e.target.files?.[0])} />
        </label>
        <button
          onClick={loadSample}
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Load sample
        </button>
        <a href="/samples/comments.csv" download className="text-sm text-indigo-600 underline dark:text-indigo-400">
          download sample
        </a>
        <span className="text-xs text-zinc-500">columns: comment, expected (publish | review | reject)</span>
      </div>

      {rows.length > 0 && (
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => evaluate(["jev", "gemini"])}
            disabled={running}
            className="rounded-full bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            Compare Jev vs Gemini
          </button>
          <button
            onClick={() => evaluate(["jev"])}
            disabled={running}
            className="rounded-full border border-indigo-400 px-5 py-2 font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
          >
            Only Jev
          </button>
          <button
            onClick={() => evaluate(["gemini"])}
            disabled={running}
            className="rounded-full border border-sky-400 px-5 py-2 font-medium text-sky-600 hover:bg-sky-50 disabled:opacity-50 dark:text-sky-400 dark:hover:bg-sky-950/40"
          >
            Only Gemini
          </button>
          <div className="h-2 flex-1 rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div className="h-2 rounded-full bg-indigo-500 transition-all" style={{ width: `${(done / rows.length) * 100}%` }} />
          </div>
          <span className="text-sm tabular-nums text-zinc-500">
            {done}/{rows.length}
            {wallMs !== null && ` · ${(wallMs / 1000).toFixed(1)} s`}
          </span>
        </div>
      )}

      {error && (
        <p className="rounded-xl bg-rose-100 p-3 text-sm text-rose-900 dark:bg-rose-900/40 dark:text-rose-200">{error}</p>
      )}

      {scored.length > 0 && (
        <>
          <Card accent title="Policy thresholds" subtitle="drag the handles: the decisions change without calling the models again">
            <ThresholdSlider thresholds={thresholds} onChange={setThresholds} />
            <p className="text-xs text-zinc-500">
              Jev&apos;s risks are probabilities, so every step of the slider can change a decision. Gemini&apos;s are labels (0 or 1, toxicity in four steps): the thresholds barely move it.
            </p>
          </Card>

          <div className={`grid gap-4 ${both ? "md:grid-cols-2" : ""}`}>
            {models.includes("jev") && (
              <ModelCard name="Jev" color="bg-indigo-500" correct={jevCorrect} total={scored.length} stats={jevStats} max={maxAvg}>
                <ConfusionMatrix pairs={scored.flatMap((r) => (r.jev ? [[r.expected, r.jev.decision] as [Decision, Decision]] : []))} />
              </ModelCard>
            )}
            {models.includes("gemini") && (
              <ModelCard name="Gemini" color="bg-sky-500" correct={geminiCorrect} total={scored.length} stats={geminiStats} max={maxAvg}>
                <ConfusionMatrix pairs={scored.flatMap((r) => (r.gemini ? [[r.expected, r.gemini.decision] as [Decision, Decision]] : []))} />
              </ModelCard>
            )}
          </div>
          {both && jevStats.avg > 0 && (
            <p className="-mt-2 text-sm">
              Jev is <span className="font-semibold">{(geminiStats.avg / jevStats.avg).toFixed(1)}×</span> faster on average · the two models agree on{" "}
              <span className="font-semibold">{Math.round((scored.filter((r) => r.jev?.decision === r.gemini?.decision).length / scored.length) * 100)}%</span> of the decisions
            </p>
          )}
        </>
      )}

      {rows.length > 0 && (
        <Card title="Comments" subtitle="rose: wrong decision">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-zinc-500">
                <tr>
                  <th className="py-1 pr-3 font-normal">Comment</th>
                  <th className="py-1 pr-3 font-normal">Expected</th>
                  {models.includes("jev") && <th className="py-1 pr-3 font-normal">Jev</th>}
                  {models.includes("gemini") && <th className="py-1 pr-3 font-normal">Gemini</th>}
                  <th className="py-1 text-right font-normal">ms · {both ? "Jev / Gemini" : models[0] === "jev" ? "Jev" : "Gemini"}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const { jev, gemini } = r.result ? outcomes(r.result, thresholds) : { jev: null, gemini: null };
                  return (
                    <tr key={i} className="border-t border-zinc-200 align-top dark:border-zinc-800">
                      <td className="py-2 pr-3">{r.comment}</td>
                      <td className="py-2 pr-3"><Badge decision={r.expected} /></td>
                      {r.result ? (
                        <>
                          {jev && <Verdict outcome={jev} expected={r.expected} />}
                          {gemini && <Verdict outcome={gemini} expected={r.expected} />}
                          <td className="py-2 text-right tabular-nums">
                            {r.result.jev && <span className="text-indigo-600 dark:text-indigo-400">{r.result.jev.ms}</span>}
                            {both && " / "}
                            {r.result.gemini && <span className="text-sky-600 dark:text-sky-400">{r.result.gemini.ms}</span>}
                          </td>
                        </>
                      ) : (
                        <td colSpan={models.length + 1} className="py-2 text-xs">
                          {r.error ? <span className="text-rose-600">{r.error}</span> : <span className="text-zinc-400">…</span>}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </main>
  );
}

// ---------- Types ----------

// Jev's answers, as returned by the API route.
interface Answers {
  category: { probabilities: Record<string, number> };
  toxicity: { score: number };
  personal_data: { noul: number };
}

// Gemini's answers: the same questions, with labels instead of probabilities.
interface GeminiAnswers {
  category: string;
  toxicity: number;
  personal_data: boolean;
}

type Decision = "publish" | "review" | "reject";

type Model = "jev" | "gemini";

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

interface Row {
  comment: string;
  expected: Decision;
  /** null for the model that didn't run */
  result?: { jev: { answers: Answers; ms: number } | null; gemini: { answers: GeminiAnswers; ms: number } | null };
  error?: string;
}

interface Stats {
  avg: number;
  median: number;
  p95: number;
}

// ---------- Constants ----------

const defaultThresholds: Thresholds = { reject: 0.85, review: 0.5 };

const CONCURRENCY = 5;

const decisions: Decision[] = ["publish", "review", "reject"];

const decisionStyle: Record<Decision, { label: string; className: string }> = {
  publish: { label: "✅ Publish", className: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200" },
  review: { label: "🕵️ Review", className: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200" },
  reject: { label: "⛔ Reject", className: "bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-200" },
};

// ---------- CSV ----------

/** A minimal CSV parser: commas, double quotes, "" inside quotes, \n or \r\n line endings. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((f) => f.trim()));
}

/** Reads the comment and expected columns, in any order, and validates the expected values. */
function parseRows(csv: string): Row[] {
  const [header, ...lines] = parseCsv(csv);
  const names = (header ?? []).map((h) => h.trim().toLowerCase());
  const ci = names.indexOf("comment");
  const ei = names.indexOf("expected");
  if (ci < 0 || ei < 0) throw new Error("The CSV needs a header with the columns: comment, expected");
  if (!lines.length) throw new Error("The CSV has no rows.");

  return lines.map((l, i) => {
    const expected = l[ei]?.trim().toLowerCase() as Decision;
    if (!decisions.includes(expected)) {
      throw new Error(`Row ${i + 2}: expected must be publish, review or reject (found "${l[ei] ?? ""}")`);
    }
    return { comment: l[ci]?.trim() ?? "", expected };
  });
}

/** Runs fn on every item, at most `size` at a time. */
async function runPool<T>(items: T[], size: number, fn: (item: T, index: number) => Promise<void>) {
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker));
}

function stats(values: number[]): Stats {
  if (!values.length) return { avg: 0, median: 0, p95: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
  return { avg: Math.round(values.reduce((s, v) => s + v, 0) / values.length), median: at(0.5), p95: at(0.95) };
}

// ---------- Policy ----------

/** Gemini's labels in Jev's shape: the chosen label is certain (1), the others impossible (0). */
function fromGemini(g: GeminiAnswers): Answers {
  return {
    category: { probabilities: { [g.category]: 1 } },
    toxicity: { score: g.toxicity },
    personal_data: { noul: g.personal_data ? 1 : 0 },
  };
}

/** The decision of each model that ran, with the same policy and thresholds; null for the other. */
function outcomes(result: NonNullable<Row["result"]>, thresholds: Thresholds) {
  return {
    jev: result.jev ? decide(result.jev.answers, thresholds) : null,
    gemini: result.gemini ? decide(fromGemini(result.gemini.answers), thresholds) : null,
  };
}

/**
 * The same policy as Demo 3, applied to both models: it lives in OUR code, not in the model.
 */
function decide(a: Answers, thresholds: Thresholds) {
  const signals: Signal[] = [
    { name: "Spam", risk: a.category.probabilities.spam ?? 0 },
    // the score goes from 0 to 3: normalize it to 0..1
    { name: "Toxicity", risk: a.toxicity.score / 3 },
    { name: "Personal data", risk: a.personal_data.noul },
    // off topic doesn't justify a rejection: at most a review
    { name: "Off topic", risk: a.category.probabilities.off_topic ?? 0, reviewOnly: true },
  ];

  // each signal gets its own verdict; the risk stays the raw value from the model
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
function Badge({ decision }: { decision: Decision }) {
  const s = decisionStyle[decision];
  return <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${s.className}`}>{s.label}</span>;
}

/** One model's decision, its strongest signal, and a rose background when it is wrong. */
function Verdict({ outcome, expected }: { outcome: ReturnType<typeof decide>; expected: Decision }) {
  const wrong = outcome.decision !== expected;
  return (
    <td className={`py-2 pr-3 ${wrong ? "bg-rose-50 dark:bg-rose-950/30" : ""}`}>
      <Badge decision={outcome.decision} />
      <div className="mt-0.5 text-xs text-zinc-500">
        {outcome.reason.name} {Math.round(outcome.reason.risk * 100)}%
      </div>
    </td>
  );
}

function ModelCard({ name, color, correct, total, stats, max, children }: { name: string; color: string; correct: number; total: number; stats: Stats; max: number; children: React.ReactNode }) {
  return (
    <Card title={name} subtitle={`${correct} of ${total} correct`}>
      <span className="text-4xl font-semibold tabular-nums">{Math.round((correct / total) * 100)}%</span>
      <div className="flex items-center gap-3 text-sm">
        <div className="h-3 flex-1 rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div className={`h-3 rounded-full ${color}`} style={{ width: `${max ? (stats.avg / max) * 100 : 0}%` }} />
        </div>
        <span className="w-20 text-right tabular-nums">{stats.avg} ms</span>
      </div>
      <p className="text-xs text-zinc-500">
        median {stats.median} ms · p95 {stats.p95} ms
      </p>
      {children}
    </Card>
  );
}

/** Counts each (expected, actual) pair: the diagonal is correct, everything else is an error. */
function ConfusionMatrix({ pairs }: { pairs: [Decision, Decision][] }) {
  const count = (e: Decision, a: Decision) => pairs.filter(([pe, pa]) => pe === e && pa === a).length;
  return (
    <table className="mt-2 text-sm">
      <thead>
        <tr>
          <th />
          {decisions.map((a) => (
            <th key={a} className="px-2 py-1 text-xs font-normal text-zinc-500">{decisionStyle[a].label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {decisions.map((e) => (
          <tr key={e}>
            <th className="pr-2 text-right text-xs font-normal text-zinc-500">{decisionStyle[e].label}</th>
            {decisions.map((a) => {
              const n = count(e, a);
              const tone = e === a ? "bg-emerald-100 dark:bg-emerald-900/40" : n ? "bg-rose-100 dark:bg-rose-900/40" : "";
              return (
                <td key={a} className={`h-10 w-20 border border-zinc-200 text-center tabular-nums dark:border-zinc-800 ${tone}`}>
                  {n}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Card({ title, subtitle, accent, children }: { title: string; subtitle?: string; accent?: boolean; children: React.ReactNode }) {
  return (
    <section
      className={`rounded-xl border p-4 ${accent ? "border-indigo-300 bg-indigo-50/50 dark:border-indigo-500/60 dark:bg-indigo-950/20" : "border-zinc-200 dark:border-zinc-800"
        }`}
    >
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="font-semibold">{title}</h3>
        {subtitle && <span className="text-xs text-zinc-500">{subtitle}</span>}
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

// Both handles share one track; only the thumbs catch the pointer, so each one can be dragged.
const thumb =
  "pointer-events-none absolute inset-0 h-6 w-full appearance-none bg-transparent " +
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-zinc-500 [&::-webkit-slider-thumb]:bg-white " +
  "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-zinc-500 [&::-moz-range-thumb]:bg-white";

/** One bar, two handles: the three bands of the policy. */
function ThresholdSlider({ thresholds, onChange }: { thresholds: Thresholds; onChange: (t: Thresholds) => void }) {
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
      </div>
    </div>
  );
}
