import { box, choice, image, noul, TypeSafeClient } from "@typesafe-ai/sdk";

const labels = {
  dog: null,
  cat: null,
  bird: null,
  person: null,
  car: null,
  food: null,
  plant: null,
  other: null,
};

// Demo 1: one photo and a prompt. Is it there, where is it, and what is it?
export async function POST(request: Request) {
  const form = await request.formData();
  const photo = form.get("photo");
  const prompt = String(form.get("prompt") ?? "").trim();
  const target = prompt || "The main subject of the image";

  if (!(photo instanceof File)) {
    return Response.json({ error: "Choose a photo." }, { status: 400 });
  }

  // the prompt goes into all three questions
  const questions = {
    // found: a box always comes back, even when the target isn't there, so we ask too
    found: noul(`The image contains: ${target}`),
    // where: the smallest rectangle around the target, edges from 0 to 1
    where: box(target),
    // what: one label from the list, used only when there's no prompt
    what: choice(`What is this: ${target}?`, labels),
  };

  try {
    const jev = new TypeSafeClient({
      apiKey: process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_OIDC_TOKEN,
      baseURL: "https://ai-gateway.vercel.sh/typesafe",
      defaultModel: "typesafe-ai/jev",
      // images are still experimental: opt in with this header
      defaultHeaders: { "TypeSafe-Danger-Zone-Images": "true" },
    });

    // the photo is the state: every question looks at it
    // the stopwatch covers only Jev's call, not the upload from the browser
    const start = performance.now();
    const { answers } = await jev.systemOne({ state: image(photo), questions });
    const ms = Math.round(performance.now() - start);

    return Response.json({
      found: answers.found.noul,
      box: answers.where.box,
      confidence: answers.where.confidence,
      // with a prompt the label is the prompt itself, and its probability is "found";
      // without one, Jev picks the label from the list
      label: prompt || answers.what.choice,
      probability: prompt ? answers.found.noul : answers.what.probabilities[answers.what.choice],
      ms,
    });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: `AI call failed: ${message}` }, { status: 502 });
  }
}
