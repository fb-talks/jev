"use client";

import { useState } from "react";

// The interactive part of the demo; the code panel comes from the server, already highlighted.
export default function Demo1({ code }: { code: React.ReactNode }) {
  const [text, setText] = useState("Who taught you to code? Useless post.");
  const [offensive, setOffensive] = useState<number | null>(null);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    const res = await fetch("/1-jev/demo1/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();

    setError(data.error ?? null);
    setOffensive(data.offensive ?? null);
    setQuestion(data.question ?? "");
  }

  return (
    // talk layout, one column: what it does, the code, the live demo
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold">Demo 1 · Is this comment offensive?</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          One comment, one yes/no question: Jev returns the probability that the answer is yes.
        </p>
      </header>

      {code}

      <section className="flex flex-col gap-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="rounded-xl border border-zinc-300 bg-transparent p-3 dark:border-zinc-700"
        />

        <button onClick={analyze} className="self-start rounded-full bg-indigo-600 px-5 py-2 text-white">
          Analyze
        </button>

        {error && <p className="text-rose-600">{error}</p>}
        {offensive !== null && (
          <>
            <p className="text-sm italic text-zinc-500">&ldquo;{question}&rdquo;</p>
            <p className="text-lg">
              Offensive: <strong>{Math.round(offensive * 100)}%</strong>
            </p>
          </>
        )}
      </section>
    </main>
  );
}
