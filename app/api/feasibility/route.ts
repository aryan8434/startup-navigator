import { NextResponse } from "next/server";
import { db, type FeasibilityReport } from "@/lib/db";
import { rankArticles } from "@/lib/rag";
import { gatherEvidence, formatEvidenceForPrompt, type EvidencePack } from "@/lib/evidence";
import { chatJson, isConfigured, type ChatResult, type ProviderId } from "@/lib/providers";
import { computeConfidence } from "@/lib/confidence";
import { validatePitch, buildRejectionReport } from "@/lib/validation";

/**
 * Evidence-grounded feasibility assessment.
 *
 * Pipeline: validate the pitch, pull live external evidence, retrieve internal
 * comparables, run two independent models over the same evidence, reconcile
 * their verdicts, then score how much the result should be trusted.
 */

/** A verdict once titled and merged across models, before metadata is attached. */
interface AssembledReport extends ModelVerdict {
  title: string;
  category: string;
  secondOpinions?: { label: string; score: number; verdict: string }[];
}

interface ModelVerdict {
  feasibilityScore: number;
  ratingLabel: string;
  verdict: string;
  detailedAnalysis: string;
  riskMatrix: {
    technicalComplexity: string;
    supplyChainRisk: string;
    capitalIntensity: string;
    regulatoryBarrier: string;
  };
  financialViability: {
    estimatedCogs: string;
    projectedMargin: string;
    breakEvenMonths: string;
    recommendedRetailPrice: string;
  };
  billOfMaterials: { item: string; estimatedCost: string }[];
  actionPlan: string[];
  evidenceUsed?: number[];
  keyUncertainties?: string[];
}

/* ------------------------------------------------------------------ *
 * Prompting                                                           *
 * ------------------------------------------------------------------ */

function buildSystemPrompt(evidenceBlock: string, internalContext: string, priorContext: string) {
  return `You are a hardware manufacturing co-founder and venture analyst assessing a startup pitch for the Indian market. ALL financial figures MUST be in Indian Rupees (₹ / INR).

You have been given real, retrieved evidence. Ground your analysis in it.

RULES ON EVIDENCE AND HONESTY:
- Cite evidence by its bracket number, e.g. [2], directly inside your analysis text wherever a claim leans on it.
- When the evidence does not cover a claim, say so plainly ("no sourced data available; this is an estimate") instead of inventing precision.
- Do NOT fabricate market sizes, growth rates or company names that are absent from the evidence.
- Prefer a well-reasoned wide range over a falsely precise point estimate.
- Score honestly. A weak idea must receive a low score; do not inflate to be encouraging.

RETRIEVED EXTERNAL EVIDENCE:
${evidenceBlock}

${internalContext}

${priorContext}

Return STRICTLY valid JSON matching this schema (no markdown fences, no prose outside the JSON):
{
  "feasibilityScore": number (0-100; 0-40 High Friction, 41-74 Moderately Viable, 75-100 Highly Viable),
  "ratingLabel": "Highly Viable" | "Moderately Viable" | "High Friction",
  "verdict": string (2-3 sentence executive verdict, ₹ INR),
  "detailedAnalysis": string (8 numbered points separated by DOUBLE newlines \\n\\n. Each point starts with a **Bold Header**: then analysis. Bold key metrics. Use ₹ for money. Cite [n] where evidence supports a claim. Cover: market demand, unit economics, capex and tooling, BOM sourcing, supply chain and regulation, go-to-market, break-even, and a final founder recommendation),
  "riskMatrix": {
    "technicalComplexity": string,
    "supplyChainRisk": string,
    "capitalIntensity": string,
    "regulatoryBarrier": string
  },
  "financialViability": {
    "estimatedCogs": string (₹ range per unit),
    "projectedMargin": string (percentage range),
    "breakEvenMonths": string (between "6 Months" and "5 Years"; if payback exceeds 60 months return "Never"),
    "recommendedRetailPrice": string (₹ range)
  },
  "billOfMaterials": [ { "item": string, "estimatedCost": string (₹) } ],
  "actionPlan": [ string ],
  "evidenceUsed": [ number ] (bracket numbers you actually relied on),
  "keyUncertainties": [ string ] (what you could NOT verify from the evidence)
}`;
}

function buildUserPrompt(body: {
  title: string;
  category?: string;
  investmentTier?: string;
  targetMarket?: string;
  description: string;
}) {
  return `Assess this startup concept:
Title: ${body.title}
Sector: ${body.category || "Manufacturing"}
Capex Tier: ${body.investmentTier || "₹5 Lakhs - ₹25 Lakhs"}
Target Market: ${body.targetMarket || "Indian D2C and B2B buyers"}
Description: ${body.description}`;
}

/* ------------------------------------------------------------------ *
 * Verdict reconciliation                                              *
 * ------------------------------------------------------------------ */

/** Loosely-typed view of whatever the model returned, before validation. */
type RawVerdict = Partial<Record<keyof ModelVerdict, unknown>> & Record<string, unknown>;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function coerceVerdict(input: unknown): ModelVerdict | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as RawVerdict;
  const score = Number(raw.feasibilityScore);
  if (!Number.isFinite(score)) return null;

  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const label =
    clamped >= 75 ? "Highly Viable" : clamped >= 41 ? "Moderately Viable" : "High Friction";

  const risk = asRecord(raw.riskMatrix);
  const money = asRecord(raw.financialViability);

  return {
    feasibilityScore: clamped,
    // Trust our own banding over the model's label so score and label never disagree.
    ratingLabel: label,
    verdict: String(raw.verdict || "").trim() || "No verdict text returned.",
    detailedAnalysis: String(raw.detailedAnalysis || "").trim(),
    riskMatrix: {
      technicalComplexity: String(risk.technicalComplexity ?? "Not assessed"),
      supplyChainRisk: String(risk.supplyChainRisk ?? "Not assessed"),
      capitalIntensity: String(risk.capitalIntensity ?? "Not assessed"),
      regulatoryBarrier: String(risk.regulatoryBarrier ?? "Not assessed"),
    },
    financialViability: {
      estimatedCogs: String(money.estimatedCogs ?? "Not assessed"),
      projectedMargin: String(money.projectedMargin ?? "Not assessed"),
      breakEvenMonths: String(money.breakEvenMonths ?? "Not assessed"),
      recommendedRetailPrice: String(money.recommendedRetailPrice ?? "Not assessed"),
    },
    billOfMaterials: Array.isArray(raw.billOfMaterials)
      ? raw.billOfMaterials
          .map(asRecord)
          .filter((b) => b.item)
          .map((b) => ({ item: String(b.item), estimatedCost: String(b.estimatedCost ?? "—") }))
      : [],
    actionPlan: Array.isArray(raw.actionPlan) ? raw.actionPlan.map(String) : [],
    evidenceUsed: Array.isArray(raw.evidenceUsed) ? raw.evidenceUsed.map(Number).filter(Number.isFinite) : [],
    keyUncertainties: Array.isArray(raw.keyUncertainties) ? raw.keyUncertainties.map(String) : [],
  };
}

export async function POST(request: Request) {
  const startedAt = Date.now();

  try {
    const body = await request.json();
    const {
      title,
      description,
      category,
      investmentTier,
      targetMarket,
      aiModel = "groq",
      consensus = true,
    } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required for feasibility assessment" },
        { status: 400 }
      );
    }

    /* --- 0. Two-stage validation gate ---------------------------------
       Nothing expensive runs until a pitch clears both stages. Stage 1 is a
       free deterministic screen; stage 2 is a single cheap model call that
       judges whether the concept is real-world-plausible at all. A pitch like
       "headphones for fishes" reads as valid English and used to consume the
       whole pipeline — ~34s, 14 source fetches and two model calls — before
       producing a bill of materials for it. */
    const validation = await validatePitch(
      String(title),
      String(description),
      category,
      aiModel === "gemini" ? "gemini" : "groq",
      investmentTier
    );

    if (!validation.valid) {
      return NextResponse.json({
        success: true,
        report: {
          ...buildRejectionReport(String(title), category, validation),
          totalDurationMs: Date.now() - startedAt,
        },
      });
    }

    /* --- 1. Gather external evidence and internal comparables in parallel --- */
    const [evidence, internalMatches, historical] = await Promise.all([
      gatherEvidence({ title, description, category }).catch(
        (): EvidencePack => ({
          items: [],
          sourcesUsed: [],
          failures: [{ source: "all", reason: "evidence layer unavailable" }],
          queryTerms: [],
          durationMs: 0,
          cached: false,
        })
      ),
      (async () => {
        try {
          const articles = await db.articles.findMany();
          return rankArticles(`${title} ${description}`, articles).slice(0, 3);
        } catch {
          return [];
        }
      })(),
      db.feasibilityReports
        .findSimilar({ title, description, category, limit: 5 })
        .catch(() => [] as { report: FeasibilityReport; similarity: number }[]),
    ]);

    const evidenceBlock = formatEvidenceForPrompt(evidence);

    const internalContext =
      internalMatches.length > 0
        ? `INTERNAL NXTVENTURE KNOWLEDGE BASE (founder playbooks already written for this platform):\n${internalMatches
            .map((m) => `- ${m.article.title} (${m.article.category}): ${m.article.summary}`)
            .join("\n")}`
        : "INTERNAL NXTVENTURE KNOWLEDGE BASE: no closely related playbook found.";

    const priorContext =
      historical.length > 0
        ? `PRIOR ASSESSMENTS OF SIMILAR PITCHES ON THIS PLATFORM (for calibration — do not simply copy them):\n${historical
            .map(
              (h) =>
                `- "${h.report.title}" scored ${h.report.feasibilityScore}/100 (${h.report.ratingLabel})`
            )
            .join("\n")}`
        : "PRIOR ASSESSMENTS: none comparable yet.";

    const systemPrompt = buildSystemPrompt(evidenceBlock, internalContext, priorContext);
    const userPrompt = buildUserPrompt({ title, description, category, investmentTier, targetMarket });

    /* --- 2. Run independent models over identical evidence --- */
    const preferred: ProviderId = aiModel === "gemini" ? "gemini" : "groq";
    const secondary: ProviderId = preferred === "groq" ? "gemini" : "groq";

    const runsToDo: ProviderId[] = [preferred];
    if (consensus && isConfigured(secondary)) runsToDo.push(secondary);

    const settled = await Promise.allSettled(
      runsToDo.map(async (provider) => {
        const out = await chatJson<unknown>(
          { system: systemPrompt, user: userPrompt, temperature: 0.25, maxTokens: 6000 },
          provider
        );
        if (!out) throw new Error(`${provider}: unparseable JSON response`);
        const verdict = coerceVerdict(out.data);
        if (!verdict) throw new Error(`${provider}: response missing a usable feasibility score`);
        return { verdict, meta: out.meta as ChatResult, requested: provider };
      })
    );

    const successes = settled
      .filter((s): s is PromiseFulfilledResult<{ verdict: ModelVerdict; meta: ChatResult; requested: ProviderId }> =>
        s.status === "fulfilled"
      )
      .map((s) => s.value);

    const modelErrors = settled
      .filter((s): s is PromiseRejectedResult => s.status === "rejected")
      .map((s) => {
        const reason: unknown = s.reason;
        return (reason instanceof Error ? reason.message : String(reason)).slice(0, 240);
      });

    /* --- 3. Reconcile --- */
    let report: AssembledReport;
    let usedProviderName: string;
    const modelRuns = successes.map((s) => ({
      provider: s.meta.provider,
      model: s.meta.model,
      label: s.meta.label,
      score: s.verdict.feasibilityScore,
      latencyMs: s.meta.latencyMs,
    }));

    if (successes.length === 0) {
      // Every provider failed. Say so honestly rather than dressing placeholder
      // text up as an AI verdict, which is what the previous version did.
      usedProviderName = "Unavailable — all AI providers failed";
      report = {
        title,
        category: category || "Manufacturing",
        feasibilityScore: 0,
        ratingLabel: "Assessment Unavailable",
        verdict:
          "No AI provider could be reached, so no feasibility verdict was produced. The figures below are intentionally blank rather than estimated.",
        detailedAnalysis: `1. **Assessment Could Not Run**: Every configured AI provider failed for this request.\n\n2. **Provider Errors**: ${modelErrors.join(" | ") || "unknown error"}\n\n3. **Evidence Was Still Collected**: ${evidence.items.length} external source${evidence.items.length === 1 ? "" : "s"} were retrieved and are listed below, so the research is not lost.\n\n4. **What To Do**: Check the provider status panel and retry. No numbers are shown because inventing them would be misleading.`,
        riskMatrix: {
          technicalComplexity: "Not assessed",
          supplyChainRisk: "Not assessed",
          capitalIntensity: "Not assessed",
          regulatoryBarrier: "Not assessed",
        },
        financialViability: {
          estimatedCogs: "Not assessed",
          projectedMargin: "Not assessed",
          breakEvenMonths: "Not assessed",
          recommendedRetailPrice: "Not assessed",
        },
        billOfMaterials: [],
        actionPlan: ["Retry once a provider is reachable."],
        keyUncertainties: ["The entire assessment is missing — no model responded."],
      };
    } else {
      // Primary narrative comes from the preferred provider when it answered.
      const primary =
        successes.find((s) => s.requested === preferred) ?? successes[0];
      const others = successes.filter((s) => s !== primary);

      // Reconciled score is the mean across runs, so one outlier model cannot
      // swing the headline number on its own.
      const meanScore = Math.round(
        successes.reduce((acc, s) => acc + s.verdict.feasibilityScore, 0) / successes.length
      );
      const reconciledLabel =
        meanScore >= 75 ? "Highly Viable" : meanScore >= 41 ? "Moderately Viable" : "High Friction";

      usedProviderName =
        successes.length > 1
          ? `${successes.map((s) => s.meta.label).join(" + ")} (consensus)`
          : primary.meta.label;

      report = {
        ...primary.verdict,
        feasibilityScore: meanScore,
        ratingLabel: reconciledLabel,
        title,
        category: category || "Manufacturing",
        secondOpinions: others.map((o) => ({
          label: o.meta.label,
          score: o.verdict.feasibilityScore,
          verdict: o.verdict.verdict,
        })),
        keyUncertainties: [
          ...new Set(successes.flatMap((s) => s.verdict.keyUncertainties || [])),
        ],
      };
    }

    /* --- 4. Score confidence in the verdict --- */
    const confidence = computeConfidence({
      evidence,
      modelScores: successes.map((s) => s.verdict.feasibilityScore),
      providersSucceeded: successes.length,
      pitchTitle: title,
      pitchDescription: description,
      internalKbScore: internalMatches[0]?.score ?? 0,
      historicalNeighbours: historical.map((h) => h.report.feasibilityScore),
    });

    const citedSources = evidence.items.map((item) => ({
      title: item.title,
      url: item.url,
      source: item.source,
      sourceType: item.sourceType,
      snippet: item.snippet,
      retrievedAt: item.retrievedAt,
    }));

    const finalReport = {
      ...report,
      validation,
      aiProviderUsed: usedProviderName,
      confidence,
      citedSources,
      modelRuns,
      modelErrors,
      evidenceMeta: {
        sourcesUsed: evidence.sourcesUsed,
        failures: evidence.failures,
        queryTerms: evidence.queryTerms,
        durationMs: evidence.durationMs,
        cached: evidence.cached,
      },
      comparablePitches: historical.map((h) => ({
        title: h.report.title,
        score: h.report.feasibilityScore,
        similarity: Math.round(h.similarity * 100),
      })),
      totalDurationMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    };

    /* --- 5. Persist so the corpus improves future calibration --- */
    try {
      await db.feasibilityReports.create({
        title,
        description,
        category: category || "Manufacturing",
        feasibilityScore: finalReport.feasibilityScore,
        ratingLabel: finalReport.ratingLabel,
        verdict: finalReport.verdict,
        detailedAnalysis: finalReport.detailedAnalysis,
        riskMatrix: finalReport.riskMatrix,
        financialViability: finalReport.financialViability,
        billOfMaterials: finalReport.billOfMaterials || [],
        actionPlan: finalReport.actionPlan || [],
        queryTerms: evidence.queryTerms,
        citedSources,
        confidence,
        modelRuns,
        aiProviderUsed: usedProviderName,
      });

      await db.searchHistory.create({
        userId: null,
        query: `Feasibility Audit: ${title}`,
        answer: finalReport.verdict,
        sources: citedSources.map((s) => s.url),
      });
    } catch {
      // Persistence is best-effort; a read-only filesystem must not fail the request.
    }

    return NextResponse.json({ success: true, report: finalReport });
  } catch (error) {
    console.error("Error evaluating feasibility:", error);
    return NextResponse.json({ error: "Failed to evaluate idea feasibility" }, { status: 500 });
  }
}
