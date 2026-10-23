import Link from "next/link";

const groups = [
  {
    title: "Jev",
    demos: [
      { href: "/1-jev/demo1", title: "Demo 1 · One question", text: "Is this comment offensive? A single yes/no probability." },
      { href: "/1-jev/demo2", title: "Demo 2 · Choice, score and noul", text: "One question of each type, with the probability of every answer." },
      { href: "/1-jev/demo3", title: "Demo 3 · Moderation policy", text: "Risk signals, adjustable thresholds and a publish / review / reject decision." },
      { href: "/1-jev/demo4", title: "Demo 4 · CSV evaluation", text: "A CSV of comments with the expected decision: accuracy, confusion matrix and errors." },
    ],
  },
  {
    title: "Jev and Gemini",
    demos: [
      { href: "/2-jev-and-gemini/demo1", title: "Demo 1 · Gemini writes, Jev moderates", text: "Gemini generates a comment, Jev measures category and toxicity." },
      { href: "/2-jev-and-gemini/demo2", title: "Demo 2 · Gemini rewrites, Jev confirms", text: "A rude comment rewritten politely, with the offensive probability before and after." },
      { href: "/2-jev-and-gemini/demo3", title: "Demo 3 · Gemini proposes, Jev picks", text: "Three candidate replies, scored by Jev: our code picks the best one." },
      { href: "/2-jev-and-gemini/demo4", title: "Demo 4 · Jev vs Gemini on 20 websites", text: "Scrape 20 home pages and classify them with both models: time and agreement." },
      { href: "/2-jev-and-gemini/demo5", title: "Demo 5 · CSV evaluation: Jev vs Gemini", text: "The same CSV of comments, moderated by both models: accuracy and time side by side." },
    ],
  },
];

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
