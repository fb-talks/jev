"use client";

import { useState } from "react";
import { ModelButtons, ModelRows } from "../model-buttons";
import { models, type Usage } from "../models";
import { useAnswers } from "../use-answers";

type Result = { question: string; offensive: number; usage: Usage };

// The interactive part of the demo; the code panel comes from the server, already highlighted.
export default function Demo1({ code }: { code: React.ReactNode }) {
  const [text, setText] = useState("Who taught you to code? Useless post.");
  const { rows, run, reset, busy } = useAnswers<Result>("/1-jev/demo1/api");
  const question = models.map((m) => rows[m.id]?.result?.question).find(Boolean);

  return (
    // talk layout, one column: what it does, the code, the live demo
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold">Demo 1 · Is this comment offensive?</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          One comment, one yes/no question: Jev and Gemini Decision return the probability that the answer is yes, an LLM has to write it.
        </p>
      </header>

      {code}

      <section className="flex flex-col gap-4">
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            reset();
          }}
          disabled={busy}
          rows={3}
          className="rounded-xl border border-zinc-300 bg-transparent p-3 dark:border-zinc-700"
        />

        <ModelButtons onRun={(m) => run(m, text)} disabled={(m) => Boolean(rows[m]?.running) || !text.trim()} />

        {question && <p className="text-sm italic text-zinc-500">&ldquo;{question}&rdquo;</p>}

        <ModelRows rows={rows}>
          {(result) => (
            <span className="text-lg">
              Offensive: <strong>{Math.round(result.offensive * 100)}%</strong>
            </span>
          )}
        </ModelRows>
      </section>
    </main>
  );
}
