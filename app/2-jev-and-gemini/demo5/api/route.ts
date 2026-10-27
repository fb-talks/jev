import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { choice, score, TypeSafeClient } from "@typesafe-ai/sdk";
import { generateText, jsonSchema, Output } from "ai";

// Scraping, Jev and Gemini in one request: Gemini alone can take 20+ seconds.
export const maxDuration = 60;

// The categories, written once and shared by both models, so the comparison is fair.
const types = {
  ecommerce: "Online shop: product pages, cart, prices",
  news: "News outlet or magazine: current events, articles by date",
  blog: "Personal or company blog: posts and opinions",
  saas: "Software or online service: features, pricing, sign up",
  docs: "Technical documentation or reference",
  social: "Social network, forum or community",
  institutional: "Government, public body, university or non-profit",
  other: "None of the above",
};

const sectors = {
  tech: "Technology, software, developer tools",
  finance: "Banking, payments, investing, insurance",
  retail: "Consumer goods, fashion, food, marketplaces",
  media: "News, entertainment, video, music",
  education: "Schools, courses, learning",
  travel: "Travel, transport, hospitality",
  government: "Public administration and institutions",
  other: "None of the above",
};

const commercialLevels = [
  "Purely informative, nothing to sell",
  "Mostly informative, with some promotion",
  "Clearly promotional",
  "Aggressive selling: offers, urgency, calls to buy",
];

const jevQuestions = {
  type: choice("What kind of website is this?", types),
  sector: choice("Which sector does this website belong to?", sectors),
  commercial: score("How commercial is this page?", commercialLevels),
};

// Gemini gets the same criteria in its instructions and must answer with this schema.
const geminiSchema = jsonSchema<{ type: keyof typeof types; sector: keyof typeof sectors; commercial: number }>({
  type: "object",
  properties: {
    type: { type: "string", enum: Object.keys(types) },
    sector: { type: "string", enum: Object.keys(sectors) },
    commercial: { type: "integer", minimum: 0, maximum: 3 },
  },
  required: ["type", "sector", "commercial"],
  additionalProperties: false,
});

const describe = (o: Record<string, string>) => Object.entries(o).map(([k, v]) => `- ${k}: ${v}`).join("\n");

const geminiInstructions = `You classify websites from the text of their home page.
type, one of:
${describe(types)}

sector, one of:
${describe(sectors)}

commercial, from 0 to 3:
${commercialLevels.map((l, i) => `- ${i}: ${l}`).join("\n")}`;

/** Enough text to recognize a site, well below Jev's input limit. */
const MAX_CHARS = 4000;

// Demo 5: one URL per call. We scrape it once, then the chosen models classify the same text.
export async function POST(request: Request) {
  const { url, models = ["jev", "gemini"] } = await request.json();
  const runJev = models.includes("jev");
  const runGemini = models.includes("gemini");

  let target: URL;
  try {
    target = await checkUrl(url);
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Invalid URL" }, { status: 400 });
  }

  let page: { title: string; text: string; fetchMs: number };
  try {
    page = await scrape(target);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: `Scraping failed: ${message}` }, { status: 502 });
  }
  if (page.text.length < 100) {
    return Response.json(
      { error: "Too little text: the page is probably rendered with JavaScript or blocked." },
      { status: 422 },
    );
  }

  try {
    // Jev through Vercel AI Gateway: AI_GATEWAY_API_KEY locally, the OIDC token on Vercel.
    const jev = new TypeSafeClient({
      apiKey: process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_OIDC_TOKEN,
      baseURL: "https://ai-gateway.vercel.sh/typesafe",
      defaultModel: "typesafe-ai/jev",
    });

    // the chosen models at the same time, each with its own stopwatch
    const [jevResult, geminiResult] = await Promise.all([
      runJev ? timed(() => jev.systemOne({ state: page.text, questions: jevQuestions })) : null,
      runGemini
        ? timed(() =>
            generateText({
              model: "google/gemini-3.8-flash",
              instructions: geminiInstructions,
              prompt: page.text,
              output: Output.object({ schema: geminiSchema }),
            }),
          )
        : null,
    ]);

    return Response.json({
      url: target.href,
      title: page.title,
      chars: page.text.length,
      fetchMs: page.fetchMs,
      jev: jevResult && {
        answers: jevResult.value.answers,
        inputTokens: jevResult.value.usage.input_tokens,
        ms: jevResult.ms,
      },
      gemini: geminiResult && {
        answers: geminiResult.value.output,
        inputTokens: geminiResult.value.usage.inputTokens ?? null,
        ms: geminiResult.ms,
      },
    });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: `AI call failed: ${message}` }, { status: 502 });
  }
}

async function timed<T>(fn: () => Promise<T>) {
  const start = performance.now();
  const value = await fn();
  return { value, ms: Math.round(performance.now() - start) };
}

// ---------- Scraping ----------

/**
 * A route that fetches any URL can be abused to reach internal services (SSRF):
 * only public http(s) hosts are allowed, checked again after DNS and on every redirect.
 */
async function checkUrl(raw: unknown): Promise<URL> {
  if (typeof raw !== "string") throw new Error("Missing URL.");
  const url = new URL(raw.trim());
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Only http and https URLs.");

  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (!isIP(host) && !host.includes(".")) throw new Error("Use a public domain.");
  const { address } = isIP(host) ? { address: host } : await lookup(host);
  if (isPrivate(address)) throw new Error("Private or local addresses are not allowed.");
  return url;
}

function isPrivate(ip: string) {
  if (ip.startsWith("::ffff:")) ip = ip.slice(7);
  if (isIP(ip) === 6) return ip === "::1" || ip === "::" || /^(fc|fd|fe80)/i.test(ip);
  const [a, b] = ip.split(".").map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
}

async function scrape(start: URL) {
  const t0 = performance.now();
  let url = start;
  let res: Response;

  // follow redirects by hand, so each hop goes through checkUrl
  for (let hops = 0; ; hops++) {
    res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; JevDemo/1.0)", Accept: "text/html" },
    });
    const location = res.headers.get("location");
    if (res.status < 300 || res.status >= 400 || !location) break;
    if (hops >= 3) throw new Error("Too many redirects.");
    url = await checkUrl(new URL(location, url).href);
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const fetchMs = Math.round(performance.now() - t0);

  const title = decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim();
  const description =
    html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1] ??
    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i)?.[1] ??
    "";

  // the visible text: drop code, styles and page chrome, then every tag
  const body = html
    .replace(/<(script|style|noscript|svg|nav|footer|template)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ");

  const text = decode([title, description, body].join("\n")).replace(/\s+/g, " ").trim().slice(0, MAX_CHARS);
  return { title, text, fetchMs };
}

function decode(s: string) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}
