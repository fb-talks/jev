"use client";

import { useState } from "react";

const samples = ["/samples/dog.jpg", "/samples/pug.jpg", "/samples/cars.jpg", "/samples/objects.jpg"];

interface Result {
  found: number;
  box: { top: number; bottom: number; left: number; right: number };
  confidence: number | null;
  label: string;
  probability: number;
  ms: number;
}

export default function Demo1() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function choose(file: File | undefined) {
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  }

  async function chooseSample(url: string) {
    const blob = await (await fetch(url)).blob();
    choose(new File([blob], url, { type: blob.type }));
  }

  async function analyze() {
    if (!photo) return;
    setLoading(true);
    const form = new FormData();
    form.append("photo", photo);
    form.append("prompt", prompt);
    const res = await fetch("/3-jev-images/demo1/api", { method: "POST", body: form });
    const data = await res.json();

    setError(data.error ?? null);
    setResult(data.error ? null : data);
    setLoading(false);
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-10">
      <h1 className="text-2xl font-semibold">Demo 1 · Where is it, and what is it?</h1>

      <div className="flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-full border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900">
          Upload photo
          <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => choose(e.target.files?.[0])} />
        </label>
        {samples.map((url) => (
          <button key={url} onClick={() => chooseSample(url)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-10 w-14 rounded-md object-cover hover:ring-2 hover:ring-indigo-500" />
          </button>
        ))}
        <span className="text-xs text-zinc-500">PNG or JPEG, 280–1568 px per side</span>
      </div>

      {preview && (
        <div className="relative self-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="max-h-[480px] rounded-xl" />

          {result && (
            // the edges are fractions of the image: as percentages they work at any size
            <div
              className={`absolute rounded-md border-4 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] ${
                // below 50% the target is probably not there: the box is only a guess
                result.found >= 0.5 ? "border-indigo-500" : "border-dashed border-zinc-400"
              }`}
              style={{
                top: `${result.box.top * 100}%`,
                left: `${result.box.left * 100}%`,
                width: `${(result.box.right - result.box.left) * 100}%`,
                height: `${(result.box.bottom - result.box.top) * 100}%`,
              }}
            >
              <span className="absolute -top-8 left-0 whitespace-nowrap rounded-full bg-indigo-600 px-3 py-1 text-sm font-medium text-white">
                {result.found >= 0.5 ? `${result.label} · ${Math.round(result.probability * 100)}%` : "not found"}
              </span>
            </div>
          )}
        </div>
      )}

      {preview && (
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="What should Jev find? Empty: the main subject"
          className="rounded-xl border border-zinc-300 bg-transparent p-3 dark:border-zinc-700"
        />
      )}

      {preview && (
        <button
          onClick={analyze}
          disabled={loading}
          className="self-start rounded-full bg-indigo-600 px-5 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Looking…" : "Find it"}
        </button>
      )}

      {error && <p className="text-rose-600">{error}</p>}
      {result && (
        <p className="text-sm text-zinc-500">
          Time: <strong>{result.ms} ms</strong> · Found: <strong>{Math.round(result.found * 100)}%</strong> · Box confidence: <strong>{result.confidence === null ? "n/a" : `${Math.round(result.confidence * 100)}%`}</strong>
        </p>
      )}
    </main>
  );
}
