"use client";

import { useState } from "react";
import { llmThinking, models, type ModelId, type Usage } from "./models";
import { UsageLine } from "./usage-line";
import type { Row } from "./use-answers";

const llms = models.filter((m) => m.kind === "llm");
const button = "rounded-full px-5 py-2 text-white disabled:opacity-50";

// The three buttons of the demos: Jev, Gemini Decision, and the LLM picked in the menu.
export function ModelButtons({ onRun, disabled }: { onRun: (model: ModelId) => void; disabled: (model: ModelId) => boolean }) {
  const [llm, setLlm] = useState<ModelId>(llms[0].id);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button onClick={() => onRun("jev")} disabled={disabled("jev")} className={`${button} bg-indigo-600 hover:bg-indigo-500`}>
        Jev
      </button>
      <button
        onClick={() => onRun("gemini-decision")}
        disabled={disabled("gemini-decision")}
        className={`${button} bg-indigo-600 hover:bg-indigo-500`}
      >
        Gemini Decision
      </button>
      <div className="flex items-center gap-2">
        <button onClick={() => onRun(llm)} disabled={disabled(llm)} className={`${button} bg-sky-600 hover:bg-sky-500`}>
          LLM
        </button>
        <select
          value={llm}
          onChange={(e) => setLlm(e.target.value as ModelId)}
          aria-label="LLM to compare"
          className="rounded-full border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          {llms.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// One row per model that answered: time and tokens side by side. With onSelect, a click shows its answer below.
export function ModelRows<R extends { usage: Usage }>({
  rows,
  selected,
  onSelect,
  children,
}: {
  rows: Partial<Record<ModelId, Row<R>>>;
  selected?: ModelId;
  onSelect?: (model: ModelId) => void;
  children?: (result: R) => React.ReactNode;
}) {
  const shown = models.filter((m) => rows[m.id]);
  if (shown.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {shown.map((m) => {
        const row = rows[m.id]!;
        const active = onSelect && selected === m.id;
        const content = (
          <>
            <span className="flex flex-wrap items-baseline justify-between gap-x-3">
              <strong className="font-semibold">{m.name}</strong>
              <span className="text-xs text-zinc-500">{m.kind === "llm" ? `text LLM · thinking: ${llmThinking}` : "decision model"}</span>
            </span>
            {row.running && <span className="text-zinc-500">Analyzing…</span>}
            {row.error && <span className="text-rose-600">{row.error}</span>}
            {row.result && (
              <>
                {children?.(row.result)}
                <UsageLine usage={row.result.usage} />
              </>
            )}
          </>
        );
        const className = `flex flex-col gap-1 rounded-xl border p-4 text-left ${
          active ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20" : "border-zinc-200 dark:border-zinc-800"
        }`;
        return onSelect ? (
          <button key={m.id} onClick={() => onSelect(m.id)} aria-pressed={active} className={`${className} hover:border-indigo-400`}>
            {content}
          </button>
        ) : (
          <div key={m.id} className={className}>
            {content}
          </div>
        );
      })}
      <p className="text-xs text-zinc-500">
        Time measured on the server, around the model call only.{onSelect && shown.length > 1 && " Click a model to see its answer."}
      </p>
    </div>
  );
}
