"use client";

import { useState } from "react";
import { FlowDiagram } from "../../_components/flow";

// A realistic support inbox: half simple requests, half real problems, and a couple of tricky ones.
const sample = `Hi there!
Thanks, that solved it 🙏
Good morning, have a nice day!
Where is my order #4821? It was supposed to arrive yesterday.
Any update on order 5530?
When will my package ship? Order #6102
How do I reset my password?
I forgot my password and can't log in.
I was charged twice this month and the app crashes when I export a PDF.
Your latest update deleted all my saved templates. I need them back before Monday's client meeting.
Can I move my team of 12 from the monthly to the annual plan and keep our current discount?
The API returns 429 errors even though we are far below the documented rate limit.
I want to cancel, but first explain why the price went up 40% without notice.
Is your product GDPR compliant if we store EU customer data in your US region?
My order #7744 arrived but the box was damaged and one item is missing.
Thanks, but the password reset email never arrives.`;

// how many messages each column handles at the same time: the same for both, so the comparison is fair
const CONCURRENCY = 4;

const modes = ["gemini", "router"] as const;

// The interactive part of the demo; the code panel comes from the server, already highlighted.
export default function Demo7({ code }: { code: React.ReactNode }) {
  const [text, setText] = useState(sample);
  const [threshold, setThreshold] = useState(0.7);
  const [results, setResults] = useState<Record<Mode, (Result | null)[]>>({
    gemini: [],
    router: [],
  });
  const [wall, setWall] = useState<Record<Mode, number | null>>({
    gemini: null,
    router: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const messages = text
    .split("\n")
    .map((m) => m.trim())
    .filter(Boolean);

  async function run() {
    setRunning(true);
    setError(null);
    setResults({
      gemini: messages.map(() => null),
      router: messages.map(() => null),
    });
    setWall({ gemini: null, router: null });

    // the two columns run at the same time, each on the whole inbox
    await Promise.all(
      modes.map(async (mode) => {
        const start = performance.now();
        await runPool(messages, CONCURRENCY, async (message, i) => {
          const res = await fetch("/2-jev-and-gemini/demo7/api", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message, mode, threshold }),
          });
          const data = await res.json();
          if (data.error) return setError(data.error);
          setResults((r) => ({
            ...r,
            [mode]: r[mode].map((x, j) => (j === i ? data : x)),
          }));
        });
        setWall((w) => ({
          ...w,
          [mode]: Math.round(performance.now() - start),
        }));
      }),
    );
    setRunning(false);
  }

  const totals = {
    gemini: summarize(results.gemini),
    router: summarize(results.router),
  };
  const finished = wall.gemini !== null && wall.router !== null;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold">Demo 7 · Smart router: Jev triages, Gemini only when needed</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          The same support inbox, handled twice. On the left Gemini answers every message. On the right Jev classifies each one first: simple requests
          get a ready answer in a few hundred milliseconds, and only real problems reach Gemini. How much time and how many tokens do we save?
        </p>
      </header>

      <FlowDiagram
        wide={false}
        lanes={[
          {
            title: "Without classifier",
            columns: [[{ label: "Message" }], null, null, [{ label: "Gemini", note: "every message · seconds", kind: "gemini" }], [{ label: "Reply" }]],
          },
          {
            title: "With Jev router",
            accent: "jev",
            columns: [
              [{ label: "Message" }],
              [{ label: "Jev classifies", note: "~0.3 s · intent + P", kind: "jev" }],
              [{ label: `simple and\nP ≥ ${threshold.toFixed(2)}?`, kind: "code" }],
              [
                { label: "⚡ Template", note: "simple intents · 0 tokens", kind: "ok", via: "yes" },
                { label: "Gemini", note: "complex or uncertain", kind: "gemini", via: "no" },
              ],
              [{ label: "Reply" }],
            ],
          },
        ]}
        caption={
          <>
            Jev answers one <code>choice</code> question (greeting, order_status, password_reset, complex). The decision is in our code: a simple
            intent with a probability above the threshold gets a template; everything else goes to Gemini.
          </>
        }
      />

      {code}

      <div className="grid gap-4 md:grid-cols-[1fr_16rem]">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Support inbox, one message per line ({messages.length})
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            className="rounded-xl border border-zinc-300 bg-transparent p-3 font-mono text-xs font-normal dark:border-zinc-700"
          />
        </label>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Template only when P ≥ {threshold.toFixed(2)}
            <input
              type="range"
              min={0.5}
              max={0.99}
              step={0.01}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="accent-indigo-600"
            />
            <span className="text-xs font-normal text-zinc-500">Below the threshold Jev isn&apos;t sure enough, and the message goes to Gemini.</span>
          </label>
          <button
            onClick={run}
            disabled={running || !messages.length}
            className="rounded-full bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {running ? "Running…" : "Run both"}
          </button>
        </div>
      </div>

      {error && <p className="text-rose-600">{error}</p>}

      {finished && <Verdict gemini={totals.gemini} router={totals.router} wall={wall as Record<Mode, number>} count={messages.length} />}

      {results.gemini.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Column title="Gemini for everything" accent="sky" results={results.gemini} messages={messages} totals={totals.gemini} wall={wall.gemini} />
          <Column
            title="Jev router + Gemini"
            accent="indigo"
            results={results.router}
            messages={messages}
            totals={totals.router}
            wall={wall.router}
          />
        </div>
      )}
    </main>
  );
}

// ---------- Types ----------

type Mode = (typeof modes)[number];

// What the API route returns for one message.
interface Result {
  route: "template" | "gemini";
  reply: string;
  ms: number;
  jev: { intent: string; probability: number; ms: number } | null;
  gemini: { ms: number; tokens: number } | null;
}

interface Totals {
  done: number;
  geminiCalls: number;
  templates: number;
  tokens: number;
  avgMs: number;
}

// ---------- Logic ----------

function summarize(results: (Result | null)[]): Totals {
  const done = results.filter((r): r is Result => r !== null);
  return {
    done: done.length,
    geminiCalls: done.filter((r) => r.gemini).length,
    templates: done.filter((r) => r.route === "template").length,
    tokens: done.reduce((sum, r) => sum + (r.gemini?.tokens ?? 0), 0),
    avgMs: done.length ? Math.round(done.reduce((sum, r) => sum + r.ms, 0) / done.length) : 0,
  };
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

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

// ---------- UI ----------

function Verdict({ gemini, router, wall, count }: { gemini: Totals; router: Totals; wall: Record<Mode, number>; count: number }) {
  const faster = wall.gemini / Math.max(wall.router, 1);
  const tokensSaved = gemini.tokens ? Math.round((1 - router.tokens / gemini.tokens) * 100) : 0;
  return (
    <section className="grid gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-center sm:grid-cols-3 dark:border-indigo-900 dark:bg-indigo-950/40">
      <Stat value={`${faster.toFixed(1)}×`} label={`faster on the whole inbox (${seconds(wall.router)} vs ${seconds(wall.gemini)})`} />
      <Stat value={`${tokensSaved}%`} label={`fewer tokens (${router.tokens} vs ${gemini.tokens})`} />
      <Stat value={`${count - router.geminiCalls} / ${count}`} label="Gemini calls avoided" />
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-3xl font-semibold tabular-nums text-indigo-600 dark:text-indigo-400">{value}</div>
      <div className="text-xs text-zinc-600 dark:text-zinc-400">{label}</div>
    </div>
  );
}

function Column({
  title,
  accent,
  results,
  messages,
  totals,
  wall,
}: {
  title: string;
  accent: "sky" | "indigo";
  results: (Result | null)[];
  messages: string[];
  totals: Totals;
  wall: number | null;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className={`font-semibold ${accent === "sky" ? "text-sky-600 dark:text-sky-400" : "text-indigo-600 dark:text-indigo-400"}`}>{title}</h2>
        <span className="text-xs tabular-nums text-zinc-500">
          {wall !== null ? `done in ${seconds(wall)}` : `${totals.done} / ${messages.length}`}
        </span>
      </div>
      <dl className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg bg-zinc-100 p-2 dark:bg-zinc-900">
          <dt className="text-zinc-500">avg per message</dt>
          <dd className="text-base font-semibold tabular-nums">{seconds(totals.avgMs)}</dd>
        </div>
        <div className="rounded-lg bg-zinc-100 p-2 dark:bg-zinc-900">
          <dt className="text-zinc-500">Gemini calls</dt>
          <dd className="text-base font-semibold tabular-nums">{totals.geminiCalls}</dd>
        </div>
        <div className="rounded-lg bg-zinc-100 p-2 dark:bg-zinc-900">
          <dt className="text-zinc-500">tokens</dt>
          <dd className="text-base font-semibold tabular-nums">{totals.tokens}</dd>
        </div>
      </dl>
      <ol className="flex flex-col gap-2">
        {messages.map((m, i) => {
          const r = results[i];
          return (
            <li key={i} className="rounded-lg border border-zinc-200 p-2 text-sm dark:border-zinc-800">
              <div className="flex items-start justify-between gap-2">
                <span className="text-zinc-700 dark:text-zinc-300">{m}</span>
                {r ? <Badge result={r} /> : <span className="shrink-0 animate-pulse text-xs text-zinc-400">…</span>}
              </div>
              {r && <p className="mt-1 text-xs italic text-zinc-500">↳ {r.reply}</p>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Badge({ result }: { result: Result }) {
  const template = result.route === "template";
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs tabular-nums ${
        template
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
          : "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
      }`}
      title={result.jev ? `Jev: ${result.jev.intent} ${Math.round(result.jev.probability * 100)}% in ${result.jev.ms} ms` : undefined}
    >
      {template ? `⚡ ${result.jev?.intent}` : "🤖 Gemini"} · {result.ms} ms
    </span>
  );
}
