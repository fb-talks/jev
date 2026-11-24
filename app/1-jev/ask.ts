import { decide, generate, jsonSchema, type Questions } from "@/lib/gemini";
import { jevClient, type ApiKeys } from "@/lib/keys";
import { llmThinking, type ChoiceAnswer, type Model, type NoulAnswer, type ScoreAnswer, type Usage } from "./models";

// Server only, shared by the API routes of demos 2 and 3: the questions are written once, with the
// TypeSafe helpers (noul, choice, score), and every model answers the same ones, in the same shape.
type Answer = ChoiceAnswer | ScoreAnswer | NoulAnswer;
type Reply = { model: string; answers: Record<string, Answer>; usage: Usage };

export async function ask(keys: ApiKeys, m: Model, text: string, questions: Questions): Promise<Reply> {
  const start = performance.now();
  const ms = () => Math.round(performance.now() - start);

  if (m.kind === "jev") {
    const { model, answers, usage } = await jevClient(keys).systemOne({ state: text, questions });
    return {
      model,
      answers: answers as unknown as Record<string, Answer>,
      usage: { ms: ms(), inputTokens: usage.input_tokens ?? 0, outputTokens: usage.output_tokens ?? 0, reasoningTokens: 0 },
    };
  }

  if (m.kind === "decision") {
    // the same questions as Jev, without any conversion
    const { answers, tokens } = await decide(keys, { model: m.model, input: text, questions });
    const time = ms();
    return {
      model: m.model,
      answers: mapValues(questions, (q, id) => {
        const a = answers[id] as Answer;
        // the options in the order of the question: the API sorts them
        return q.type === "choice" && "choice" in a ? { ...a, probabilities: mapValues(q.criteria, (_, k) => a.probabilities[k] ?? 0) } : a;
      }),
      usage: { ms: time, ...tokens },
    };
  }

  // an LLM: the same questions in the prompt, the probabilities written as JSON
  const { output, tokens } = await generate(keys, {
    model: m.model,
    thinking: llmThinking,
    instructions: `Answer these questions about the text. Every probability goes from 0 to 1; the probabilities of one question sum to 1.\n\n${Object.entries(questions).map(toPrompt).join("\n\n")}`,
    prompt: text,
    schema: toSchema(questions),
  });
  const time = ms();
  return {
    model: m.model,
    answers: mapValues(questions, (q, id) => {
      const written = output[id];
      if (typeof written === "number") return { noul: written };
      // level_0, level_1… back to 0, 1…
      return fromProbabilities(q, Object.fromEntries(Object.entries(written).map(([k, v]) => [q.type === "score" ? k.replace("level_", "") : k, v])));
    }),
    usage: { ms: time, ...tokens },
  };
}

// ---------- LLM ----------

// What each question asks the LLM to write: one number for a noul, one per option or level otherwise.
function outcomes(q: Questions[string]): [string, string][] {
  if (q.type === "choice") return Object.entries(q.criteria).map(([k, v]) => [k, String(v)]);
  if (q.type === "score") return q.criteria.map((level, i) => [`level_${i}`, String(level)]);
  return [];
}

function toPrompt([id, q]: [string, Questions[string]]) {
  if (q.type === "noul") return `${id}: the probability that this is true: "${q.instructions}".`;
  return `${id}: ${q.instructions} The probability of each:\n${outcomes(q).map(([k, v]) => `- ${k}: ${v}`).join("\n")}`;
}

function toSchema(questions: Questions) {
  const probability = { type: "number", minimum: 0, maximum: 1 } as const;
  const object = (properties: Record<string, object>) =>
    ({ type: "object", properties, required: Object.keys(properties), additionalProperties: false }) as const;
  return jsonSchema<Record<string, number | Record<string, number>>>(
    object(mapValues(questions, (q) => (q.type === "noul" ? probability : object(Object.fromEntries(outcomes(q).map(([k]) => [k, probability])))))),
  );
}

// ---------- Shared ----------

// From the probabilities to the rest of the answer: the score is the weighted average of the levels.
function fromProbabilities(q: Questions[string], raw: Record<string, number>): Answer {
  // an LLM doesn't always write numbers that sum to 1
  const sum = Object.values(raw).reduce((a, b) => a + b, 0);
  if (!(sum > 0)) throw new Error("The model returned no usable probabilities");
  // in the order of the question: not every model keeps it
  const keys = q.type === "choice" ? Object.keys(q.criteria) : Object.keys(raw);
  const probabilities = Object.fromEntries(keys.map((k) => [k, (raw[k] ?? 0) / sum]));
  const [top] = Object.entries(probabilities).reduce((a, b) => (b[1] > a[1] ? b : a));
  if (q.type === "score") {
    return {
      score: Object.entries(probabilities).reduce((s, [level, p]) => s + Number(level) * p, 0),
      probabilities,
      legend: Object.fromEntries(q.criteria.map((level, i) => [String(i), String(level)])),
    };
  }
  return { choice: top, probabilities };
}

function mapValues<V, R>(record: Record<string, V>, fn: (value: V, key: string) => R): Record<string, R> {
  return Object.fromEntries(Object.entries(record).map(([k, v]) => [k, fn(v, k)]));
}
