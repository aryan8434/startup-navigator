import { db, Article } from "./db";
import { chat } from "./providers";
import { gatherEvidence } from "./evidence";

// Stopwords for simple keyword matching
const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "arent", "as", "at",
  "be", "because", "been", "before", "being", "below", "between", "both", "but", "by",
  "cant", "cannot", "could", "couldnt",
  "did", "didnt", "do", "does", "doesnt", "doing", "dont", "down", "during",
  "each",
  "few", "for", "from", "further",
  "had", "hadnt", "has", "hasnt", "have", "havent", "having", "he", "hed", "hell", "hes", "her", "here", "heres", "hers", "herself", "him", "himself", "his", "how", "hows",
  "i", "id", "ill", "im", "ive", "if", "in", "into", "is", "isnt", "it", "its", "itself",
  "lets",
  "me", "more", "most", "mustnt", "my", "myself",
  "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own",
  "same", "shant", "she", "shed", "shell", "shes", "should", "shouldnt", "so", "some", "such",
  "than", "that", "thats", "the", "their", "theirs", "them", "themselves", "then", "there", "theres", "these", "they", "theyd", "theyll", "theyre", "theyve", "this", "those", "through", "to", "too", "under", "until", "up", "very",
  "was", "wasnt", "we", "wed", "well", "were", "weve", "werent", "what", "whats", "when", "whens", "where", "wheres", "which", "while", "who", "whos", "whom", "why", "whys", "with", "wont", "would", "wouldnt",
  "you", "youd", "youll", "youre", "youve", "your", "yours", "yourself", "yourselves"
]);

interface MatchResult {
  article: Article;
  score: number;
}

/**
 * Tokenizes text into lowercase words, removing punctuation and optionally filtering stop words.
 */
function tokenize(text: string, filterStopwords = true): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 0 && (!filterStopwords || !STOP_WORDS.has(word)));
}

/**
 * Ranks articles based on query token relevance.
 * Gives weight to:
 * - Match in Title (weight: 10)
 * - Match in Category (weight: 8)
 * - Match in Tags (weight: 5)
 * - Match in Content (weight: 1 per occurrence)
 */
export function rankArticles(query: string, articles: Article[]): MatchResult[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    return articles.map((article) => ({ article, score: 0 }));
  }

  const results: MatchResult[] = [];

  for (const article of articles) {
    let score = 0;
    const titleTokens = tokenize(article.title, false);
    const categoryTokens = tokenize(article.category, false);
    const tagsTokens = article.tags.flatMap((t) => tokenize(t, false));
    const contentTokens = tokenize(article.content, false);

    // Compute token overlaps
    for (const token of queryTokens) {
      // Title matches
      const titleMatches = titleTokens.filter((t) => t === token || t.includes(token)).length;
      score += titleMatches * 10;

      // Category matches
      const catMatches = categoryTokens.filter((c) => c === token || c.includes(token)).length;
      score += catMatches * 8;

      // Tag matches
      const tagMatches = tagsTokens.filter((t) => t === token || t.includes(token)).length;
      score += tagMatches * 5;

      // Content matches (boost exact word matches)
      const contentMatches = contentTokens.filter((c) => c === token).length;
      score += contentMatches * 1.5;

      // Substring match in content
      const contentSubMatches = contentTokens.filter((c) => c !== token && c.includes(token)).length;
      score += contentSubMatches * 0.5;
    }

    if (score > 0) {
      results.push({ article, score });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

/**
 * Extracts sentences from article content containing matched query tokens for local RAG citation summaries.
 */
function extractSummaries(content: string, queryTokens: string[]): string {
  const paragraphs = content.split(/\n+/);
  const relevantParagraphs: string[] = [];

  for (const para of paragraphs) {
    const paraLower = para.toLowerCase();
    const matches = queryTokens.some((token) => paraLower.includes(token));
    if (matches && para.trim().length > 10) {
      relevantParagraphs.push(para.trim());
    }
    if (relevantParagraphs.length >= 2) break; // Limit size
  }

  if (relevantParagraphs.length === 0) {
    // Return first paragraph if no keyword hit but article was matched
    return paragraphs[0] || "";
  }

  return relevantParagraphs.join("\n\n");
}

/**
 * Fallback extractive local RAG engine.
 */
function runLocalRag(query: string, matches: MatchResult[]): string {
  if (matches.length === 0) {
    return `### AI Search Assistant Response

I couldn't find any direct guides or articles matching your question in the NxtVenture database. 

Try asking questions about:
*   **Company Registration** (LLCs, Corporations, Delaware filing)
*   **Funding** (VC, Angels, Bootstrapping, SAFEs)
*   **Legal Compliance** (Vesting, IP Assignments, NDAs)
*   **Hiring** (ESOP, Equity splits, W-2 vs 1099)
*   **Branding & Marketing** (SEO, Traction channels, CAC, LTV)
*   **Taxation** (Sales tax nexus, R&D credits)
*   **Business Growth** (PMF, sean ellis test, scaling metrics)`;
  }

  const queryTokens = tokenize(query);
  let answer = `### AI Search Assistant (Local Extractive RAG)

Based on the official guides in NxtVenture, here is a consolidated answer to your query:

`;

  // Use top 2 matched articles
  const topMatches = matches.slice(0, 2);
  topMatches.forEach((match) => {
    const snippet = extractSummaries(match.article.content, queryTokens);
    answer += `#### From: **${match.article.title}** (${match.article.category})\n\n`;
    answer += `${snippet}\n\n`;
  });

  answer += `*Note: The answer above is dynamically extracted and summarized from our offline knowledge base articles. If you configure a model API Key in your environment, this interface will use generative summaries.*`;

  return answer;
}

/**
 * Core RAG execution.
 *
 * Retrieves from two places at once: the internal knowledge base (articles,
 * ideas, past feasibility reports) and live external sources, then answers over
 * the union with citations. Provider selection and model fallback are handled
 * by lib/providers, so a retired model id degrades to the next candidate
 * instead of silently dropping the whole search to the offline engine.
 */
export async function executeRagSearch(
  query: string,
  preferredModel: string = "groq"
): Promise<{
  answer: string;
  sources: string[];
  webSources: { title: string; url: string; source: string }[];
  providerUsed: string;
  latencyMs: number;
}> {
  const articles = await db.articles.findMany();
  const ideas = await db.ideas.findMany();
  const feasibilityReports = await db.feasibilityReports.findMany();

  // Convert manufacturing ideas to article format for RAG indexing
  const ideaArticles: Article[] = ideas.map((idea) => ({
    id: idea.id,
    title: `[Manufacturing Idea] ${idea.title}`,
    category: idea.category,
    summary: idea.tagline,
    content: `Idea Concept: ${idea.title}\nCategory: ${idea.category}\nInvestment Tier: ${idea.investmentTier}\nMargin: ${idea.profitMargin}\nTAM: ${idea.tam}\nProblem Statement: ${idea.problemStatement}\nProposed Solution: ${idea.proposedSolution}\nBill of Materials: ${idea.billOfMaterials.map(b => `${b.item} (${b.costPerUnit})`).join(", ")}\nMachinery Needed: ${idea.machineryNeeded.map(m => `${m.name} (${m.estimatedCost})`).join(", ")}\nManufacturing Process: ${idea.manufacturingProcess.join(" -> ")}\nGrowth Playbook: ${idea.growthPlaybook.join(", ")}`,
    tags: idea.tags,
    createdAt: idea.createdAt,
    updatedAt: idea.updatedAt,
  }));

  // Convert AI Feasibility Reports to article format for RAG indexing
  const reportArticles: Article[] = feasibilityReports.map((report) => ({
    id: report.id,
    title: `[AI Feasibility Audit] ${report.title}`,
    category: report.category,
    summary: `${report.ratingLabel} (Score: ${report.feasibilityScore}/100)`,
    content: `Evaluated Concept: ${report.title}\nCategory: ${report.category}\nFeasibility Score: ${report.feasibilityScore} / 100 (${report.ratingLabel})\nVerdict: ${report.verdict}\nFinancial Viability: COGS ${report.financialViability.estimatedCogs}, Gross Margin ${report.financialViability.projectedMargin}, Payback Horizon ${report.financialViability.breakEvenMonths}, Recommended MSRP ${report.financialViability.recommendedRetailPrice}\nRisk Matrix: Technical ${report.riskMatrix.technicalComplexity}, Supply Chain ${report.riskMatrix.supplyChainRisk}, Capital ${report.riskMatrix.capitalIntensity}, Regulatory ${report.riskMatrix.regulatoryBarrier}\nDetailed Analysis:\n${report.detailedAnalysis}`,
    tags: ["Feasibility Report", "AI Audit", report.category, report.ratingLabel],
    createdAt: report.createdAt,
    updatedAt: report.createdAt,
  }));

  const combined = [...articles, ...ideaArticles, ...reportArticles];
  const ranked = rankArticles(query, combined);
  const topMatches = ranked.filter((r) => r.score > 0).slice(0, 3);

  const internalContext = topMatches
    .map((m) => `Title: ${m.article.title}\nCategory: ${m.article.category}\nContent:\n${m.article.content}`)
    .join("\n\n---\n\n");

  // Live external evidence runs alongside the internal lookup. A failure here
  // is non-fatal: the answer just falls back to internal knowledge only.
  const evidence = await gatherEvidence({
    title: query,
    description: query,
  }).catch(() => null);

  const webBlock =
    evidence && evidence.items.length > 0
      ? evidence.items
          .map(
            (item, idx) =>
              `[W${idx + 1}] ${item.title}\n    Source: ${item.source}\n    URL: ${item.url}\n    ${item.snippet}`
          )
          .join("\n\n")
      : "No external sources retrieved for this query.";

  const system = `You are the NxtVenture AI Assistant, an expert guide for startup and manufacturing founders in India.

Answer the user's question using the two context blocks below.

RULES:
- Prefer the internal NxtVenture guides for platform-specific and procedural advice.
- Use the live external sources for market facts, statistics and current context, and cite them inline as [W1], [W2] etc.
- If neither context covers the question, say so explicitly, then give clearly-labelled general startup advice.
- Never invent statistics or source URLs.
- Format the answer in clean, readable Markdown with short sections.

INTERNAL NXTVENTURE KNOWLEDGE BASE:
${internalContext || "No matching internal guides."}

LIVE EXTERNAL SOURCES:
${webBlock}`;

  const webSources = (evidence?.items ?? []).map((i) => ({
    title: i.title,
    url: i.url,
    source: i.source,
  }));

  try {
    const result = await chat(
      { system, user: query, temperature: 0.3, maxTokens: 3000 },
      preferredModel === "gemini" ? "gemini" : "groq"
    );

    // The source list is deliberately NOT appended to the answer text: the UI
    // renders `webSources` as a structured, linked panel, and duplicating it as
    // raw markdown showed up as literal "[title](url)" under the answer.
    const answer = `${result.text.trim()}\n\n*Answered by ${result.label} in ${(result.latencyMs / 1000).toFixed(1)}s.*`;

    return {
      answer,
      sources: topMatches.map((m) => m.article.id),
      webSources,
      providerUsed: result.label,
      latencyMs: result.latencyMs,
    };
  } catch {
    // All providers exhausted — extractive local answer, clearly labelled.
    return {
      answer: runLocalRag(query, ranked.filter((r) => r.score > 0)),
      sources: topMatches.map((m) => m.article.id),
      webSources,
      providerUsed: "Local Extractive Engine (no AI provider reachable)",
      latencyMs: 0,
    };
  }
}
