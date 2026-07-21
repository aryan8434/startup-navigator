import { db, Article } from "./db";

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
  topMatches.forEach((match, index) => {
    const snippet = extractSummaries(match.article.content, queryTokens);
    answer += `#### From: **${match.article.title}** (${match.article.category})\n\n`;
    answer += `${snippet}\n\n`;
  });

  answer += `*Note: The answer above is dynamically extracted and summarized from our offline knowledge base articles. If you configure a model API Key in your environment, this interface will use generative summaries.*`;

  return answer;
}

/**
 * Call Gemini 2.5 / 1.5 Flash API via HTTP POST.
 */
async function callGemini(query: string, context: string, apiKey: string): Promise<string | null> {
  try {
    // Try Gemini 2.5 Flash / 1.5 Flash endpoints
    const models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-pro"];
    
    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const prompt = `You are the NxtVenture AI Assistant, a helpful expert guide for startup founders.
Answer the user's question using ONLY the provided context articles. 
Ensure your answer is friendly, professionally formatted in Markdown, and directly references parts of the context where applicable.
If the answer cannot be found in the context articles, say: "I couldn't find a direct answer in our startup guide database, but based on general knowledge..." and then provide a helpful answer based on general startup principles, but clearly mark it as general advice.

Context Articles:
${context}

User Question:
${query}

Answer in clean Markdown:`;

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }]
              }
            ]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return `${text}\n\n*Source Model: Google Gemini 2.5 Flash (Free Tier - Medium Speed)*`;
          }
        }
      } catch (err) {
        console.warn(`Gemini model ${model} invocation failed:`, err);
      }
    }
    return null;
  } catch (error) {
    console.error("Error invoking Gemini:", error);
    return null;
  }
}

/**
 * Call OpenAI API via HTTP POST.
 */
async function callOpenAI(query: string, context: string, apiKey: string): Promise<string | null> {
  try {
    const url = "https://api.openai.com/v1/chat/completions";
    const prompt = `You are the NxtVenture AI Assistant, a helpful expert guide for startup founders.
Answer the user's question using ONLY the provided context articles. 
Ensure your answer is friendly, professionally formatted in Markdown, and directly references parts of the context where applicable.
If the answer cannot be found in the context articles, say: "I couldn't find a direct answer in our startup guide database, but based on general knowledge..." and then provide a helpful answer based on general startup principles, but clearly mark it as general advice.

Context Articles:
${context}

User Question:
${query}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful startup mentor." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      console.error("OpenAI API error status:", response.status);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error("Error invoking OpenAI:", error);
    return null;
  }
}

/**
 * Call Groq Cloud API via HTTP POST.
 */
async function callGroq(query: string, context: string, apiKey: string): Promise<string | null> {
  try {
    const url = "https://api.groq.com/openai/v1/chat/completions";
    const prompt = `You are the NxtVenture AI Assistant, a helpful expert guide for startup founders.
Answer the user's question using ONLY the provided context articles. 
Ensure your answer is friendly, professionally formatted in Markdown, and directly references parts of the context where applicable.
If the answer cannot be found in the context articles, say: "I couldn't find a direct answer in our startup guide database, but based on general knowledge..." and then provide a helpful answer based on general startup principles, but clearly mark it as general advice.

Context Articles:
${context}

User Question:
${query}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a helpful startup mentor." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      console.error("Groq API error status:", response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      return `${content}\n\n*Source Model: Groq Llama 3.3 (70B) (High-Speed Engine)*`;
    }
    return null;
  } catch (error) {
    console.error("Error invoking Groq:", error);
    return null;
  }
}

/**
 * Core RAG execution function with sequential multi-provider fallback.
 */
export async function executeRagSearch(
  query: string,
  preferredModel: string = "groq"
): Promise<{ answer: string; sources: string[] }> {
  const articles = await db.articles.findMany();
  const ideas = await db.ideas.findMany();

  // Convert ideas to article format for RAG indexing
  const ideaArticles: Article[] = ideas.map((idea) => ({
    id: idea.id,
    title: `[Manufacturing Idea] ${idea.title}`,
    category: idea.category,
    summary: idea.tagline,
    content: `Idea: ${idea.title}\nCategory: ${idea.category}\nInvestment Tier: ${idea.investmentTier}\nMargin: ${idea.profitMargin}\nTAM: ${idea.tam}\nProblem: ${idea.problemStatement}\nSolution: ${idea.proposedSolution}\nBOM: ${idea.billOfMaterials.map(b => `${b.item} (${b.costPerUnit})`).join(", ")}\nProcess: ${idea.manufacturingProcess.join(" -> ")}`,
    tags: idea.tags,
    createdAt: idea.createdAt,
    updatedAt: idea.updatedAt,
  }));

  const combined = [...articles, ...ideaArticles];
  const ranked = rankArticles(query, combined);
  
  // Get top 3 items for context
  const topMatches = ranked.filter(r => r.score > 0).slice(0, 3);

  // Generate context string
  const contextParts = topMatches.map(
    (m) => `Title: ${m.article.title}\nCategory: ${m.article.category}\nContent:\n${m.article.content}`
  );
  const context = contextParts.join("\n\n---\n\n");

  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  let answer: string | null = null;

  if (preferredModel === "gemini" && geminiKey) {
    answer = await callGemini(query, context, geminiKey);
    if (!answer && groqKey) {
      answer = await callGroq(query, context, groqKey);
    }
  } else {
    // Default: Prefer Groq Llama 3.3 (70B)
    if (groqKey) {
      answer = await callGroq(query, context, groqKey);
    }
    if (!answer && geminiKey) {
      answer = await callGemini(query, context, geminiKey);
    }
  }

  // Provider 3: OpenAI GPT-4o-mini
  if (!answer && openaiKey) {
    answer = await callOpenAI(query, context, openaiKey);
  }

  // Fallback to local extractive RAG if AI APIs fail or return null
  if (!answer) {
    answer = runLocalRag(query, ranked.filter(r => r.score > 0));
  }

  return {
    answer,
    sources: topMatches.map(m => m.article.id)
  };
}
