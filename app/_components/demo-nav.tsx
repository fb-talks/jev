"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { allDemos } from "../demos";

// Arrows on the sides of every demo, vertically centered, to the previous and the next demo in talk order.
export function DemoNav() {
  const pathname = usePathname();
  const i = allDemos.findIndex((d) => d.href === pathname);
  if (i < 0) return null;
  const prev = allDemos[i - 1];
  const next = allDemos[i + 1];

  return (
    <>
      {prev && <Arrow demo={prev} side="left" />}
      {next && <Arrow demo={next} side="right" />}
    </>
  );
}

function Arrow({ demo, side }: { demo: (typeof allDemos)[number]; side: "left" | "right" }) {
  const label = `${side === "left" ? "Previous" : "Next"}: ${demo.section} · ${demo.title}`;
  return (
    <Link
      href={demo.href}
      aria-label={label}
      title={label}
      className={`fixed top-1/2 z-50 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-300 bg-white/90 text-2xl text-zinc-700 shadow-sm backdrop-blur hover:border-indigo-500 hover:text-indigo-600 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-300 ${
        side === "left" ? "left-4" : "right-4"
      }`}
    >
      {side === "left" ? "‹" : "›"}
    </Link>
  );
}
