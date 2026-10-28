import Link from "next/link";
import { groups } from "./demos";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10">
      <h1 className="text-2xl font-semibold">Comment moderation with Jev</h1>
      {groups.map((g) => (
        <section key={g.title} className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{g.title}</h2>
          <ul className="flex flex-col gap-3">
            {g.demos.map((d) => (
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
        </section>
      ))}
    </main>
  );
}
