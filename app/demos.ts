// Every demo, in talk order: the home page lists them, the arrows on each demo walk through them.
export const groups = [
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
      { href: "/2-jev-and-gemini/demo1", title: "Demo 1 · Gemini rewrites, Jev confirms", text: "A rude comment rewritten politely, with the offensive probability before and after." },
      { href: "/2-jev-and-gemini/demo2", title: "Demo 2 · Gemini replies, Jev evaluates", text: "Gemini answers a support request, Jev measures relevance and tone of the reply." },
      { href: "/2-jev-and-gemini/demo3", title: "Demo 3 · Gemini proposes, Jev picks", text: "Three candidate replies, scored by Jev: our code picks the best one." },
      { href: "/2-jev-and-gemini/demo4", title: "Demo 4 · Email to Data", text: "Gemini turns an email into structured data; an email with hidden instructions for the AI is blocked by Jev first, with a guardrail toggle and threshold." },
      { href: "/2-jev-and-gemini/demo5", title: "Demo 5 · Jev vs Gemini on 20 websites", text: "Scrape 20 home pages and classify them with both models: time and agreement." },
      { href: "/2-jev-and-gemini/demo6", title: "Demo 6 · CSV evaluation: Jev vs Gemini", text: "The same CSV of comments, moderated by both models: accuracy and time side by side." },
      { href: "/2-jev-and-gemini/demo7", title: "Demo 7 · Smart router", text: "A support inbox: Jev triages every message, simple requests get a template, only real problems reach Gemini. Time and tokens saved." },
    ],
  },
  {
    title: "Jev and images",
    demos: [
      { href: "/3-jev-images/demo1", title: "Demo 1 · Where is it, and what is it?", text: "A box around the main subject of a photo, with its label and probability." },
    ],
  },
];

// all the demos in a row, with the title of their section
export const allDemos = groups.flatMap((g) => g.demos.map((d) => ({ ...d, section: g.title })));
