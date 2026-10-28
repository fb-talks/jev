import { cookies } from "next/headers";
import { TypeSafeClient } from "@typesafe-ai/sdk";
import { createGateway } from "ai";
import { GATEWAY_COOKIE, TYPESAFE_COOKIE } from "./key-cookies";

// The keys a visitor typed in the 🔑 panel: saved in localStorage and mirrored in cookies,
// so every API call carries them. Without them, the server's keys are used, but only those
// set explicitly in ENV (handy locally): never the Vercel OIDC token, so a published site
// without ENV keys never spends the owner's credit and every visitor uses their own key.
export type ApiKeys = { typesafe?: string; gateway?: string };

// Read them at the start of the handler, before any stream starts.
export async function apiKeys(): Promise<ApiKeys> {
  const store = await cookies();
  const typesafe = store.get(TYPESAFE_COOKIE)?.value;
  const gateway = store.get(GATEWAY_COOKIE)?.value;
  if (typesafe || gateway) return { typesafe, gateway };
  return { typesafe: process.env.TYPESAFE_API_KEY, gateway: process.env.AI_GATEWAY_API_KEY };
}

// Jev: a TypeSafe key calls TypeSafe directly, otherwise Jev goes through Vercel AI Gateway.
// Created where it's used because it throws when there is no key.
export function jevClient(keys: ApiKeys, defaultHeaders?: Record<string, string>) {
  if (keys.typesafe) return new TypeSafeClient({ apiKey: keys.typesafe, defaultHeaders });
  if (!keys.gateway) throw new Error("No API key for Jev: add a TypeSafe or Vercel AI Gateway key in the 🔑 panel.");
  return new TypeSafeClient({
    apiKey: keys.gateway,
    baseURL: "https://ai-gateway.vercel.sh/typesafe",
    defaultModel: "typesafe-ai/jev",
    defaultHeaders,
  });
}

// Gemini only exists on Vercel AI Gateway. The key is always explicit: a bare "provider/model"
// string would fall back to the OIDC token on Vercel.
export function geminiModel(keys: ApiKeys) {
  if (!keys.gateway) throw new Error("No API key for Gemini: add a Vercel AI Gateway key in the 🔑 panel.");
  return createGateway({ apiKey: keys.gateway })("google/gemini-3.8-flash");
}
