"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { GATEWAY_COOKIE, TYPESAFE_COOKIE } from "@/lib/key-cookies";

type Keys = { typesafe: string; gateway: string };

const STORAGE = { typesafe: "jev.typesafeKey", gateway: "jev.gatewayKey" } as const;
const COOKIE = { typesafe: TYPESAFE_COOKIE, gateway: GATEWAY_COOKIE } as const;
const CHANGE = "jev-keys-change";

function read(name: keyof Keys) {
  try {
    return localStorage.getItem(STORAGE[name]) ?? "";
  } catch {
    return "";
  }
}

// re-render when the keys change here or in another tab
function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// localStorage is the source of truth; the cookies are its copy, sent with every API call.
function persist(keys: Keys) {
  const secure = location.protocol === "https:" ? "; secure" : "";
  for (const name of ["typesafe", "gateway"] as const) {
    const value = keys[name].trim();
    try {
      if (value) localStorage.setItem(STORAGE[name], value);
      else localStorage.removeItem(STORAGE[name]);
    } catch {}
    document.cookie = value
      ? `${COOKIE[name]}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=strict${secure}`
      : `${COOKIE[name]}=; path=/; max-age=0`;
  }
  window.dispatchEvent(new Event(CHANGE));
}

// A 🔑 button on every page: whoever tries the demos can use their own TypeSafe or Vercel key.
export function ApiKeysPanel() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Keys>({ typesafe: "", gateway: "" });
  const [show, setShow] = useState(false);
  const saved: Keys = {
    typesafe: useSyncExternalStore(subscribe, () => read("typesafe"), () => ""),
    gateway: useSyncExternalStore(subscribe, () => read("gateway"), () => ""),
  };

  // on load, copy the saved keys into the cookies again (they may have expired or been cleared)
  useEffect(() => persist({ typesafe: read("typesafe"), gateway: read("gateway") }), []);

  const save = (keys: Keys) => {
    const clean = { typesafe: keys.typesafe.trim(), gateway: keys.gateway.trim() };
    persist(clean);
    setDraft(clean);
  };

  // the same choice lib/keys.ts makes on the server
  const custom = Boolean(saved.typesafe || saved.gateway);
  const jev = saved.typesafe ? "TypeSafe (direct)" : saved.gateway ? "Vercel AI Gateway" : "server keys, if the site has them";
  const gemini = saved.gateway ? "Vercel AI Gateway" : custom ? "no key: add a Vercel one" : "server keys, if the site has them";

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (!open) setDraft(saved);
          setOpen(!open);
        }}
        aria-expanded={open}
        aria-label="API keys"
        title="API keys"
        className="fixed right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 bg-white/90 text-base shadow-sm backdrop-blur hover:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900/90"
      >
        🔑
        {custom && <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />}
      </button>

      {open && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save(draft);
            setOpen(false);
          }}
          className="fixed right-4 top-16 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 text-sm shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex flex-col gap-1">
            <h2 className="font-semibold">API keys</h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Use your own keys to try the demos. They are saved only in this browser and sent only to this site&apos;s server.
            </p>
          </div>

          <label className="flex flex-col gap-1">
            <span className="font-medium">TypeSafe API key</span>
            <input
              type={show ? "text" : "password"}
              value={draft.typesafe}
              onChange={(e) => setDraft({ ...draft, typesafe: e.target.value })}
              autoComplete="off"
              spellCheck={false}
              className="rounded-lg border border-zinc-300 px-3 py-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-950"
            />
            <span className="text-xs text-zinc-500">
              Jev called directly. From{" "}
              <a href="https://console.typesafe.ai/keys" target="_blank" rel="noreferrer" className="underline">
                console.typesafe.ai
              </a>
              .
            </span>
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-medium">Vercel AI Gateway key</span>
            <input
              type={show ? "text" : "password"}
              value={draft.gateway}
              onChange={(e) => setDraft({ ...draft, gateway: e.target.value })}
              autoComplete="off"
              spellCheck={false}
              className="rounded-lg border border-zinc-300 px-3 py-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-950"
            />
            <span className="text-xs text-zinc-500">
              Jev and Gemini through the gateway: the Gemini demos need this one.
            </span>
          </label>

          <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
            <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
            Show keys
          </label>

          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-lg bg-zinc-50 p-3 text-xs dark:bg-zinc-950">
            <dt className="text-zinc-500">Jev</dt>
            <dd>{jev}</dd>
            <dt className="text-zinc-500">Gemini</dt>
            <dd>{gemini}</dd>
          </dl>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => save({ typesafe: "", gateway: "" })}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Clear
            </button>
            <button type="submit" className="rounded-lg bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-500">
              Save
            </button>
          </div>
        </form>
      )}
    </>
  );
}
