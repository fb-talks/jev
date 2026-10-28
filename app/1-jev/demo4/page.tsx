import { CodePanel, type Snippet } from "../../_components/code";
import Demo4 from "./demo";

// A server component: it highlights the key code with Shiki, the interactive demo is in demo.tsx.
export default function Page() {
  return <Demo4 code={<CodePanel snippets={snippets} />} />;
}

// What the page does, simplified for the talk: the full version is in demo.tsx.
const snippets: Snippet[] = [
  {
    title: "1 · One call to Jev per row, a few at a time",
    code: `// comment,expected
// "Great post, thanks!",publish
const rows = parseRows(csv);

// 5 calls at a time: fast, without flooding the Gateway
await runPool(rows, 5, async (row) => {
  const res = await fetch("/1-jev/demo4/api", {
    method: "POST",
    body: JSON.stringify({ text: row.comment }),
  });
  row.result = await res.json(); // the same questions as demo 3
});`,
  },
  {
    title: "2 · Our decision vs the expected one",
    code: `// the policy of demo 3, applied to every row
const scored = rows.map((r) => ({ ...r, decision: decide(r.result.answers, thresholds).decision }));

const correct = scored.filter((r) => r.decision === r.expected).length;
const accuracy = correct / scored.length; // e.g. 0.87

// all in the browser: moving the thresholds recomputes it, with no new call to Jev`,
  },
];
