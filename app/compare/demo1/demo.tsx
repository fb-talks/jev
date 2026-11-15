"use client";

import { useState } from "react";
import { models, type ModelId } from "../models";
import { Kind, Pricing, usd } from "../ui";

type Result = {
  probability: number;
  ms: number;
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  cost: number;
};

type Row = { running?: boolean; result?: Result; error?: string; history: Result[] };

const empty = () => Object.fromEntries(models.map((m) => [m.id, { history: [] }])) as unknown as Record<ModelId, Row>;

// The interactive part: one row per model, run one at a time or all together.
export default function Compare({ code }: { code: React.ReactNode }) {
  const [text, setText] = useState("Who taught you to code? Useless post.");
  const [rows, setRows] = useState<Record<ModelId, Row>>(empty);
  const [race, setRace] = useState(false); // the last run was all together: the fastest wins

  const update = (id: ModelId, patch: (r: Row) => Partial<Row>) =>
    setRows((rs) => ({ ...rs, [id]: { ...rs[id], ...patch(rs[id]) } }));

  async function run(id: ModelId) {
    update(id, () => ({ running: true, error: undefined }));
    try {
      const res = await fetch("/compare/demo1/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, model: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      update(id, (r) => ({ running: false, result: data, history: [...r.history, data] }));
    } catch (e) {
      update(id, () => ({ running: false, result: undefined, error: e instanceof Error ? e.message : String(e) }));
    }
  }

  // every model at the same time, one request each
  async function runAll() {
    setRace(true);
    await Promise.all(models.map((m) => run(m.id)));
  }

  function runOne(id: ModelId) {
    setRace(false);
    run(id);
  }

  const busy = models.some((m) => rows[m.id].running);
  const finished = models.filter((m) => rows[m.id].result);
  const fastest = race && !busy && finished.length > 1
    ? finished.reduce((a, b) => (rows[a.id].result!.ms <= rows[b.id].result!.ms ? a : b)).id
    : null;
  const maxMs = Math.max(1, ...finished.map((m) => rows[m.id].result!.ms));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold">Demo 1 · Is this comment offensive?</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          The same comment, the same yes/no question to every model: what is the probability that it&apos;s offensive? Two decision models
          (Jev, Gemini Decision) answer with a probability by design; two text models (Gemini Flash, Flash Lite) are asked to write it as JSON.
          Time, tokens and an estimate of the cost, one model at a time or all together.
        </p>
      </header>

      <Pricing />

      {code}

      <section className="flex flex-col gap-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="rounded-xl border border-zinc-300 bg-transparent p-3 dark:border-zinc-700"
        />

        <div className="flex flex-wrap gap-3">
          <button onClick={runAll} disabled={busy} className="rounded-full bg-indigo-600 px-5 py-2 text-white disabled:opacity-50">
            Run all together
          </button>
          <button
            onClick={() => setRows(empty())}
            disabled={busy}
            className="rounded-full border border-zinc-300 px-5 py-2 text-sm hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Reset totals
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900">
              <tr>
                <th className="px-3 py-2">Model</th>
                <th className="px-3 py-2">Offensive</th>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2 text-right">Tokens in / out</th>
                <th className="px-3 py-2 text-right">Total tokens</th>
                <th className="px-3 py-2 text-right">Cost (est.) = tokens × price</th>
                <th className="px-3 py-2 text-right">× 1M comments</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {models.map((m) => {
                const row = rows[m.id];
                const r = row.result;
                return (
                  <tr key={m.id} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="px-3 py-3 font-medium">
                      {m.name}
                      {fastest === m.id && <span className="ml-2" title="Fastest">🏆</span>}
                      <Kind model={m} />
                      <div className="font-mono text-xs font-normal text-zinc-500">{m.gateway}</div>
                    </td>
                    <td className="px-3 py-3">
                      {row.running ? "…" : r ? <strong>{Math.round(r.probability * 100)}%</strong> : row.error ? (
                        <span className="text-rose-600" title={row.error}>error</span>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-3">
                      {r && !row.running ? (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <div
                              className={`h-2 rounded-full ${m.kind === "decision" ? "bg-indigo-500" : "bg-sky-500"}`}
                              style={{ width: `${(r.ms / maxMs) * 100}%` }}
                            />
                          </div>
                          <span className="tabular-nums">{r.ms} ms</span>
                        </div>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {r && !row.running ? (
                        <>
                          {r.inputTokens} / {r.outputTokens}
                          {r.reasoningTokens > 0 && <div className="text-xs text-zinc-500">{r.reasoningTokens} reasoning</div>}
                        </>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{r && !row.running ? r.inputTokens + r.outputTokens : "—"}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {r && !row.running ? (
                        <>
                          <strong className="text-base">{usd(r.cost)}</strong>
                          <div className="whitespace-nowrap text-xs text-zinc-500">
                            {r.inputTokens} in × ${m.input}/M + {r.outputTokens} out × ${m.output}/M
                          </div>
                        </>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{r && !row.running ? usd(r.cost * 1_000_000) : "—"}</td>
                    <td className="px-3 py-3 text-right">
                      <button
                        onClick={() => runOne(m.id)}
                        disabled={row.running}
                        className="rounded-full border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
                      >
                        Run
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {models.some((m) => rows[m.id].error) && (
          <ul className="flex flex-col gap-1 text-sm text-rose-600">
            {models.filter((m) => rows[m.id].error).map((m) => (
              <li key={m.id}>{m.name}: {rows[m.id].error}</li>
            ))}
          </ul>
        )}

        <Totals rows={rows} />

        <p className="text-xs text-zinc-500">
          Time measured on the server, around the model call only. Cost estimated from the tokens each API reports and the prices above: it is
          not read from the bill.
        </p>
      </section>
    </main>
  );
}

// Everything spent since the page was opened (or the last reset), per model.
function Totals({ rows }: { rows: Record<ModelId, Row> }) {
  if (models.every((m) => rows[m.id].history.length === 0)) return null;
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900">
          <tr>
            <th className="px-3 py-2">Totals</th>
            <th className="px-3 py-2 text-right">Calls</th>
            <th className="px-3 py-2 text-right">Avg time</th>
            <th className="px-3 py-2 text-right">Total tokens</th>
            <th className="px-3 py-2 text-right">Total cost (est.)</th>
          </tr>
        </thead>
        <tbody>
          {models.map((m) => {
            const h = rows[m.id].history;
            const sum = (f: (r: Result) => number) => h.reduce((s, r) => s + f(r), 0);
            return (
              <tr key={m.id} className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="px-3 py-2 font-medium">{m.name}</td>
                <td className="px-3 py-2 text-right tabular-nums">{h.length}</td>
                <td className="px-3 py-2 text-right tabular-nums">{h.length ? `${Math.round(sum((r) => r.ms) / h.length)} ms` : "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums">{sum((r) => r.inputTokens + r.outputTokens)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{usd(sum((r) => r.cost))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

