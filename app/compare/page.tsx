import Link from "next/link";
import { groups } from "../demos";

// The compare section: Jev and the Gemini models side by side, task by task.
export default function Page() {
  const demos = groups.find((g) => g.title === "Compare")!.demos;
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold">Compare · Jev vs Gemini</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          The same task for Jev, Gemini Decision, Gemini Flash and Flash Lite: time, tokens and an estimate of the cost.
        </p>
      </header>
      <ul className="flex flex-col gap-3">
        {demos.map((d) => (
          <li key={d.href}>
            <Link
              href={d.href}
              className="block rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            >
              <span className="font-semibold">{d.title}</span>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{d.text}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
