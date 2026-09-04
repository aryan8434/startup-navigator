/**
 * Two-stage pitch validation, run before any expensive assessment work.
 *
 * Stage 1 (deterministic, free): empty input, too-short input, keyboard mash.
 * Stage 2 (AI gate, one cheap call): is this a coherent, real-world-plausible
 *   product or business concept at all?
 *
 * Stage 2 exists because stage 1 only judges whether the text is *language*.
 * A pitch like "headphones worth ₹100,000 for fishes" is perfectly well-formed
 * English made of real words, so it sailed through the regex shield and then
 * consumed ~34 seconds, fourteen source fetches and two model calls to produce
 * a bill of materials and a go-to-market plan for fish headphones. Nonsense
 * that reads like a sentence has to be caught by something that understands
 * meaning, and it has to be caught before the pipeline spends anything.
 */

import { chatJson, isConfigured, type ProviderId } from "./providers";
import { gatherQuickContext } from "./evidence";

export type RejectionCode =
  | "empty"
  | "too-short"
  | "gibberish"
  | "not-a-product"
  | "implausible"
  | "self-contradictory"
  | "no-differentiation"
  | "capital-mismatch";

export interface ValidationResult {
  valid: boolean;
  /** Which stage decided. "passed" means both stages cleared it. */
  stage: "deterministic" | "ai-gate" | "passed";
  code: RejectionCode | null;
  /** Why it was rejected, addressed to the founder. */
  reason: string;
  /** What to change to get a real assessment. */
  guidance: string;
  /** Populated when the AI gate actually ran. */
  gate?: {
    model: string;
    label: string;
    latencyMs: number;
    /** The gate's own read of how well-formed the concept is, 0-100. */
    clarityScore: number;
    /** True when the gate could not be reached and the pitch was let through. */
    failedOpen?: boolean;
    /** Present on a capital-mismatch rejection: what the gate thinks it really costs. */
    realisticCapitalInr?: string;
  };
}

const REJECTION_GUIDANCE: Record<RejectionCode, string> = {
  empty: "Enter a product title and a description of what it is and who buys it.",
  "too-short":
    "Describe what the product physically is, the key materials or components, and who would buy it. Aim for at least 25 words.",
  gibberish:
    "The text does not read as language. Rewrite the pitch as plain sentences describing a real product.",
  "not-a-product":
    "Describe a specific product or service someone could build and sell, rather than a goal, a question, or a general statement.",
  implausible:
    "Rework the concept so it targets customers who can actually buy and use it, and so it does not depend on something physically impossible.",
  "self-contradictory":
    "The pitch contradicts itself. Make the product, its buyer and its price point consistent with each other.",
  "no-differentiation":
    "State what you do that the established players do not — a specific technical edge, a cost structure, an underserved segment, or a distribution channel they cannot reach. Going head-on with an incumbent on the same product is not a plan.",
  "capital-mismatch":
    "Align the capital with the concept. Either scope the product down to what the stated budget can actually build, or state a budget that matches what this genuinely costs to start.",
};

/* ------------------------------------------------------------------ *
 * Stage 1 — deterministic screening (no network, no cost)             *
 * ------------------------------------------------------------------ */

export function screenDeterministic(title: string, description: string): ValidationResult {
  const t = (title || "").trim();
  const d = (description || "").trim();

  const pass: ValidationResult = {
    valid: true,
    stage: "passed",
    code: null,
    reason: "",
    guidance: "",
  };

  if (t.length === 0 || d.length === 0) {
    return {
      valid: false,
      stage: "deterministic",
      code: "empty",
      reason: "The pitch is missing a title or a description.",
      guidance: REJECTION_GUIDANCE.empty,
    };
  }

  if (t.length < 3) {
    return {
      valid: false,
      stage: "deterministic",
      code: "too-short",
      reason: "The product title is too short to identify a concept.",
      guidance: REJECTION_GUIDANCE["too-short"],
    };
  }

  if (d.length < 15) {
    return {
      valid: false,
      stage: "deterministic",
      code: "too-short",
      reason: "The description is too short to assess.",
      guidance: REJECTION_GUIDANCE["too-short"],
    };
  }

  const combined = `${t} ${d}`.toLowerCase();
  const words = combined.split(/\s+/).filter(Boolean);

  if (/(asdf|qwer|zxcv|hjkl|fgbfg|ghfng|wasd|1234|abcd)/i.test(combined)) {
    return {
      valid: false,
      stage: "deterministic",
      code: "gibberish",
      reason: "The input contains keyboard-mash text.",
      guidance: REJECTION_GUIDANCE.gibberish,
    };
  }

  // A real word almost always carries a vowel, and long consonant runs do not
  // occur in English outside abbreviations, which are short.
  let badWords = 0;
  for (const word of words) {
    const alpha = word.replace(/[^a-z]/g, "");
    if (alpha.length < 4) continue;
    const vowels = (alpha.match(/[aeiouy]/g) || []).length;
    const longConsonantRun = /[bcdfghjklmnpqrstvwxz]{5,}/.test(alpha);
    if (vowels === 0 || longConsonantRun || vowels / alpha.length < 0.15) badWords++;
  }

  const substantial = words.filter((w) => w.replace(/[^a-z]/g, "").length >= 4).length;
  if (substantial >= 3 && badWords / substantial > 0.5) {
    return {
      valid: false,
      stage: "deterministic",
      code: "gibberish",
      reason: "Most words in the pitch are not recognisable language.",
      guidance: REJECTION_GUIDANCE.gibberish,
    };
  }

  if (words.length < 6) {
    return {
      valid: false,
      stage: "deterministic",
      code: "too-short",
      reason: "The pitch does not contain enough words to analyse.",
      guidance: REJECTION_GUIDANCE["too-short"],
    };
  }

  return pass;
}

/* ------------------------------------------------------------------ *
 * Stage 2 — AI plausibility gate                                      *
 * ------------------------------------------------------------------ */

interface GateResponse {
  isValidConcept?: boolean;
  rejectionCode?: string;
  reason?: string;
  clarityScore?: number;
  /** The gate's own estimate of realistic starting capital, when it rejects on that basis. */
  realisticCapitalInr?: string | null;
}

const GATE_SYSTEM = `You are a triage filter sitting in front of an expensive startup-analysis pipeline. Your only job is to decide whether a pitch is worth assessing at all. You are NOT scoring quality or profitability — a boring, thin, or low-margin idea still passes.

Return STRICT JSON:
{
  "isValidConcept": boolean,
  "rejectionCode": "gibberish" | "not-a-product" | "implausible" | "self-contradictory" | "no-differentiation" | "capital-mismatch" | null,
  "reason": string (one plain sentence addressed to the founder, no jargon, naming the specific problem),
  "clarityScore": number 0-100 (how well-specified the concept is; independent of whether it passes),
  "realisticCapitalInr": string (REQUIRED when rejectionCode is "capital-mismatch": your estimate of the minimum capital to start a first small batch in India, e.g. "₹8-20 lakh". Otherwise null.)
}

If more than one code could apply, pick the FIRST that fits in this exact order:
gibberish -> not-a-product -> implausible -> self-contradictory -> no-differentiation -> capital-mismatch.
In particular, "the stated user cannot physically use or buy it" is ALWAYS "implausible", never "self-contradictory". Reserve "self-contradictory" for pitches whose own stated facts conflict (a price that contradicts the stated cost, a buyer that contradicts the stated product).

REJECT (isValidConcept: false) when one of these clearly applies:

- "gibberish": not meaningful language, or random words with no concept behind them.
- "not-a-product": coherent text naming no product or service anyone could build and sell. Goals ("I want to be rich"), questions, greetings and bare statements of intent belong here.
- "implausible": cannot work in the real world — the stated users physically cannot use or buy it, or it requires violating physics.
- "self-contradictory": the pitch's own elements contradict each other so it cannot be assessed.
- "no-differentiation": use this ONLY when ALL THREE of the following hold. If any one fails, do not use this code.
    (a) The category is genuinely DOMINATED — a handful of global players hold overwhelming share and a newcomer cannot sell without displacing them. Examples: smartphone operating systems, web search, social networks, cloud platforms, premium noise-cancelling audio, general e-commerce marketplaces.
    (b) The pitch positions itself directly against those players, or claims parity with them ("compete with Apple", "same features as Sony", "an Indian Amazon", "beat Google").
    (c) It names NO wedge at all. Any concrete edge passes: cheaper local manufacturing, a repairable design, an underserved segment or region, a distribution channel the incumbent cannot reach, a real technical difference. The wedge need not be convincing — only present and specific.
  An explicit claim of PARITY is itself proof that (c) holds — "same features", "same quality", "just like <incumbent>", "equivalent to <incumbent>" is the founder stating outright that there is no wedge, so REJECT.
  Naming a country or market alone is NOT a wedge. "Sold in India", "for the Indian market", "targeting everyone who listens to music" are not edges unless tied to something concrete, such as local manufacturing that undercuts import duty, a price point the incumbent will not serve, or a specific underserved segment.
  CRITICAL — fragmented markets are NOT dominated. Water bottles, clothing, furniture, snacks, packaging, soap, stationery, hand tools, jewellery and most consumer goods have thousands of small profitable players and no incumbent to displace. An ordinary undifferentiated product in a fragmented market is ACCEPTED. "We sell stainless steel reusable water bottles" must PASS: being unremarkable is a quality problem, scored downstream, not a validity problem.
- "capital-mismatch": the stated capital is off by 10x or more from what the concept needs to START A FIRST SMALL BATCH in India — not to reach scale, not to run comfortably, not to compete nationally. Before using this code you MUST fill in "realisticCapitalInr" with your estimate of that minimum starting cost. Reject only if the stated capital is below a tenth of it, or above ten times it.
    * Far too little (rare): the concept has an IRREDUCIBLE capital floor that cannot be shrunk by starting small — semiconductor fabs, automotive assembly plants, licensed pharmaceutical manufacturing, steel mills, airlines. These need crores at absolute minimum.
    * Far too much: a small clothing label, phone-case brand or snack business demanding ₹100 crore when ₹1-2 crore, or even lakhs, would launch it.
  DO NOT reject for "too little" merely because more money would help, or because the founder could not compete at national scale on that budget. Almost any physical product — packaging, food, furniture, textiles, consumer hardware, moulded goods, assembly of bought-in components — can legitimately start in a rented shed on ₹5-25 lakh with manual or semi-automatic processes. Anchors for a first small batch in India: moulded or grown packaging ₹5-20 lakh; garment stitching unit ₹3-15 lakh; food processing ₹5-25 lakh; small-electronics assembly from bought-in modules ₹10-50 lakh; CNC machining shop ₹25 lakh-₹1 crore; injection moulding with own tooling ₹25 lakh-₹1 crore. If the concept fits any of these patterns, its capital is NOT mismatched.
  If you are not confident the gap exceeds 10x, ACCEPT.

ACCEPT (isValidConcept: true) everything else, including:
- Vague or thinly-described but real concepts ("a water bottle company") — under-specification is scored downstream, not here.
- Crowded, boring, low-margin or probably-unprofitable ideas. A bad business is still a real business.
- Niche, unusual or premium concepts a real buyer could plausibly want.
- Products for animals where a HUMAN is the buyer and operator: pet GPS collars, aquarium filters, automatic feeders, livestock health monitors, tank sound systems. Large real markets — ACCEPT.

Two boundaries to hold precisely:

1. Animals: reject only when the stated user is an animal that could not physically wear, operate or benefit from the thing as described. "Headphones for fishes" is rejected because a fish cannot wear headphones and hears through water. "Underwater speaker for aquariums" is accepted.

2. Competition: "no-differentiation" needs a dominant incumbent, a head-on positioning against it, AND no stated wedge. Entering a merely crowded or competitive market with an ordinary product is ACCEPTED. When unsure whether a market is dominated or merely crowded, treat it as crowded and ACCEPT.

Your default is ACCEPT. Reject only when a rule above clearly fires; ambiguity resolves to ACCEPT, because a weak idea is cheap to assess downstream while a wrongly-rejected real idea never gets assessed at all.

You may be given retrieved context about the category and who already operates in it. Use it to ground the incumbent and capital judgements. If the context is empty or unhelpful, judge from the pitch alone — never invent a market fact to justify a rejection.

Judge the concept as written. Do not repair it, do not assume a more sensible version, and do not reward confident phrasing.`;

/**
 * One cheap model call deciding whether the pipeline should run at all.
 *
 * Fails open: if no provider answers, the pitch proceeds to full assessment.
 * Blocking a legitimate idea because of an outage would be a worse failure than
 * occasionally assessing a bad one, and a total outage is already surfaced by
 * the assessment itself.
 */
export async function screenWithAi(
  title: string,
  description: string,
  category?: string,
  preferred: ProviderId = "groq",
  investmentTier?: string
): Promise<ValidationResult> {
  if (!isConfigured("groq") && !isConfigured("gemini") && !isConfigured("openai")) {
    return {
      valid: true,
      stage: "passed",
      code: null,
      reason: "",
      guidance: "",
      gate: { model: "none", label: "No provider configured", latencyMs: 0, clarityScore: 0, failedOpen: true },
    };
  }

  // Ground the incumbent and capital judgements in a quick lookup rather than
  // the model's recall. Non-fatal: an empty result just means judging from the
  // pitch alone, which the prompt explicitly allows.
  const context = await gatherQuickContext({ title, description, category }).catch(() => null);

  const contextBlock =
    context && context.items.length > 0
      ? context.items
          .map((i) => `- [${i.source}] ${i.title}: ${i.snippet.slice(0, 220)}`)
          .join("\n")
      : "No context retrieved.";

  const user = `Pitch to triage:
Title: ${title}
Sector: ${category || "unspecified"}
Stated capital available: ${investmentTier || "unspecified"}
Description: ${description}

Retrieved context on this category and who already operates in it:
${contextBlock}`;

  const runSample = async () => {
    const out = await chatJson<GateResponse>(
      {
        system: GATE_SYSTEM,
        user,
        temperature: 0,
        // Reasoning models spend tokens before emitting content; too small a
        // budget returns an empty completion rather than a verdict.
        maxTokens: 2000,
        timeoutMs: 20000,
      },
      preferred
    );
    if (!out) throw new Error("gate returned unparseable JSON");
    return out;
  };

  try {
    // Two samples in parallel. A single call at temperature 0 still varies —
    // reasoning models re-derive the verdict each time — and measured at ~5%
    // it let real junk through ("headphones for fishes" scored 18/100 once).
    // Two independent samples cost the same wall-clock and square that miss
    // rate. A rejection from either wins: the asymmetry is deliberate, since
    // an over-eager gate is corrected by the founder rewording the pitch,
    // while a miss spends the full pipeline producing a bill of materials for
    // something unbuildable.
    const settled = await Promise.allSettled([runSample(), runSample()]);
    const samples = settled
      .filter((s): s is PromiseFulfilledResult<Awaited<ReturnType<typeof runSample>>> =>
        s.status === "fulfilled"
      )
      .map((s) => s.value);

    if (samples.length === 0) throw new Error("no gate sample succeeded");

    const slowest = samples.reduce((a, b) => (a.meta.latencyMs > b.meta.latencyMs ? a : b));
    const clarityScore = Math.round(
      samples.reduce(
        (acc, s) => acc + Math.max(0, Math.min(100, Number(s.data.clarityScore) || 0)),
        0
      ) / samples.length
    );

    const VALID_CODES = [
      "gibberish",
      "not-a-product",
      "implausible",
      "self-contradictory",
      "no-differentiation",
      "capital-mismatch",
    ] as const;

    // When both samples reject for different reasons, take the one earliest in
    // the documented precedence order so the guidance shown stays predictable.
    const rejections = samples
      .filter((s) => s.data.isValidConcept === false)
      .map((s) => {
        const raw = String(s.data.rejectionCode ?? "");
        const code: RejectionCode = (VALID_CODES as readonly string[]).includes(raw)
          ? (raw as RejectionCode)
          : "implausible";
        return { code, data: s.data };
      })
      .sort((a, b) => VALID_CODES.indexOf(a.code as never) - VALID_CODES.indexOf(b.code as never));

    const gate = {
      model: slowest.meta.model,
      label: samples.length > 1 ? `${slowest.meta.label} (2-sample gate)` : slowest.meta.label,
      latencyMs: slowest.meta.latencyMs,
      clarityScore,
    };

    if (rejections.length > 0) {
      const winner = rejections[0];
      const realisticCapitalInr =
        typeof winner.data.realisticCapitalInr === "string" && winner.data.realisticCapitalInr.trim()
          ? winner.data.realisticCapitalInr.trim()
          : undefined;

      return {
        valid: false,
        stage: "ai-gate",
        code: winner.code,
        reason:
          String(winner.data.reason || "").trim() ||
          "The concept was rejected as not assessable.",
        guidance: REJECTION_GUIDANCE[winner.code],
        gate: { ...gate, ...(realisticCapitalInr ? { realisticCapitalInr } : {}) },
      };
    }

    return { valid: true, stage: "passed", code: null, reason: "", guidance: "", gate };
  } catch (err) {
    return {
      valid: true,
      stage: "passed",
      code: null,
      reason: "",
      guidance: "",
      gate: {
        model: "unavailable",
        label: `Gate unavailable (${err instanceof Error ? err.message : String(err)})`.slice(0, 120),
        latencyMs: 0,
        clarityScore: 0,
        failedOpen: true,
      },
    };
  }
}


/** Runs stage 1, and only on success spends a call on stage 2. */
export async function validatePitch(
  title: string,
  description: string,
  category?: string,
  preferred: ProviderId = "groq",
  investmentTier?: string
): Promise<ValidationResult> {
  const deterministic = screenDeterministic(title, description);
  if (!deterministic.valid) return deterministic;
  return screenWithAi(title, description, category, preferred, investmentTier);
}

/* ------------------------------------------------------------------ *
 * Rejection report                                                    *
 * ------------------------------------------------------------------ */

/**
 * The zero-score report returned for a rejected pitch. Deliberately carries no
 * financial figures at all — a rejected concept has no COGS to estimate, and
 * printing one would be the same fabrication this pipeline exists to avoid.
 */
export function buildRejectionReport(
  title: string,
  category: string | undefined,
  validation: ValidationResult
) {
  const stageLabel =
    validation.stage === "deterministic"
      ? "Stage 1 — input screening"
      : "Stage 2 — concept validity gate";

  const notAssessed = "Not assessed";

  return {
    title,
    category: category || "Manufacturing",
    feasibilityScore: 0,
    ratingLabel: "Rejected — Not Assessable",
    verdict: `Rejected at ${stageLabel.toLowerCase()}. ${validation.reason}`,
    detailedAnalysis: `1. **Rejected Before Assessment**: ${validation.reason}\n\n2. **Which Check Caught It**: ${stageLabel}${
      validation.gate ? ` (${validation.gate.label})` : ""
    }.\n\n3. **No Research Was Run**: The pipeline stops at the first failed check, so no external sources were fetched and no full analysis was performed. Running one would have cost time and produced figures for a concept that cannot be assessed.\n\n4. **No Figures Are Shown**: Every financial field is left blank rather than estimated. Inventing a bill of materials for a rejected concept is exactly the failure this gate exists to prevent.\n\n5. **What To Do Next**: ${validation.guidance}`,
    riskMatrix: {
      technicalComplexity: notAssessed,
      supplyChainRisk: notAssessed,
      capitalIntensity: notAssessed,
      regulatoryBarrier: notAssessed,
    },
    financialViability: {
      estimatedCogs: notAssessed,
      projectedMargin: notAssessed,
      breakEvenMonths: notAssessed,
      recommendedRetailPrice: notAssessed,
    },
    billOfMaterials: [],
    actionPlan: [validation.guidance],
    keyUncertainties: [],
    aiProviderUsed:
      validation.stage === "deterministic"
        ? "Stage 1 — Input Screening"
        : `Stage 2 — Concept Validity Gate (${validation.gate?.label ?? "AI"})`,
    validation,
    citedSources: [],
    modelRuns: [],
    modelErrors: [],
    confidence: {
      score: 0,
      band: "Very Low" as const,
      summary: `No confidence can be assigned: the pitch was rejected at ${stageLabel.toLowerCase()} and never assessed.`,
      factors: [],
      caveats: [validation.reason, validation.guidance],
    },
    evidenceMeta: { sourcesUsed: [], failures: [], queryTerms: [], durationMs: 0, cached: false },
    comparablePitches: [],
    timestamp: new Date().toISOString(),
  };
}
