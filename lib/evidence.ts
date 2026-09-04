/**
 * Live evidence retrieval layer.
 *
 * Pulls real, citable data from free public APIs that need no API key, so every
 * feasibility verdict can point at where its facts came from. Each connector is
 * independently timed out and allowed to fail: a slow or unreachable source
 * degrades the evidence pack, it never fails the assessment.
 */

export type SourceType =
  | "encyclopedia"
  | "official-statistics"
  | "community-signal"
  | "academic";

export interface EvidenceItem {
  title: string;
  url: string;
  snippet: string;
  /** Human readable provider name, shown as the citation label. */
  source: string;
  sourceType: SourceType;
  /** 0-1 trust weight used by the confidence model. */
  authority: number;
  retrievedAt: string;
  publishedAt?: string;
}

export interface EvidencePack {
  items: EvidenceItem[];
  /** Connectors that returned at least one item. */
  sourcesUsed: string[];
  /** Connectors that errored or timed out, with the reason. */
  failures: { source: string; reason: string }[];
  queryTerms: string[];
  durationMs: number;
  /** True when served from the in-process cache rather than the network. */
  cached: boolean;
}

interface WikiSearchHit {
  title: string;
  snippet?: string;
  timestamp?: string;
}

interface WikiSummary {
  extract?: string;
  timestamp?: string;
}

interface WorldBankRow {
  value: number | null;
  date: string;
  indicator?: { value?: string };
}

interface HackerNewsHit {
  title?: string;
  url?: string;
  objectID?: string;
  points?: number;
  num_comments?: number;
  story_text?: string;
  created_at?: string;
  _highlightResult?: { title?: { value?: string } };
}

interface CrossrefItem {
  title?: string[];
  DOI?: string;
  URL?: string;
  abstract?: string;
  issued?: { "date-parts"?: number[][] };
  "container-title"?: string[];
}

/** Per-connector network budget. Kept tight so the whole pack stays interactive. */
const SOURCE_TIMEOUT_MS = 7000;
const CACHE_TTL_MS = 30 * 60 * 1000;
const MAX_ITEMS = 14;

const cache = new Map<string, { pack: EvidencePack; expiresAt: number }>();

async function fetchJson<T>(url: string, timeoutMs = SOURCE_TIMEOUT_MS): Promise<T> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      // Wikipedia and Crossref both ask for an identifying UA and rate-limit
      // anonymous traffic more aggressively without one.
      "User-Agent": "NxtVenture-StartupNavigator/1.0 (startup feasibility research)",
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

async function fetchText(url: string, timeoutMs = SOURCE_TIMEOUT_MS): Promise<string> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { "User-Agent": "NxtVenture-StartupNavigator/1.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

const TERM_STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from", "has", "have",
  "how", "in", "into", "is", "it", "its", "of", "on", "or", "our", "so", "that", "the",
  "their", "then", "there", "these", "they", "this", "to", "was", "we", "were", "what",
  "when", "where", "which", "who", "will", "with", "you", "your", "using", "used", "use",
  "make", "makes", "made", "new", "based", "can", "very", "more", "most", "also", "each",
  "would", "should", "could", "about", "startup", "product", "idea", "concept", "business",
  // Generic connectives that survive hyphen-splitting ("mycelium-based") and
  // would otherwise crowd out the terms that carry the domain signal.
  "based", "type", "types", "kind", "like", "such", "over", "into", "onto", "then",
  "target", "buyers", "needs", "need", "help", "helps", "want", "wants", "high", "low",
  "good", "great", "best", "well", "much", "many", "other", "same", "than", "them",
]);

/**
 * Picks the most distinctive words from a pitch to drive external search.
 * Longer words are favoured because they carry the domain signal ("mycelium"
 * beats "packaging"), and the title outranks the description.
 */
export function extractQueryTerms(
  title: string,
  description: string,
  category?: string
): string[] {
  const score = new Map<string, number>();

  const add = (text: string, weight: number) => {
    const words = text
      .toLowerCase()
      // Hyphens are split, not kept: search backends treat "mycelium-based" as
      // a literal token and return nothing for it.
      .replace(/[^\w\s]/g, " ")
      .replace(/_/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !TERM_STOPWORDS.has(w) && !/^\d+$/.test(w));
    for (const w of words) {
      score.set(w, (score.get(w) || 0) + weight + Math.min(w.length, 12) / 24);
    }
  };

  add(title || "", 3);
  add(description || "", 1);
  // The sector label is a weak tiebreaker, not a search driver: weighting it
  // highly pushed generic words like "sustainability" ahead of "mycelium".
  if (category) add(category, 0.6);

  return [...score.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([w]) => w);
}

/**
 * Wikipedia, Algolia, Crossref and arXiv all AND their query terms, so a
 * six-word pitch summary reliably returns zero hits. Try the most specific
 * query first and progressively drop the weakest terms until something lands.
 */
async function searchWithRelaxation<T>(
  terms: string[],
  run: (query: string) => Promise<T[]>,
  sizes: number[] = [3, 2, 1]
): Promise<T[]> {
  let lastError: unknown = null;

  for (const size of sizes) {
    const query = terms.slice(0, size).join(" ").trim();
    if (!query) continue;
    try {
      const hits = await run(query);
      if (hits.length > 0) return hits;
    } catch (err) {
      lastError = err;
    }
  }

  // Only surface an error if every attempt errored; an empty result set is a
  // legitimate outcome and should be reported as "no matching records".
  if (lastError) throw lastError;
  return [];
}

function clip(text: string, max = 320): string {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

const now = () => new Date().toISOString();

/* ------------------------------------------------------------------ *
 * Connectors                                                          *
 * ------------------------------------------------------------------ */

/** Wikipedia: domain grounding — what the technology/market actually is. */
async function fromWikipedia(terms: string[]): Promise<EvidenceItem[]> {
  const hits = await searchWithRelaxation<WikiSearchHit>(terms, async (query) => {
    const searchUrl =
      "https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*" +
      `&srsearch=${encodeURIComponent(query)}&srlimit=3`;
    const data = await fetchJson<{ query?: { search?: WikiSearchHit[] } }>(searchUrl);
    return data.query?.search ?? [];
  });

  const items = await Promise.all(
    hits.map(async (hit) => {
      const title = hit.title;
      let snippet = clip(String(hit.snippet ?? "").replace(/<[^>]+>/g, ""));
      let publishedAt: string | undefined = hit.timestamp;

      // The REST summary endpoint gives a far cleaner abstract than the search
      // snippet, but it is a second round trip, so a failure just keeps the snippet.
      try {
        const sum = await fetchJson<WikiSummary>(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
            title.replace(/ /g, "_")
          )}`,
          4000
        );
        if (sum.extract) snippet = clip(sum.extract);
        if (sum.timestamp) publishedAt = sum.timestamp;
      } catch {
        /* keep search snippet */
      }

      return {
        title,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
        snippet,
        source: "Wikipedia",
        sourceType: "encyclopedia" as SourceType,
        authority: 0.7,
        retrievedAt: now(),
        publishedAt,
      };
    })
  );

  return items.filter((i) => i.snippet.length > 0);
}

/**
 * World Bank: hard macro numbers for the Indian market the pitches target.
 * `mrnev=1` asks for the most recent year that actually has a value.
 */
const WORLD_BANK_INDICATORS: { code: string; label: string; unit: string }[] = [
  { code: "NV.IND.MANF.ZS", label: "Manufacturing value added", unit: "% of GDP" },
  { code: "NY.GDP.PCAP.CD", label: "GDP per capita", unit: "current US$" },
  { code: "IT.NET.USER.ZS", label: "Internet penetration", unit: "% of population" },
  { code: "SP.POP.TOTL", label: "Total population", unit: "people" },
  { code: "FP.CPI.TOTL.ZG", label: "Consumer price inflation", unit: "annual %" },
];

async function fromWorldBank(): Promise<EvidenceItem[]> {
  const results = await Promise.allSettled(
    WORLD_BANK_INDICATORS.map(async (ind): Promise<EvidenceItem | null> => {
      const url =
        `https://api.worldbank.org/v2/country/IND/indicator/${ind.code}` +
        "?format=json&per_page=1&mrnev=1";
      const data = await fetchJson<[unknown, WorldBankRow[]?]>(url, 5000);
      const row = data[1]?.[0];
      if (!row || row.value === null || row.value === undefined) return null;

      const value = Number(row.value);
      const pretty =
        ind.unit === "people"
          ? `${(value / 1e9).toFixed(2)} billion`
          : value >= 1000
            ? value.toLocaleString("en-IN", { maximumFractionDigits: 0 })
            : value.toFixed(2);

      return {
        title: `India — ${ind.label}: ${pretty} ${ind.unit === "people" ? "" : ind.unit} (${row.date})`.trim(),
        url: `https://data.worldbank.org/indicator/${ind.code}?locations=IN`,
        snippet: `World Bank Open Data reports India's ${row.indicator?.value || ind.label} at ${pretty} ${ind.unit === "people" ? "people" : ind.unit} for ${row.date}.`,
        source: "World Bank Open Data",
        sourceType: "official-statistics" as SourceType,
        authority: 0.95,
        retrievedAt: now(),
        publishedAt: String(row.date),
      };
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<EvidenceItem | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((v): v is EvidenceItem => v !== null);
}

/** Hacker News: whether anyone is actually building/discussing this. */
async function fromHackerNews(terms: string[]): Promise<EvidenceItem[]> {
  const hits = await searchWithRelaxation<HackerNewsHit>(terms, async (query) => {
    const url =
      "https://hn.algolia.com/api/v1/search?tags=story&hitsPerPage=4" +
      `&query=${encodeURIComponent(query)}`;
    const data = await fetchJson<{ hits?: HackerNewsHit[] }>(url);
    return data.hits ?? [];
  });

  return hits
    .filter((h): h is HackerNewsHit & { title: string } => Boolean(h.title && (h.url || h.objectID)))
    .map((h) => ({
      title: h.title,
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      snippet: clip(
        `Hacker News discussion with ${h.points ?? 0} points and ${h.num_comments ?? 0} comments. ${h.story_text ?? h._highlightResult?.title?.value?.replace(/<[^>]+>/g, "") ?? ""}`
      ),
      source: "Hacker News",
      sourceType: "community-signal" as SourceType,
      // Community chatter is directional, not authoritative.
      authority: 0.45,
      retrievedAt: now(),
      publishedAt: h.created_at,
    }));
}

/** Crossref: peer-reviewed literature on the process or material. */
async function fromCrossref(terms: string[]): Promise<EvidenceItem[]> {
  // Crossref scores fuzzily and always returns *something*, so relaxation never
  // triggers. Give it the full term set first — the extra terms are what
  // separate the on-topic paper from generic "Packaging code" records.
  const items = await searchWithRelaxation<CrossrefItem>(
    terms,
    async (query) => {
      const url =
        "https://api.crossref.org/works?rows=3&select=title,DOI,URL,abstract,issued,container-title" +
        `&query=${encodeURIComponent(query)}`;
      const data = await fetchJson<{ message?: { items?: CrossrefItem[] } }>(url);
      return data.message?.items ?? [];
    },
    [5, 4, 3]
  );

  return items
    .filter((it): it is CrossrefItem & { title: string[] } => Boolean(it.title?.[0]))
    .map((it) => {
      const year = it.issued?.["date-parts"]?.[0]?.[0];
      const journal = it["container-title"]?.[0];
      const abstract = clip(String(it.abstract || "").replace(/<[^>]+>/g, ""));
      return {
        title: it.title[0],
        url: it.URL || `https://doi.org/${it.DOI}`,
        snippet:
          abstract ||
          `Peer-reviewed work${journal ? ` published in ${journal}` : ""}${year ? ` (${year})` : ""}. DOI: ${it.DOI}`,
        source: "Crossref (peer-reviewed)",
        sourceType: "academic" as SourceType,
        authority: 0.85,
        retrievedAt: now(),
        publishedAt: year ? String(year) : undefined,
      };
    });
}

/** arXiv: preprints, useful for the engineering feasibility half of a pitch. */
async function fromArxiv(terms: string[]): Promise<EvidenceItem[]> {
  const entries = await searchWithRelaxation<string>(terms, async (query) => {
    const joined = query.split(/\s+/).join(" AND ");
    const url =
      "https://export.arxiv.org/api/query?max_results=2&sortBy=relevance" +
      `&search_query=all:${encodeURIComponent(joined)}`;
    const xml = await fetchText(url);
    return xml.split("<entry>").slice(1);
  });

  return entries
    .map((entry): EvidenceItem | null => {
      const pick = (tag: string) =>
        entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))?.[1]?.trim();
      const title = pick("title")?.replace(/\s+/g, " ");
      const link = entry.match(/<id>([\s\S]*?)<\/id>/)?.[1]?.trim();
      if (!title || !link) return null;
      return {
        title,
        url: link,
        snippet: clip(pick("summary")?.replace(/\s+/g, " ") || ""),
        source: "arXiv",
        sourceType: "academic" as SourceType,
        authority: 0.7,
        retrievedAt: now(),
        publishedAt: pick("published")?.slice(0, 10),
      };
    })
    .filter((v): v is EvidenceItem => v !== null);
}

/* ------------------------------------------------------------------ *
 * Orchestration                                                       *
 * ------------------------------------------------------------------ */

const CONNECTORS: {
  name: string;
  run: (terms: string[]) => Promise<EvidenceItem[]>;
}[] = [
  { name: "Wikipedia", run: fromWikipedia },
  { name: "World Bank Open Data", run: () => fromWorldBank() },
  { name: "Hacker News", run: fromHackerNews },
  { name: "Crossref", run: fromCrossref },
  { name: "arXiv", run: fromArxiv },
];

/**
 * Runs every connector in parallel and merges what came back.
 * Always resolves — an empty pack is a valid (low-confidence) outcome.
 */
export async function gatherEvidence(input: {
  title: string;
  description: string;
  category?: string;
}): Promise<EvidencePack> {
  const started = Date.now();
  const queryTerms = extractQueryTerms(input.title, input.description, input.category);

  const cacheKey = queryTerms.join("|");
  const hit = cache.get(cacheKey);
  if (hit && hit.expiresAt > Date.now()) {
    return { ...hit.pack, cached: true };
  }

  const settled = await Promise.allSettled(
    CONNECTORS.map(async (c) => ({ name: c.name, items: await c.run(queryTerms) }))
  );

  const items: EvidenceItem[] = [];
  const sourcesUsed: string[] = [];
  const failures: { source: string; reason: string }[] = [];

  settled.forEach((result, idx) => {
    const name = CONNECTORS[idx].name;
    if (result.status === "fulfilled" && result.value.items.length > 0) {
      sourcesUsed.push(name);
      items.push(...result.value.items);
    } else if (result.status === "rejected") {
      const reason = result.reason;
      failures.push({
        source: name,
        reason:
          reason?.name === "TimeoutError"
            ? `timed out after ${SOURCE_TIMEOUT_MS}ms`
            : String(reason?.message || reason),
      });
    } else {
      failures.push({ source: name, reason: "no matching records" });
    }
  });

  // Drop off-topic hits. Fuzzy backends happily return a record that shares no
  // term with the pitch (a Wikipedia search for a niche material once came back
  // with "Asafoetida"), and feeding that to the model is worse than no evidence.
  // Official statistics are exempt: they are deliberately generic context that
  // will never contain the pitch's vocabulary.
  const relevant = items.filter((item) => {
    if (item.sourceType === "official-statistics") return true;
    const haystack = `${item.title} ${item.snippet}`.toLowerCase();
    return queryTerms.some((term) => haystack.includes(term));
  });

  // De-duplicate by URL and by normalised title — Crossref in particular
  // returns the same work under several DOIs.
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const deduped = relevant
    .filter((i) => {
      const titleKey = i.title.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (seenUrls.has(i.url) || seenTitles.has(titleKey)) return false;
      seenUrls.add(i.url);
      seenTitles.add(titleKey);
      return true;
    })
    .sort((a, b) => b.authority - a.authority)
    .slice(0, MAX_ITEMS);

  // Report the sources that actually contributed surviving evidence, not the
  // ones that merely responded — relevance filtering can empty a connector out.
  const contributing = [...new Set(deduped.map((i) => i.source))];
  for (const name of sourcesUsed) {
    if (!deduped.some((i) => i.source.startsWith(name.split(" ")[0]))) {
      failures.push({ source: name, reason: "returned only off-topic records" });
    }
  }

  const pack: EvidencePack = {
    items: deduped,
    sourcesUsed: contributing,
    failures,
    queryTerms,
    durationMs: Date.now() - started,
    cached: false,
  };

  cache.set(cacheKey, { pack, expiresAt: Date.now() + CACHE_TTL_MS });
  return pack;
}

/** Renders an evidence pack as numbered, citable context for an LLM prompt. */
export function formatEvidenceForPrompt(pack: EvidencePack): string {
  if (pack.items.length === 0) {
    return "No external evidence could be retrieved. State clearly that figures are model estimates rather than sourced data.";
  }

  return pack.items
    .map(
      (item, idx) =>
        `[${idx + 1}] ${item.title}\n    Source: ${item.source} (${item.sourceType})\n    URL: ${item.url}\n    Evidence: ${item.snippet}`
    )
    .join("\n\n");
}
