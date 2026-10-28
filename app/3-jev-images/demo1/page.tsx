import { CodePanel, type Snippet } from "../../_components/code";
import Demo1 from "./demo";

// A server component: it highlights the key code with Shiki, the interactive demo is in demo.tsx.
export default function Page() {
  return <Demo1 code={<CodePanel snippets={snippets} />} />;
}

// What the API route and the page do, simplified for the talk: the full versions are in api/route.ts and demo.tsx.
const snippets: Snippet[] = [
  {
    title: "1 · Three questions on the same photo",
    code: `import { box, choice, image, noul } from "@typesafe-ai/sdk";

const target = prompt || "The main subject of the image";

const questions = {
  // is it there? a box always comes back, even when the target isn't in the photo
  found: noul(\`The image contains: \${target}\`),
  // where is it? the smallest rectangle around it, edges from 0 to 1
  where: box(target),
  // what is it? one label from the list
  what: choice(\`What is this: \${target}?\`, { dog: null, cat: null, person: null, car: null, other: null }),
};`,
  },
  {
    title: "2 · The photo is the state",
    code: `const jev = new TypeSafeClient({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: "https://ai-gateway.vercel.sh/typesafe",
  defaultModel: "typesafe-ai/jev",
  // images are still experimental: opt in with this header
  defaultHeaders: { "TypeSafe-Danger-Zone-Images": "true" },
});

const { answers } = await jev.systemOne({ state: image(photo), questions });

answers.found.noul;  // 0.97
answers.where.box;   // { top: 0.18, left: 0.31, bottom: 0.92, right: 0.74 }
answers.what.choice; // "dog"`,
  },
  {
    title: "3 · Drawing the box",
    lang: "tsx",
    code: `// fractions of the image: as percentages they work at any size
<div
  className={found >= 0.5 ? "border-indigo-500" : "border-dashed"} // below 50%: only a guess
  style={{
    top: \`\${box.top * 100}%\`,
    left: \`\${box.left * 100}%\`,
    width: \`\${(box.right - box.left) * 100}%\`,
    height: \`\${(box.bottom - box.top) * 100}%\`,
  }}
/>`,
  },
];
