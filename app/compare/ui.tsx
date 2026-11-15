import { models, type Model } from "./models";

// Shared by the compare demos: the price list, the model kind badge, the dollar format.

// The price list, in plain sight: what each model charges and on which tokens.
export function Pricing() {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">How the cost is calculated</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {models.map((m) => (
          <div key={m.id} className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-4 text-sm dark:border-zinc-800">
            <div className="font-semibold">
              {m.name}
              <Kind model={m} />
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <dt className="text-zinc-500">Input</dt>
              <dd className="text-right font-mono">${m.input} / 1M</dd>
              <dt className="text-zinc-500">Output</dt>
              <dd className="text-right font-mono">{m.output ? `$${m.output} / 1M` : "$0 · none"}</dd>
            </dl>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">{m.billing}</p>
            <p className="mt-auto rounded-lg bg-zinc-50 p-2 font-mono text-xs dark:bg-zinc-900">
              cost = in × {m.input}
              {m.output ? ` + out × ${m.output}` : ""} / 1M
            </p>
          </div>
        ))}
      </div>
      <p className="text-xs text-zinc-500">
        USD per million tokens, paid tier, standard requests (no batch, no cache). Sources: Google AI Studio pricing and the Vercel AI Gateway
        price list, November 2026.
      </p>
    </section>
  );
}

export function Kind({ model }: { model: Model }) {
  const decision = model.kind === "decision";
  return (
    <span
      className={`ml-2 rounded-full px-2 py-0.5 align-middle text-[10px] font-medium uppercase tracking-wide ${
        decision ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" : "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
      }`}
    >
      {decision ? "decision" : "text LLM"}
    </span>
  );
}

// small amounts need more decimals: $0.0000123
export function usd(n: number) {
  if (n === 0) return "$0";
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toPrecision(3)}`;
}
