import Link from "next/link";
import { DemoNav } from "../_components/demo-nav";

// Every demo in this section gets a fixed back button to the home page, and arrows to the previous and next demo.
export default function Layout({ children }: LayoutProps<"/3-jev-images">) {
  return (
    <>
      <Link
        href="/"
        aria-label="Back to the demos"
        title="Back to the demos"
        className="fixed left-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 bg-white/90 text-lg text-zinc-700 shadow-sm backdrop-blur hover:border-indigo-500 hover:text-indigo-600 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-300"
      >
        ←
      </Link>
      <DemoNav />
      {children}
    </>
  );
}
