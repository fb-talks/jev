"use client";

import { useState } from "react";
import { models, type ModelId } from "./models";

export type Row<R> = { running?: boolean; result?: R; error?: string };

// One answer per model for the current comment; R is what the API route of the demo returns.
export function useAnswers<R>(url: string) {
  const [rows, setRows] = useState<Partial<Record<ModelId, Row<R>>>>({});
  const [selected, setSelected] = useState<ModelId>("jev"); // the model whose answer is on screen

  async function run(model: ModelId, text: string) {
    const update = (row: Row<R>) => setRows((rs) => ({ ...rs, [model]: row }));
    setSelected(model);
    update({ running: true });
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, model }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      update({ result: data });
    } catch (e) {
      update({ error: e instanceof Error ? e.message : String(e) });
    }
  }

  return {
    rows,
    run,
    selected,
    setSelected,
    reset: () => setRows({}), // a new comment: the old answers are about the old one
    busy: models.some((m) => rows[m.id]?.running), // while a model answers, the comment can't change
  };
}
