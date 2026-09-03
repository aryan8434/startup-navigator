/**
 * Multi-provider LLM router.
 *
 * The previous implementation pinned single model ids (`llama-3.3-70b-versatile`,
 * `gemini-1.5-flash`) that have since been retired by both vendors. Every call
 * 404'd and the app silently served offline placeholder text while still
 * labelling the output as AI-generated.
 *
 * This layer fixes that class of bug rather than just the two ids: each provider
 * declares a preference-ordered candidate list, a dead model is remembered and
 * skipped for the rest of the process, and the router falls through to the next
 * model and then the next provider before it ever reports offline.
 */

export type ProviderId = "groq" | "gemini" | "openai";

export interface ChatOptions {
  system: string;
  user: string;
  /** Ask the provider to emit strict JSON. */
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface ChatResult {
  text: string;
  provider: ProviderId;
  model: string;
  /** Friendly label for the UI, e.g. "Groq · GPT-OSS 120B". */
  label: string;
  latencyMs: number;
  /** Models tried and rejected before this one answered. */
  attempts: { model: string; error: string }[];
}

export interface ProviderHealth {
  provider: ProviderId;
  configured: boolean;
  reachable: boolean;
  /** Model that answered a live probe, if any. */
  workingModel: string | null;
  latencyMs: number | null;
  error: string | null;
  /** Model ids the account can actually see. */
  availableModels: string[];
}

/**
 * Candidates are ordered best-first. Each entry was verified against the live
 * APIs; the fallback chain covers the case where a vendor retires one again.
 */
const MODEL_CANDIDATES: Record<ProviderId, { id: string; label: string }[]> = {
  groq: [
    { id: "openai/gpt-oss-120b", label: "Groq · GPT-OSS 120B" },
    { id: "openai/gpt-oss-20b", label: "Groq · GPT-OSS 20B" },
    { id: "qwen/qwen3.8-27b", label: "Groq · Qwen 3.8 27B" },
  ],
  gemini: [
    { id: "gemini-3.5-flash", label: "Google · Gemini 3.5 Flash" },
    { id: "gemini-3.1-flash-lite", label: "Google · Gemini 3.1 Flash Lite" },
    { id: "gemini-3.6-flash", label: "Google · Gemini 3.6 Flash" },
    { id: "gemini-flash-latest", label: "Google · Gemini Flash (latest)" },
  ],
  openai: [
    { id: "gpt-4o-mini", label: "OpenAI · GPT-4o mini" },
    { id: "gpt-4.1-mini", label: "OpenAI · GPT-4.1 mini" },
  ],
};

const DEFAULT_TIMEOUT_MS = 45000;

/** Carries the HTTP status and raw body so the router can tell a retired model
 *  (permanent, stop trying) from a rate limit or outage (transient). */
class ProviderError extends Error {
  readonly status: number;
  readonly body: string;
  readonly attempts: { model: string; error: string }[];

  constructor(
    message: string,
    opts: { status?: number; body?: string; attempts?: { model: string; error: string }[] } = {}
  ) {
    super(message);
    this.name = "ProviderError";
    this.status = opts.status ?? 0;
    this.body = opts.body ?? "";
    this.attempts = opts.attempts ?? [];
  }
}

/** Minimal shapes of the vendor responses this module reads. */
interface OpenAICompatibleResponse {
  choices?: { message?: { content?: string } }[];
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

interface OpenAIModelList {
  data?: { id?: string; active?: boolean }[];
}

interface GeminiModelList {
  models?: { name?: string; supportedGenerationMethods?: string[] }[];
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Models that returned a hard "does not exist" — skipped for this process. */
const deadModels = new Set<string>();

export function apiKeyFor(provider: ProviderId): string | undefined {
  const key =
    provider === "groq"
      ? process.env.GROQ_API_KEY
      : provider === "gemini"
        ? process.env.GEMINI_API_KEY
        : process.env.OPENAI_API_KEY;
  return key && key.trim().length > 0 ? key.trim() : undefined;
}

export function isConfigured(provider: ProviderId): boolean {
  return Boolean(apiKeyFor(provider));
}

/** A 404/model_not_found is permanent for this deploy; a 429 or 5xx is not. */
function isPermanentModelError(status: number, body: string): boolean {
  if (status === 404) return true;
  return /model_not_found|does not exist|no longer available|not found for API/i.test(body);
}

/* ------------------------------------------------------------------ *
 * OpenAI-compatible providers (Groq, OpenAI)                          *
 * ------------------------------------------------------------------ */

async function callOpenAICompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  opts: ChatOptions
): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      temperature: opts.temperature ?? 0.3,
      max_tokens: opts.maxTokens ?? 4096,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  const bodyText = await res.text();
  if (!res.ok) {
    throw new ProviderError(`HTTP ${res.status}: ${bodyText.slice(0, 200)}`, {
      status: res.status,
      body: bodyText,
    });
  }

  const data = JSON.parse(bodyText) as OpenAICompatibleResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("empty completion");
  return content;
}

/* ------------------------------------------------------------------ *
 * Gemini                                                              *
 * ------------------------------------------------------------------ */

async function callGemini(
  apiKey: string,
  model: string,
  opts: ChatOptions
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: opts.system }] },
      contents: [{ role: "user", parts: [{ text: opts.user }] }],
      generationConfig: {
        temperature: opts.temperature ?? 0.3,
        maxOutputTokens: opts.maxTokens ?? 4096,
        ...(opts.json ? { responseMimeType: "application/json" } : {}),
      },
    }),
  });

  const bodyText = await res.text();
  if (!res.ok) {
    throw new ProviderError(`HTTP ${res.status}: ${bodyText.slice(0, 200)}`, {
      status: res.status,
      body: bodyText,
    });
  }

  const data = JSON.parse(bodyText) as GeminiResponse;
  // Gemini splits long answers across parts; thinking models also emit parts
  // with no `text`, so filter rather than index into [0].
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text)
    .filter((t): t is string => Boolean(t))
    .join("");
  if (!text) throw new Error("empty completion");
  return text;
}

/* ------------------------------------------------------------------ *
 * Router                                                              *
 * ------------------------------------------------------------------ */

async function callProvider(
  provider: ProviderId,
  opts: ChatOptions
): Promise<ChatResult> {
  const apiKey = apiKeyFor(provider);
  if (!apiKey) throw new Error(`${provider}: no API key configured`);

  const attempts: { model: string; error: string }[] = [];

  for (const candidate of MODEL_CANDIDATES[provider]) {
    if (deadModels.has(`${provider}:${candidate.id}`)) {
      attempts.push({ model: candidate.id, error: "skipped (known unavailable)" });
      continue;
    }

    const started = Date.now();
    try {
      const text =
        provider === "gemini"
          ? await callGemini(apiKey, candidate.id, opts)
          : await callOpenAICompatible(
              provider === "groq"
                ? "https://api.groq.com/openai/v1"
                : "https://api.openai.com/v1",
              apiKey,
              candidate.id,
              opts
            );

      return {
        text,
        provider,
        model: candidate.id,
        label: candidate.label,
        latencyMs: Date.now() - started,
        attempts,
      };
    } catch (err) {
      const status = err instanceof ProviderError ? err.status : 0;
      const body = err instanceof ProviderError ? err.body : errorMessage(err);
      if (isPermanentModelError(status, body)) {
        deadModels.add(`${provider}:${candidate.id}`);
      }
      attempts.push({ model: candidate.id, error: errorMessage(err).slice(0, 160) });
    }
  }

  throw new ProviderError(
    `${provider}: all candidate models failed (${attempts.map((a) => a.model).join(", ")})`,
    { attempts }
  );
}

/**
 * Runs the pitch through `preferred` first, then the remaining configured
 * providers. Throws only when every provider is exhausted, which the caller
 * treats as "fall back to the offline engine".
 */
export async function chat(
  opts: ChatOptions,
  preferred: ProviderId = "groq"
): Promise<ChatResult> {
  const order: ProviderId[] = [
    preferred,
    ...(["groq", "gemini", "openai"] as ProviderId[]).filter((p) => p !== preferred),
  ].filter(isConfigured);

  if (order.length === 0) {
    throw new Error("No AI provider configured. Set GROQ_API_KEY or GEMINI_API_KEY.");
  }

  const allAttempts: { model: string; error: string }[] = [];
  for (const provider of order) {
    try {
      const result = await callProvider(provider, opts);
      return { ...result, attempts: [...allAttempts, ...result.attempts] };
    } catch (err) {
      const attempts =
        err instanceof ProviderError && err.attempts.length > 0
          ? err.attempts
          : [{ model: provider, error: errorMessage(err) }];
      allAttempts.push(...attempts);
    }
  }

  throw new ProviderError("All AI providers failed", { attempts: allAttempts });
}

/**
 * Strips the code fences and prose that models wrap around JSON even in JSON
 * mode, then parses. Returns null instead of throwing so callers can fall back.
 */
export function parseJsonLoose<T = unknown>(raw: string): T | null {
  if (!raw) return null;

  const candidates: string[] = [];
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) candidates.push(fenced[1]);
  candidates.push(raw);

  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(raw.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate.trim()) as T;
    } catch {
      /* try the next shape */
    }
  }
  return null;
}

/** Convenience wrapper: chat in JSON mode and parse, with one repair retry. */
export async function chatJson<T = unknown>(
  opts: Omit<ChatOptions, "json">,
  preferred: ProviderId = "groq"
): Promise<{ data: T; meta: ChatResult } | null> {
  const result = await chat({ ...opts, json: true }, preferred);
  const parsed = parseJsonLoose<T>(result.text);
  if (parsed) return { data: parsed, meta: result };

  // One retry with an explicit repair instruction — cheaper and more reliable
  // than failing the whole assessment over a stray prefix.
  const retry = await chat(
    {
      ...opts,
      json: true,
      user: `${opts.user}\n\nIMPORTANT: Your previous reply was not valid JSON. Return ONLY a raw JSON object, no prose, no code fences.`,
      temperature: 0,
    },
    preferred
  );
  const reparsed = parseJsonLoose<T>(retry.text);
  return reparsed ? { data: reparsed, meta: retry } : null;
}

/* ------------------------------------------------------------------ *
 * Health checks                                                       *
 * ------------------------------------------------------------------ */

async function listModels(provider: ProviderId, apiKey: string): Promise<string[]> {
  try {
    if (provider === "gemini") {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) return [];
      const data = (await res.json()) as GeminiModelList;
      return (data.models ?? [])
        .filter((m) => (m.supportedGenerationMethods ?? []).includes("generateContent"))
        .map((m) => String(m.name).replace("models/", ""));
    }

    const base = provider === "groq" ? "https://api.groq.com/openai/v1" : "https://api.openai.com/v1";
    const res = await fetch(`${base}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as OpenAIModelList;
    return (data.data ?? [])
      .filter((m) => m.active !== false)
      .map((m) => String(m.id));
  } catch {
    return [];
  }
}

/** Live probe: lists models, then sends a real one-token completion. */
export async function checkProvider(provider: ProviderId): Promise<ProviderHealth> {
  const apiKey = apiKeyFor(provider);
  if (!apiKey) {
    return {
      provider,
      configured: false,
      reachable: false,
      workingModel: null,
      latencyMs: null,
      error: "API key not set",
      availableModels: [],
    };
  }

  const availableModels = await listModels(provider, apiKey);
  const started = Date.now();

  try {
    const result = await callProvider(provider, {
      system: "You are a health probe. Reply with exactly the word OK.",
      user: "Reply with exactly: OK",
      maxTokens: 2000,
      temperature: 0,
      timeoutMs: 15000,
    });
    return {
      provider,
      configured: true,
      reachable: true,
      workingModel: result.model,
      latencyMs: result.latencyMs,
      error: null,
      availableModels,
    };
  } catch (err) {
    return {
      provider,
      configured: true,
      reachable: false,
      workingModel: null,
      latencyMs: Date.now() - started,
      error: errorMessage(err).slice(0, 300),
      availableModels,
    };
  }
}

export async function checkAllProviders(): Promise<ProviderHealth[]> {
  return Promise.all(
    (["groq", "gemini", "openai"] as ProviderId[]).map((p) => checkProvider(p))
  );
}
