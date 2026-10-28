import { useId } from "react";

// A small flow diagram, described as data: lanes of columns, each column with one or more nodes.
// Shared by the demos, so every page explains its process the same way.

export type Kind = "io" | "step" | "jev" | "gemini" | "code" | "ok" | "stop";

export interface FlowNode {
  label: string;
  note?: string;
  kind?: Kind;
  // a label on the incoming arrow, e.g. "yes" or "no" after a decision
  via?: string;
  // no outgoing arrow, e.g. a blocked request
  end?: boolean;
}

export interface Lane {
  title?: string;
  accent?: "jev" | "gemini";
  // null keeps the column empty, so lanes stay aligned: the arrow jumps to the next node
  columns: (FlowNode[] | null)[];
}

const W = 880;
const NODE_H = 52;
const CODE_H = 78;
const GAP = 14;

const kindClass: Record<Kind, string> = {
  io: "fill-zinc-50 stroke-zinc-400 dark:fill-zinc-900",
  step: "fill-zinc-100 stroke-zinc-400 dark:fill-zinc-800",
  jev: "fill-indigo-50 stroke-indigo-500 dark:fill-indigo-950",
  gemini: "fill-sky-50 stroke-sky-500 dark:fill-sky-950",
  code: "fill-white stroke-zinc-500 dark:fill-zinc-950",
  ok: "fill-emerald-50 stroke-emerald-500 dark:fill-emerald-950",
  stop: "fill-rose-50 stroke-rose-500 dark:fill-rose-950",
};

const icon: Partial<Record<Kind, string>> = { gemini: "🤖 " };

// wide: on a narrow page the diagram sticks out of the column; in a two-column layout it stays inside it.
export function FlowDiagram({ lanes, caption, wide = true }: { lanes: Lane[]; caption?: React.ReactNode; wide?: boolean }) {
  const arrow = useId();
  const columns = Math.max(...lanes.map((l) => l.columns.length));
  const colW = W / columns;
  const nodeW = Math.min(200, colW - 24);
  const { placed, height } = layout(lanes, colW);

  const line = "stroke-zinc-400 dark:stroke-zinc-500";

  return (
    // open by default; click the title to collapse it.
    // Wider than narrow pages, centered on them, so the text stays readable; full width on wide pages.
    <details
      open
      className={`group rounded-xl border border-zinc-200 p-4 dark:border-zinc-800 ${wide ? "relative left-1/2 w-[max(100%,min(60rem,calc(100vw-2rem)))] -translate-x-1/2" : ""}`}
    >
      <summary className="cursor-pointer list-none select-none text-sm font-semibold text-zinc-600 dark:text-zinc-400 [&::-webkit-details-marker]:hidden">
        <span className="inline-block transition-transform group-open:rotate-90">▸</span> How it works
      </summary>
      <figure className="mt-3">
        <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="img" aria-label="Flow diagram of the demo">
          <defs>
            <marker id={arrow} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" className="fill-zinc-400 dark:fill-zinc-500" />
            </marker>
          </defs>

          {placed.map(({ lane, y, nodes }, l) => (
            <g key={l}>
              {l > 0 && <line x1="0" y1={y - 18} x2={W} y2={y - 18} className="stroke-zinc-200 dark:stroke-zinc-800" strokeDasharray="4 4" />}
              {lane.title && (
                <text
                  x="0"
                  y={y + 14}
                  className={`text-[12px] font-semibold uppercase tracking-wider ${
                    lane.accent === "jev" ? "fill-indigo-500" : lane.accent === "gemini" ? "fill-sky-500" : "fill-zinc-500"
                  }`}
                >
                  {lane.title}
                </text>
              )}

              {/* arrows between consecutive non-empty columns: one to one when they have the same size, otherwise fan out / in */}
              {nodes.map((from, c) => {
                if (!from) return null;
                const next = nodes.slice(c + 1).find(Boolean);
                if (!next) return null;
                const pairs =
                  from.length === next.length && from.length > 1
                    ? from.map((f, i) => [f, next[i]] as const)
                    : from.flatMap((f) => next.map((t) => [f, t] as const));
                return pairs
                  .filter(([f]) => !f.end)
                  .map(([f, t], i) => {
                    const x1 = f.cx + nodeW / 2;
                    const x2 = t.cx - nodeW / 2 - 2;
                    const xm = x2 - 22;
                    const d = f.cy === t.cy ? `M${x1},${f.cy} L${x2},${t.cy}` : `M${x1},${f.cy} L${xm},${f.cy} L${xm},${t.cy} L${x2},${t.cy}`;
                    return (
                      <g key={`${c}-${i}`}>
                        <path d={d} fill="none" className={line} markerEnd={`url(#${arrow})`} />
                        {t.via && (
                          <text
                            x={xm + 4}
                            y={t.cy - 6}
                            className={`text-[11px] font-semibold ${t.kind === "stop" ? "fill-rose-600 dark:fill-rose-400" : "fill-emerald-600 dark:fill-emerald-400"}`}
                          >
                            {t.via}
                          </text>
                        )}
                      </g>
                    );
                  });
              })}

              {nodes.flat().map((n, i) => n && <Node key={i} node={n} w={nodeW} big={!wide} />)}
            </g>
          ))}
        </svg>
        {caption && <figcaption className="mt-2 text-xs text-zinc-500">{caption}</figcaption>}
      </figure>
    </details>
  );
}

const heightOf = (n: FlowNode) => (n.kind === "code" ? CODE_H : NODE_H);

// Vertical layout: each lane is as tall as its tallest column, and each column is centered in it.
function layout(lanes: Lane[], colW: number) {
  // a small margin, so the strokes on the top edge are not cut
  let y = 3;
  const placed = lanes.map((lane) => {
    const titleH = lane.title ? 30 : 0;
    const colHeight = (col: FlowNode[] | null) => (col ? col.reduce((h, n) => h + heightOf(n), 0) + (col.length - 1) * GAP : 0);
    const laneH = Math.max(...lane.columns.map(colHeight));
    const top = y + titleH;
    const nodes = lane.columns.map((col, c) => {
      if (!col) return null;
      let ny = top + (laneH - colHeight(col)) / 2;
      return col.map((n) => {
        const h = heightOf(n);
        const box = { ...n, cx: colW * (c + 0.5), cy: ny + h / 2, h };
        ny += h + GAP;
        return box;
      });
    });
    const out = { lane, y, nodes };
    y = top + laneH + 36;
    return out;
  });
  return { placed, height: y - 36 + 6 };
}

// big: larger text when the diagram sits in a column, scaled down with the page
function Node({ node, w, big }: { node: FlowNode & { cx: number; cy: number; h: number }; w: number; big: boolean }) {
  const { cx, cy, h, kind = "io" } = node;
  const label = `fill-zinc-800 font-medium dark:fill-zinc-100 ${big ? "text-[15px]" : "text-[13px]"}`;
  const note = `fill-zinc-500 ${big ? "text-[12.5px]" : "text-[11px]"}`;
  // the label can span two lines with "\n" (useful inside a decision)
  const lines = `${icon[kind] ?? ""}${node.label}`.split("\n");
  const textTop = cy - ((lines.length - 1) * 16 + (node.note ? 17 : 0)) / 2 + 4;

  return (
    <g>
      {kind === "code" ? (
        <polygon
          points={`${cx},${cy - h / 2} ${cx + w / 2},${cy} ${cx},${cy + h / 2} ${cx - w / 2},${cy}`}
          className={`stroke-[1.5] ${kindClass[kind]}`}
        />
      ) : (
        <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx="10" className={`stroke-[1.5] ${kindClass[kind]}`} />
      )}
      {lines.map((t, i) => (
        <text key={i} x={cx} y={textTop + i * 16} textAnchor="middle" className={label}>
          {t}
        </text>
      ))}
      {node.note && (
        <text x={cx} y={textTop + (lines.length - 1) * 16 + 17} textAnchor="middle" className={note}>
          {node.note}
        </text>
      )}
    </g>
  );
}
