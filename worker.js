/**
 * Finish It — Cloudflare Worker (root app).
 *
 * Serves the static app (via the `assets` config in wrangler.jsonc) and one API
 * route: POST /api/lesson — a Claude-backed article→lesson engine. The Anthropic
 * key lives here as a Worker secret and never reaches the browser (the repo's
 * no-browser-side-LLM-keys rule). Ported from fable-5/worker.js.
 *
 * The front-end only calls this when the user flips "AI mode" on (off by
 * default). On any failure — no key, rate limit, upstream error — it returns an
 * error and the client silently falls back to the deterministic engine.
 *
 * Setup (one-time, to actually enable AI mode):
 *   npx wrangler deploy
 *   npx wrangler secret put ANTHROPIC_API_KEY
 */

const MAX_TEXT_CHARS = 60_000;   // ~15K tokens in — a long article, a few cents
const DAILY_LIMIT = 40;          // lessons per IP per UTC day

// Best-effort limiter: per-isolate memory, so it resets on eviction and isn't
// shared across data centers. Good enough to deter casual abuse of a shared
// URL; swap for a KV or Durable Object counter if this ever needs a hard cap.
const hits = new Map();
function limited(ip) {
  const key = ip + "|" + new Date().toISOString().slice(0, 10);
  const n = (hits.get(key) || 0) + 1;
  hits.set(key, n);
  if (hits.size > 5000) hits.clear();
  return n > DAILY_LIMIT;
}

// Mirrors the front-end's lesson shape. makeArticle() in index.html maps this to
// the app's chunks[] + questions[] (answer_index → the option text).
const LESSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "chunks"],
  properties: {
    summary: { type: "string", description: "One sentence capturing the article's core point, under 200 characters." },
    chunks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "question"],
        properties: {
          text: { type: "string", description: "The chunk's text, preserving the article's original wording. Blank line between paragraphs." },
          question: {
            anyOf: [
              {
                type: "object",
                additionalProperties: false,
                required: ["prompt", "options", "answer_index"],
                properties: {
                  prompt: { type: "string", description: "One quick recall question answerable only from this chunk." },
                  options: { type: "array", items: { type: "string" }, description: "Exactly 4 short options, one correct." },
                  answer_index: { type: "integer", enum: [0, 1, 2, 3] },
                },
              },
              { type: "null" },
            ],
          },
        },
      },
    },
  },
};

const SYSTEM_PROMPT = `You are the reading engine for "Finish It", an app that turns an article into sixty-second reading bites with one quick recall question after each, for a reader who struggles to get through long pieces.

You receive raw article text. It may contain markdown artifacts, navigation cruft, or "## " section headings. Return a lesson as JSON:

1. Keep only the article body. Drop navigation, bylines, dates, tables of contents, share prompts, related-article lists, cookie notices, footnote markers, and reference lists.
2. Split the body into chunks. Each chunk is ONE self-contained idea, around {TARGET} words (anywhere from 0.6x to 1.5x of that is fine). Never split mid-thought; prefer the author's own paragraph and section boundaries.
3. chunk.text must preserve the article's ORIGINAL wording — do not paraphrase, summarize, or rewrite anything you keep. Separate paragraphs within a chunk with a blank line.
4. chunk.question: one quick recall question answerable ONLY from that chunk. Exactly 4 short options, exactly one correct, plausible distractors, never a trick, never ambiguous. Vary the style across chunks: a key term, a number, a name, a cause or consequence. If a chunk supports no fair question, set question to null rather than forcing an awkward one.
5. summary: one sentence, under 200 characters, capturing the article's core point — written from the article, not generic.`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/lesson") {
      if (request.method !== "POST") return json({ error: "POST only" }, 405);
      return lesson(request, env);
    }
    // Static files are served by the assets layer before the Worker runs;
    // anything that reaches here matched neither an asset nor the API.
    return new Response("Not found", { status: 404 });
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function lesson(request, env) {
  if (!env.ANTHROPIC_API_KEY) return json({ error: "no API key configured" }, 503);

  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  if (limited(ip)) return json({ error: "daily limit reached" }, 429);

  let body;
  try { body = await request.json(); } catch { return json({ error: "bad json" }, 400); }
  const text = String(body.text || "").slice(0, MAX_TEXT_CHARS);
  const title = String(body.title || "").slice(0, 200);
  const target = Math.min(Math.max(Number(body.target) || 105, 60), 180);
  if ((text.match(/\S+/g) || []).length < 60) return json({ error: "text too short" }, 400);

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      // Sonnet 4.6 ($3/$15 per MTok ≈ 2–5¢ per article) is the quality/cost
      // sweet spot for this article→lesson task. Override with the MODEL var in
      // wrangler.jsonc — "claude-opus-4-8" for max quality. NOTE: the `effort`
      // field below errors on Haiku 4.5 / Sonnet 4.5, so MODEL must stay on
      // Sonnet 4.6 or an Opus tier (or drop `effort` if you want Haiku).
      model: env.MODEL || "claude-sonnet-4-6",
      max_tokens: 16000,
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: LESSON_SCHEMA },
      },
      system: SYSTEM_PROMPT.replace("{TARGET}", String(target)),
      messages: [
        { role: "user", content: `Title: ${title}\n\n<article>\n${text}\n</article>` },
      ],
    }),
  });

  if (!res.ok) {
    console.error("anthropic error", res.status, (await res.text()).slice(0, 500));
    return json({ error: "upstream " + res.status }, 502);
  }
  const data = await res.json();
  if (data.stop_reason === "max_tokens") return json({ error: "output truncated" }, 502);
  // Fable 5 / classifier refusals come back as stop_reason "refusal" with empty
  // content; the `!block` guard below catches that and the client falls back.
  const block = (data.content || []).find((b) => b.type === "text");
  if (!block) return json({ error: "empty response" }, 502);
  try {
    return json(JSON.parse(block.text));
  } catch {
    return json({ error: "unparseable lesson" }, 502);
  }
}
