import type { Usage } from "./models";

// Shown at the end of every answer: the time of the model call and the tokens it used.
export function UsageLine({ usage }: { usage: Usage }) {
  return (
    <span className="text-sm tabular-nums text-zinc-500">
      <strong className="text-zinc-900 dark:text-zinc-100">{usage.ms} ms</strong> ·{" "}
      <strong className="text-zinc-900 dark:text-zinc-100">{usage.inputTokens + usage.outputTokens} tokens</strong> ({usage.inputTokens} in /{" "}
      {usage.outputTokens} out{usage.reasoningTokens > 0 && `, ${usage.reasoningTokens} of them thinking`})
    </span>
  );
}
