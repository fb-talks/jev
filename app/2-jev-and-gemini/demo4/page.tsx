"use client";

import { Fragment, useState } from "react";

export default function Demo4() {
  const [input, setInput] = useState(defaultUrls.join("\n"));
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const [wallMs, setWallMs] = useState<number | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  async function classify() {
    const urls = input.split("\n").map((u) => u.trim()).filter(Boolean);
    setRows(urls.map((url) => ({ url })));
    setRunning(true);
    setWallMs(null);
    setOpen(null);
    const start = performance.now();

    // a few URLs at a time: each request scrapes once and calls both models
    await runPool(urls, CONCURRENCY, async (url, i) => {
      const update = (patch: Partial<Row>) =>
        setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
      try {
        const res = await fetch("/2-jev-and-gemini/demo4/api", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        update({ result: data });
      } catch (e) {
        update({ error: e instanceof Error ? e.message : String(e) });
      }
    });

    setWallMs(Math.round(performance.now() - start));
    setRunning(false);
  }

  const results = rows.flatMap((r) => (r.result ? [r.result] : []));
  const done = rows.filter((r) => r.result || r.error).length;
  const jevStats = stats(results.map((r) => r.jev.ms));
  const geminiStats = stats(results.map((r) => r.gemini.ms));
  const fetchStats = stats(results.map((r) => r.fetchMs));
  const agree = (key: "type" | "sector") =>
    results.length ? results.filter((r) => r.jev.answers[key].choice === r.gemini.answers[key]).length / results.length : 0;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold">Demo 4 · Jev vs Gemini on 20 websites</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          We scrape each home page once, then Jev and Gemini classify the same text. Who is faster, and do they agree?
        </p>
      </header>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={6}
        className="w-full rounded-xl border border-zinc-300 bg-transparent p-3 font-mono text-xs dark:border-zinc-700"
        placeholder="One URL per line"
      />

      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={classify}
          disabled={running || !input.trim()}
          className="rounded-full bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {running ? "Classifying…" : "Classify websites"}
        </button>
        {rows.length > 0 && (
          <>
            <div className="h-2 flex-1 rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div className="h-2 rounded-full bg-indigo-500 transition-all" style={{ width: `${(done / rows.length) * 100}%` }} />
            </div>
            <span className="text-sm tabular-nums text-zinc-500">
              {done}/{rows.length}
              {wallMs !== null && ` · ${(wallMs / 1000).toFixed(1)} s`}
            </span>
          </>
        )}
      </div>

      {results.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card accent title="Classification time" subtitle={`${results.length} sites · scraping excluded`}>
            <TimeBar label="Jev" stats={jevStats} max={Math.max(jevStats.avg, geminiStats.avg)} color="bg-indigo-500" />
            <TimeBar label="Gemini" stats={geminiStats} max={Math.max(jevStats.avg, geminiStats.avg)} color="bg-sky-500" />
            {jevStats.avg > 0 && (
              <p className="mt-1 text-sm">
                Jev is <span className="font-semibold">{(geminiStats.avg / jevStats.avg).toFixed(1)}×</span> faster on average
              </p>
            )}
            <p className="text-xs text-zinc-500">
              scraping: avg {fetchStats.avg} ms · input tokens: Jev {sum(results.map((r) => r.jev.inputTokens))}, Gemini {sum(results.map((r) => r.gemini.inputTokens))}
            </p>
          </Card>

          <Card title="Agreement" subtitle="same label from both models">
            <Agreement label="type" value={agree("type")} />
            <Agreement label="sector" value={agree("sector")} />
            <p className="text-xs text-zinc-500">
              Gemini returns only a label; Jev returns a probability for every option. Click a row to see them.
            </p>
          </Card>
        </div>
      )}

      {rows.length > 0 && (
        <Card title="Websites" subtitle="disagreements highlighted">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-zinc-500">
                <tr>
                  <th className="py-1 pr-3 font-normal">Site</th>
                  <th className="py-1 pr-3 font-normal">Type · Jev / Gemini</th>
                  <th className="py-1 pr-3 font-normal">Sector · Jev / Gemini</th>
                  <th className="py-1 pr-3 font-normal">Commercial</th>
                  <th className="py-1 text-right font-normal">ms · Jev / Gemini</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <Fragment key={i}>
                    <tr
                      onClick={() => r.result && setOpen(open === i ? null : i)}
                      className={`border-t border-zinc-200 align-top dark:border-zinc-800 ${r.result ? "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900" : ""}`}
                    >
                      <td className="max-w-56 py-2 pr-3">
                        <div className="truncate font-medium" title={r.result?.title}>{r.result?.title || hostname(r.url)}</div>
                        <div className="truncate text-xs text-zinc-500">{hostname(r.url)}</div>
                      </td>
                      {r.result ? (
                        <>
                          <Compare jev={r.result.jev.answers.type} gemini={r.result.gemini.answers.type} />
                          <Compare jev={r.result.jev.answers.sector} gemini={r.result.gemini.answers.sector} />
                          <td className="py-2 pr-3 tabular-nums">
                            {r.result.jev.answers.commercial.score.toFixed(1)} / {r.result.gemini.answers.commercial}
                          </td>
                          <td className="py-2 text-right tabular-nums">
                            <span className="text-indigo-600 dark:text-indigo-400">{r.result.jev.ms}</span>
                            {" / "}
                            <span className="text-sky-600 dark:text-sky-400">{r.result.gemini.ms}</span>
                          </td>
                        </>
                      ) : (
                        <td colSpan={4} className="py-2 text-xs">
                          {r.error ? <span className="text-rose-600">{r.error}</span> : <span className="text-zinc-400">…</span>}
                        </td>
                      )}
                    </tr>
                    {open === i && r.result && (
                      <tr>
                        <td colSpan={5} className="pb-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <Probabilities title="type" answer={r.result.jev.answers.type} />
                            <Probabilities title="sector" answer={r.result.jev.answers.sector} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </main>
  );
}

// ---------- Types ----------

interface ChoiceAnswer {
  choice: string;
  confidence: number;
  probabilities: Record<string, number>;
}

// The shape of the API response: the same three questions, answered by both models.
interface Result {
  url: string;
  title: string;
  chars: number;
  fetchMs: number;
  jev: {
    answers: { type: ChoiceAnswer; sector: ChoiceAnswer; commercial: { score: number; confidence: number } };
    inputTokens: number | null;
    ms: number;
  };
  gemini: {
    answers: { type: string; sector: string; commercial: number };
    inputTokens: number | null;
    ms: number;
  };
}

interface Row {
  url: string;
  result?: Result;
  error?: string;
}

interface Stats {
  avg: number;
  median: number;
  p95: number;
}

// ---------- Constants ----------

const CONCURRENCY = 4;

// A mix of shops, news, docs, SaaS, institutions and communities.
const defaultUrls = [
  "https://www.ikea.com/it/it/",
  "https://www.zalando.it",
  "https://www.lafeltrinelli.it",
  "https://www.bbc.com/news",
  "https://www.theguardian.com/international",
  "https://www.ilpost.it",
  "https://nextjs.org/docs",
  "https://developer.mozilla.org/en-US/",
  "https://react.dev",
  "https://vercel.com",
  "https://stripe.com",
  "https://www.notion.com",
  "https://www.figma.com",
  "https://www.governo.it",
  "https://www.who.int",
  "https://www.polimi.it",
  "https://news.ycombinator.com",
  "https://dev.to",
  "https://www.italotreno.com",
  "https://overreacted.io",
];

// ---------- Helpers ----------

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
  return { avg: Math.round(sum(values) / values.length), median: at(0.5), p95: at(0.95) };
}

function sum(values: (number | null)[]) {
  return values.reduce<number>((s, v) => s + (v ?? 0), 0);
}

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// ---------- UI ----------

// Small presentational pieces, repeated in every demo page so each file reads on its own.
function TimeBar({ label, stats, max, color }: { label: string; stats: Stats; max: number; color: string }) {
  return (
    <div className="text-sm">
      <div className="flex items-center gap-3">
        <span className="w-16 shrink-0 font-semibold">{label}</span>
        <div className="h-3 flex-1 rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div className={`h-3 rounded-full ${color}`} style={{ width: `${max ? (stats.avg / max) * 100 : 0}%` }} />
        </div>
        <span className="w-20 text-right tabular-nums">{stats.avg} ms</span>
      </div>
      <p className="ml-19 text-xs text-zinc-500">
        median {stats.median} ms · p95 {stats.p95} ms
      </p>
    </div>
  );
}

function Agreement({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-16 shrink-0">{label}</span>
      <div className="h-2 flex-1 rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${value * 100}%` }} />
      </div>
      <span className="w-12 text-right tabular-nums">{Math.round(value * 100)}%</span>
    </div>
  );
}

/** Jev's label with its confidence, Gemini's label below; amber when they differ. */
function Compare({ jev, gemini }: { jev: ChoiceAnswer; gemini: string }) {
  const differ = jev.choice !== gemini;
  return (
    <td className={`py-2 pr-3 ${differ ? "bg-amber-50 dark:bg-amber-950/30" : ""}`}>
      <div>
        <span className="text-indigo-600 dark:text-indigo-400">{jev.choice}</span>{" "}
        <span className="text-xs text-zinc-500">{Math.round(jev.confidence * 100)}%</span>
      </div>
      <div className="text-sky-600 dark:text-sky-400">{gemini}</div>
    </td>
  );
}

function Probabilities({ title, answer }: { title: string; answer: ChoiceAnswer }) {
  const entries = Object.entries(answer.probabilities).sort((a, b) => b[1] - a[1]);
  return (
    <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
      <h4 className="mb-2 text-xs font-semibold text-zinc-500">Jev · {title}</h4>
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center gap-3 text-xs">
          <span className={`w-24 shrink-0 ${k === answer.choice ? "font-semibold" : ""}`}>{k}</span>
          <div className="h-1.5 flex-1 rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${Math.round(v * 100)}%` }} />
          </div>
          <span className="w-10 text-right tabular-nums">{Math.round(v * 100)}%</span>
        </div>
      ))}
    </div>
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
