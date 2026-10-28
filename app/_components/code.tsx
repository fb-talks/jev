import { codeToHtml } from "shiki";

// The key code of a demo, shown next to it during the talk: a few simplified snippets, not the whole file.
// A server component: Shiki colors the code on the server, so the browser gets plain HTML, without the highlighter.

export interface Snippet {
  title: string;
  code: string;
  // "tsx" for snippets with JSX
  lang?: "ts" | "tsx";
}

export async function CodePanel({ snippets }: { snippets: Snippet[] }) {
  const html = await Promise.all(snippets.map((s) => highlight(s.code, s.lang)));

  return (
    // closed by default; click the title to open it
    <details className="group rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <summary className="cursor-pointer list-none select-none text-sm font-semibold text-zinc-600 dark:text-zinc-400 [&::-webkit-details-marker]:hidden">
        <span className="inline-block transition-transform group-open:rotate-90">▸</span> Code
      </summary>
      <div className="mt-3 flex flex-col gap-3">
        {snippets.map((s, i) => (
          <div key={s.title}>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">{s.title}</h4>
            {/* our own snippets, highlighted by Shiki: safe to inject */}
            <div
              className="overflow-hidden rounded-lg bg-zinc-100 text-[13px] leading-relaxed dark:bg-zinc-900 [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_pre]:p-3 [&_span]:text-(--shiki-light) dark:[&_span]:text-(--shiki-dark)"
              dangerouslySetInnerHTML={{ __html: html[i] }}
            />
          </div>
        ))}
      </div>
    </details>
  );
}

// Cached: the snippets never change, and Shiki reads the current time inside, which Cache Components
// doesn't allow while prerendering. Two themes in the same HTML, as CSS variables: the classes above pick one.
async function highlight(code: string, lang: "ts" | "tsx" = "ts") {
  "use cache";
  return codeToHtml(code, { lang, themes: { light: "github-light", dark: "github-dark" }, defaultColor: false });
}
