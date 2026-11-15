"use client";

import { useState } from "react";
import { models, type ModelId } from "../models";
import { Kind, Pricing, usd } from "../ui";
import type { Signals } from "./api/route";

// The interactive part: the CSV of 1-jev/demo4, evaluated by every model, all together or one at a time.
export default function CompareCsv({ code }: { code: React.ReactNode }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [runs, setRuns] = useState<Partial<Record<ModelId, Run>>>({});
  const [thresholds, setThresholds] = useState<Thresholds>(defaultThresholds);
  const [race, setRace] = useState(false); // the last run had more models at the same time

  async function loadSample() {
    const res = await fetch("/samples/comments.csv");
    load(await res.text());
  }

  async function loadFile(file: File | undefined) {
    if (file) load(await file.text());
  }

  function load(csv: string) {
    setError(null);
    setRuns({});
    try {
      setRows(parseRows(csv));
    } catch (e) {
      setRows([]);
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  // Every chosen model gets its own pool of calls: a slow model never holds back a fast one,
  // so the total time of each model is the time it would take on its own.
  async function evaluate(chosen: ModelId[]) {
    setRace(chosen.length > 1);
    setRows((rs) => rs.map((r) => ({ ...r, results: omit(r.results, chosen), errors: omit(r.errors, chosen) })));
    setRuns((rs) => ({ ...rs, ...Object.fromEntries(chosen.map((id) => [id, { running: true, done: 0 }])) }));

    await Promise.all(
      chosen.map(async (id) => {
        const start = performance.now();
        await runPool(rows, CONCURRENCY, async (row, i) => {
          const patch = (p: (r: Row) => Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...p(r) } : r)));
          try {
            const res = await fetch("/compare/demo2/api", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: row.comment, model: id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            patch((r) => ({ results: { ...r.results, [id]: data } }));
          } catch (e) {
            patch((r) => ({ errors: { ...r.errors, [id]: e instanceof Error ? e.message : String(e) } }));
          } finally {
            setRuns((rs) => ({ ...rs, [id]: { ...rs[id]!, done: rs[id]!.done + 1 } }));
          }
        });
        setRuns((rs) => ({ ...rs, [id]: { ...rs[id]!, running: false, wallMs: Math.round(performance.now() - start) } }));
      }),
    );
  }

  const busy = Object.values(runs).some((r) => r?.running);

  // Everything below is recomputed locally when you move the thresholds: no new call to the models.
  const stats = models.map((m) => {
    const results = rows.flatMap((r) => (r.results[m.id] ? [{ row: r, result: r.results[m.id]! }] : []));
    const correct = results.filter(({ row, result }) => decide(result.signals, thresholds).decision === row.expected).length;
    const sum = (f: (r: Result) => number) => results.reduce((s, { result }) => s + f(result), 0);
    const run = runs[m.id];
    return {
      model: m,
      run,
      count: results.length,
      complete: Boolean(run && !run.running && results.length === rows.length),
      accuracy: results.length ? correct / results.length : null,
      correct,
      avgMs: results.length ? Math.round(sum((r) => r.ms) / results.length) : null,
      inputTokens: sum((r) => r.inputTokens),
      outputTokens: sum((r) => r.outputTokens),
      reasoningTokens: sum((r) => r.reasoningTokens),
      cost: sum((r) => r.cost),
    };
  });
  const finished = stats.filter((s) => s.complete);
  const best = <K extends "wall" | "accuracy" | "cost">(key: K) => {
    if (!race || busy || finished.length < 2) return null;
    const value = (s: (typeof stats)[number]) => (key === "wall" ? -s.run!.wallMs! : key === "accuracy" ? s.accuracy! : -s.cost);
    return finished.reduce((a, b) => (value(b) > value(a) ? b : a)).model.id;
  };
  const fastest = best("wall");
  const mostAccurate = best("accuracy");
  const cheapest = best("cost");
  const evaluated = stats.filter((s) => s.count > 0);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold">Demo 2 · CSV evaluation: who agrees with the human?</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          The CSV of comments with the expected decision, the same three questions to every model, the same policy on the answers. Accuracy,
          time, tokens and an estimate of the cost: all models together, or one at a time.
        </p>
      </header>

      <Pricing />

      {code}

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

        {error && <p className="rounded-xl bg-rose-100 p-3 text-sm text-rose-900 dark:bg-rose-900/40 dark:text-rose-200">{error}</p>}

        {rows.length > 0 && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => evaluate(models.map((m) => m.id))}
                disabled={busy}
                className="rounded-full bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {busy ? "Evaluating…" : `Evaluate ${rows.length} comments with all models together`}
              </button>
              <span className="text-xs text-zinc-500">
                {CONCURRENCY} calls in parallel per model · or run one model at a time from the table
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full min-w-[960px] text-sm">
                <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900">
                  <tr>
                    <th className="px-3 py-2">Model</th>
                    <th className="px-3 py-2">Progress</th>
                    <th className="px-3 py-2 text-right">Accuracy</th>
                    <th className="px-3 py-2 text-right">Total time</th>
                    <th className="px-3 py-2 text-right">Avg per call</th>
                    <th className="px-3 py-2 text-right">Tokens in / out</th>
                    <th className="px-3 py-2 text-right">Cost (est.) = tokens × price</th>
                    <th className="px-3 py-2 text-right">× 1M comments</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s) => {
                    const m = s.model;
                    const has = s.count > 0;
                    return (
                      <tr key={m.id} className="border-t border-zinc-200 align-top dark:border-zinc-800">
                        <td className="px-3 py-3 font-medium">
                          {m.name}
                          <Kind model={m} />
                          <div className="mt-0.5 flex gap-1 text-base">
                            {fastest === m.id && <span title="Fastest">🏆</span>}
                            {mostAccurate === m.id && <span title="Most accurate">🎯</span>}
                            {cheapest === m.id && <span title="Cheapest">💰</span>}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          {s.run ? (
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-20 rounded-full bg-zinc-100 dark:bg-zinc-800">
                                <div
                                  className={`h-2 rounded-full transition-all ${m.kind === "decision" ? "bg-indigo-500" : "bg-sky-500"}`}
                                  style={{ width: `${(s.run.done / rows.length) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs tabular-nums text-zinc-500">
                                {s.run.done}/{rows.length}
                              </span>
                            </div>
                          ) : "—"}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">
                          {s.accuracy !== null ? (
                            <>
                              <strong className="text-base">{Math.round(s.accuracy * 100)}%</strong>
                              <div className="text-xs text-zinc-500">{s.correct}/{s.count}</div>
                            </>
                          ) : "—"}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">
                          {s.run?.wallMs !== undefined ? `${(s.run.wallMs / 1000).toFixed(1)} s` : s.run?.running ? "…" : "—"}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">{s.avgMs !== null ? `${s.avgMs} ms` : "—"}</td>
                        <td className="px-3 py-3 text-right tabular-nums">
                          {has ? (
                            <>
                              {s.inputTokens} / {s.outputTokens}
                              {s.reasoningTokens > 0 && <div className="text-xs text-zinc-500">{s.reasoningTokens} reasoning</div>}
                            </>
                          ) : "—"}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">
                          {has ? (
                            <>
                              <strong className="text-base">{usd(s.cost)}</strong>
                              <div className="whitespace-nowrap text-xs text-zinc-500">
                                {s.inputTokens} in × ${m.input}/M + {s.outputTokens} out × ${m.output}/M
                              </div>
                            </>
                          ) : "—"}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">
                          {has ? (
                            <>
                              {usd((s.cost / s.count) * 1_000_000)}
                              <div className="text-xs text-zinc-500">{usd(s.cost / s.count)} per comment</div>
                            </>
                          ) : "—"}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            onClick={() => evaluate([m.id])}
                            disabled={busy}
                            className="whitespace-nowrap rounded-full border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                          >
                            Run only this
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="-mt-4 text-xs text-zinc-500">
              Total time: from the first call to the last answer of that model, measured in the browser. Avg per call: measured on the server,
              around the model call only. Cost estimated from the tokens each API reports and the prices above.
            </p>
          </>
        )}

        {evaluated.length > 0 && (
          <>
            <Card accent title="Policy thresholds" subtitle="drag the handles: accuracy and matrices change without calling the models again">
              <ThresholdSlider thresholds={thresholds} onChange={setThresholds} />
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {evaluated.map((s) => (
                <Card key={s.model.id} title={s.model.name} subtitle="rows: expected · columns: model + policy">
                  <ConfusionMatrix
                    pairs={rows.flatMap((r) => {
                      const res = r.results[s.model.id];
                      return res ? [[r.expected, decide(res.signals, thresholds).decision] as [Decision, Decision]] : [];
                    })}
                  />
                </Card>
              ))}
            </div>
          </>
        )}

        {rows.length > 0 && (
          <Card title="Comments" subtitle={`${rows.length} rows · wrong decisions highlighted`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="text-xs text-zinc-500">
                  <tr>
                    <th className="py-1 pr-3 font-normal">Comment</th>
                    <th className="py-1 pr-3 font-normal">Expected</th>
                    {models.map((m) => (
                      <th key={m.id} className="py-1 pr-3 font-normal">{m.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-t border-zinc-200 align-top dark:border-zinc-800">
                      <td className="py-2 pr-3">{r.comment}</td>
                      <td className="py-2 pr-3"><Badge decision={r.expected} /></td>
                      {models.map((m) => {
                        const res = r.results[m.id];
                        const err = r.errors[m.id];
                        const outcome = res ? decide(res.signals, thresholds) : null;
                        const wrong = outcome && outcome.decision !== r.expected;
                        return (
                          <td key={m.id} className={`py-2 pr-3 ${wrong ? "bg-rose-50 dark:bg-rose-950/30" : ""}`}>
                            {outcome ? (
                              <>
                                <Badge decision={outcome.decision} />
                                <div className="mt-1 text-xs text-zinc-500">
                                  {outcome.reason.name} {Math.round(outcome.reason.risk * 100)}% · {res!.ms} ms
                                </div>
                              </>
                            ) : err ? (
                              <span className="text-xs text-rose-600" title={err}>error</span>
                            ) : runs[m.id]?.running ? (
                              <span className="text-zinc-400">…</span>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
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

type Decision = "publish" | "review" | "reject";

interface Result {
  signals: Signals;
  ms: number;
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  cost: number;
}

interface Row {
  comment: string;
  expected: Decision;
  results: Partial<Record<ModelId, Result>>;
  errors: Partial<Record<ModelId, string>>;
}

interface Run {
  running: boolean;
  done: number;
  wallMs?: number;
}

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

// ---------- Constants ----------

const defaultThresholds: Thresholds = { reject: 0.85, review: 0.5 };

const CONCURRENCY = 5;

const decisions: Decision[] = ["publish", "review", "reject"];

const decisionStyle: Record<Decision, { label: string; className: string }> = {
  publish: { label: "✅ Publish", className: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200" },
  review: { label: "🕵️ Review", className: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200" },
  reject: { label: "⛔ Reject", className: "bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-200" },
};

function omit<T extends object>(obj: T, keys: string[]): T {
  return Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k))) as T;
}

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
    return { comment: l[ci]?.trim() ?? "", expected, results: {}, errors: {} };
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
 * The policy of 1-jev/demo4, the same for every model: it lives in OUR code, not in the model.
 * The models give risks, we decide what to do with them.
 */
function decide(s: Signals, thresholds: Thresholds) {
  const signals: Signal[] = [
    { name: "Spam", risk: s.spam },
    { name: "Toxicity", risk: s.toxicity },
    { name: "Personal data", risk: s.personal_data },
    // off topic doesn't justify a rejection: at most a review
    { name: "Off topic", risk: s.off_topic, reviewOnly: true },
  ];

  // each signal gets its own verdict
  const verdict = (s: Signal): Decision =>
    s.risk >= thresholds.reject && !s.reviewOnly ? "reject" : s.risk >= thresholds.review ? "review" : "publish";

  // the most severe verdict wins; on a tie, the higher risk
  const severity: Record<Decision, number> = { publish: 0, review: 1, reject: 2 };
  const worst = signals.reduce((a, b) => {
    const diff = severity[verdict(b)] - severity[verdict(a)];
    return diff > 0 || (diff === 0 && b.risk > a.risk) ? b : a;
  });

  return { decision: verdict(worst), reason: worst };
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
            <th key={a} className="px-1 py-1 text-base font-normal" title={decisionStyle[a].label}>
              {decisionStyle[a].label.split(" ")[0]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {decisions.map((e) => (
          <tr key={e}>
            <th className="pr-2 text-right text-base font-normal" title={decisionStyle[e].label}>
              {decisionStyle[e].label.split(" ")[0]}
            </th>
            {decisions.map((a) => {
              const n = count(e, a);
              const tone = e === a ? "bg-emerald-100 dark:bg-emerald-900/40" : n ? "bg-rose-100 dark:bg-rose-900/40" : "";
              return (
                <td key={a} className={`h-10 w-12 border border-zinc-200 text-center tabular-nums dark:border-zinc-800 ${tone}`}>
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
      className={`rounded-xl border p-4 ${accent ? "border-indigo-300 bg-indigo-50/50 dark:border-indigo-500/60 dark:bg-indigo-950/20" : "border-zinc-200 dark:border-zinc-800"}`}
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
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
