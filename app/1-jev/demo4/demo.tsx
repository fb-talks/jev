"use client";

import { useState } from "react";
import { FlowDiagram } from "../../_components/flow";

// The interactive part of the demo; the code panel comes from the server, already highlighted.
export default function Demo4({ code }: { code: React.ReactNode }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [totalMs, setTotalMs] = useState<number | null>(null);
  const [thresholds, setThresholds] = useState<Thresholds>(defaultThresholds);

  async function loadSample() {
    const res = await fetch("/samples/comments.csv");
    load(await res.text());
  }

  async function loadFile(file: File | undefined) {
    if (file) load(await file.text());
  }

  function load(csv: string) {
    setError(null);
    setTotalMs(null);
    setDone(0);
    try {
      setRows(parseRows(csv));
    } catch (e) {
      setRows([]);
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function evaluate() {
    setRunning(true);
    setDone(0);
    setTotalMs(null);
    setRows((rs) => rs.map((r) => ({ ...r, result: undefined, error: undefined })));
    const start = performance.now();

    // a few calls at a time: fast, without flooding the Gateway
    await runPool(rows, CONCURRENCY, async (row, i) => {
      const update = (patch: Partial<Row>) =>
        setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
      try {
        const res = await fetch("/1-jev/demo4/api", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: row.comment }),
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

    setTotalMs(Math.round(performance.now() - start));
    setRunning(false);
  }

  // Everything below is recomputed locally when you move the thresholds: no new call to Jev.
  const scored = rows.flatMap((r) => (r.result ? [{ ...r, outcome: decide(r.result.answers, thresholds) }] : []));
  const correct = scored.filter((r) => r.outcome.decision === r.expected).length;
  const accuracy = scored.length ? correct / scored.length : null;
  const avgMs = scored.length ? Math.round(scored.reduce((s, r) => s + r.result!.ms, 0) / scored.length) : null;

  return (
    // talk layout, one column: what it does, how it works (diagram, then code), the live demo
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold">Demo 4 · CSV evaluation</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Upload comments with the expected decision: we measure how often Jev, plus our policy, agrees with a human.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <FlowDiagram
          lanes={[
            {
              columns: [
                [{ label: "CSV", note: "comment + expected" }],
                [{ label: "Jev, per row", note: `${CONCURRENCY} calls in parallel`, kind: "jev" }],
                [{ label: "Our policy", note: "the same as demo 3", kind: "step" }],
                [{ label: "Decision vs\nexpected", kind: "code" }],
                [{ label: "Accuracy", note: "+ confusion matrix", kind: "ok" }],
              ],
            },
          ]}
          caption="Jev runs once per row. Accuracy and confusion matrix are recomputed in the browser when you move the thresholds."
          wide={false}
        />

        {code}
      </section>

      <section className="flex flex-col gap-6">
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
              onClick={evaluate}
              disabled={running}
              className="rounded-full bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {running ? "Evaluating…" : `Evaluate ${rows.length} comments`}
            </button>
            <div className="h-2 flex-1 rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div className="h-2 rounded-full bg-indigo-500 transition-all" style={{ width: `${(done / rows.length) * 100}%` }} />
            </div>
            <span className="text-sm tabular-nums text-zinc-500">
              {done}/{rows.length}
            </span>
          </div>
        )}

        {error && (
          <p className="rounded-xl bg-rose-100 p-3 text-sm text-rose-900 dark:bg-rose-900/40 dark:text-rose-200">{error}</p>
        )}

        {accuracy !== null && (
          <>
            <Card accent title="Accuracy" subtitle="drag the handles: the numbers change without calling Jev again">
              <div className="mb-2 flex flex-wrap items-baseline gap-x-6 gap-y-1">
                <span className="text-4xl font-semibold tabular-nums">{Math.round(accuracy * 100)}%</span>
                <span className="text-sm text-zinc-500">
                  {correct} of {scored.length} decisions match the expected one
                </span>
                {totalMs !== null && (
                  <span className="text-sm text-zinc-500">
                    ⏱ {(totalMs / 1000).toFixed(1)} s total · {avgMs} ms per call · {CONCURRENCY} in parallel
                  </span>
                )}
              </div>
              <ThresholdSlider thresholds={thresholds} onChange={setThresholds} />
            </Card>

            <Card title="Confusion matrix" subtitle="rows: expected · columns: Jev + policy">
              <ConfusionMatrix pairs={scored.map((r) => [r.expected, r.outcome.decision])} />
            </Card>
          </>
        )}

        {rows.length > 0 && (
          <Card title="Comments" subtitle={scored.length ? `${scored.length - correct} errors highlighted` : `${rows.length} rows loaded`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-zinc-500">
                  <tr>
                    <th className="py-1 pr-3 font-normal">Comment</th>
                    <th className="py-1 pr-3 font-normal">Expected</th>
                    <th className="py-1 pr-3 font-normal">Jev</th>
                    <th className="py-1 font-normal">Strongest signal</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const outcome = r.result ? decide(r.result.answers, thresholds) : null;
                    const wrong = outcome && outcome.decision !== r.expected;
                    return (
                      <tr key={i} className={`border-t border-zinc-200 align-top dark:border-zinc-800 ${wrong ? "bg-rose-50 dark:bg-rose-950/30" : ""}`}>
                        <td className="py-2 pr-3">{r.comment}</td>
                        <td className="py-2 pr-3"><Badge decision={r.expected} /></td>
                        <td className="py-2 pr-3">
                          {outcome ? <Badge decision={outcome.decision} /> : r.error ? <span className="text-xs text-rose-600" title={r.error}>error</span> : <span className="text-zinc-400">…</span>}
                        </td>
                        <td className="py-2 text-xs text-zinc-500">
                          {outcome && `${outcome.reason.name} ${Math.round(outcome.reason.risk * 100)}%`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>
    </main>
  );
}

// ---------- Types ----------

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

interface Row {
  comment: string;
  expected: Decision;
  result?: { answers: Answers; ms: number; usage: { input_tokens: number | null } };
  error?: string;
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

// ---------- Policy ----------

/**
 * The same policy as Demo 3: it lives in OUR code, not in the model.
 * Jev gives probabilities, we decide what to do with them.
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
function Badge({ decision }: { decision: Decision }) {
  const s = decisionStyle[decision];
  return <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${s.className}`}>{s.label}</span>;
}

/** Counts each (expected, actual) pair: the diagonal is correct, everything else is an error. */
function ConfusionMatrix({ pairs }: { pairs: [Decision, Decision][] }) {
  const count = (e: Decision, a: Decision) => pairs.filter(([pe, pa]) => pe === e && pa === a).length;
  return (
    <table className="text-sm">
      <thead>
        <tr>
          <th />
          {decisions.map((a) => (
            <th key={a} className="px-3 py-1 text-xs font-normal text-zinc-500">{decisionStyle[a].label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {decisions.map((e) => (
          <tr key={e}>
            <th className="pr-3 text-right text-xs font-normal text-zinc-500">{decisionStyle[e].label}</th>
            {decisions.map((a) => {
              const n = count(e, a);
              const tone = e === a ? "bg-emerald-100 dark:bg-emerald-900/40" : n ? "bg-rose-100 dark:bg-rose-900/40" : "";
              return (
                <td key={a} className={`h-12 w-24 border border-zinc-200 text-center text-lg tabular-nums dark:border-zinc-800 ${tone}`}>
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
