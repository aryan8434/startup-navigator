/**
 * Confidence scoring.
 *
 * The feasibility score answers "is this idea any good?". Confidence answers a
 * different question: "how much should you trust that number?". They are kept
 * deliberately separate — a well-evidenced verdict of 35/100 is far more useful
 * than an unevidenced 90/100, and conflating the two is how pitch tools end up
 * sounding authoritative about nothing.
 *
 * Every factor below is computed from observable facts (how many sources
 * answered, whether two independent models agreed, how specific the pitch was),
 * never asked of the model itself, so the number cannot be talked up by a
 * confident-sounding completion.
 */

import type { EvidencePack } from "./evidence";

export interface ConfidenceFactor {
  key: string;
  label: string;
  /** Contribution actually earned, in points. */
  score: number;
  /** Maximum this factor can contribute. */
  max: number;
  detail: string;
}

export interface ConfidenceResult {
  /** 0-100. */
  score: number;
  band: "Very Low" | "Low" | "Moderate" | "High" | "Very High";
  factors: ConfidenceFactor[];
  summary: string;
  /** Plain-language caveats the UI shows next to the verdict. */
  caveats: string[];
}

export interface ConfidenceInput {
  evidence: EvidencePack;
  /** Feasibility scores returned by each independent model run. */
  modelScores: number[];
  /** Number of providers that answered successfully. */
  providersSucceeded: number;
  pitchTitle: string;
  pitchDescription: string;
  /** Relevance score of the best internal knowledge-base match, if any. */
  internalKbScore?: number;
  /** Feasibility scores of similar pitches assessed previously. */
  historicalNeighbours?: number[];
}

const WEIGHTS = {
  evidenceVolume: 20,
  evidenceAuthority: 18,
  sourceDiversity: 12,
  modelConsensus: 22,
  pitchSpecificity: 14,
  internalKnowledge: 8,
  historicalCalibration: 6,
} as const;

function band(score: number): ConfidenceResult["band"] {
  if (score >= 80) return "Very High";
  if (score >= 65) return "High";
  if (score >= 45) return "Moderate";
  if (score >= 25) return "Low";
  return "Very Low";
}

/** Population standard deviation — the spread across independent model runs. */
function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function computeConfidence(input: ConfidenceInput): ConfidenceResult {
  const factors: ConfidenceFactor[] = [];
  const caveats: string[] = [];

  const items = input.evidence?.items ?? [];
  const scores = input.modelScores.filter((s) => Number.isFinite(s));

  // No verdict means there is nothing to be confident *about*. Scoring the
  // evidence alone would report high confidence in an assessment that never
  // happened, which is the exact failure this module exists to prevent.
  if (scores.length === 0) {
    return {
      score: 0,
      band: "Very Low",
      summary:
        items.length > 0
          ? `No confidence can be assigned: no AI model produced a verdict. ${items.length} source${items.length === 1 ? " was" : "s were"} retrieved and are listed below, but nothing has been assessed against them.`
          : "No confidence can be assigned: no AI model produced a verdict and no external evidence could be retrieved.",
      factors: [],
      caveats: [
        "No model returned an assessment, so there is no verdict to trust. Any figures shown are placeholders, not estimates.",
      ],
    };
  }

  /* 1. Evidence volume — how much external material backs the verdict. */
  const volumeRatio = Math.min(items.length / 10, 1);
  const volumeScore = Math.round(volumeRatio * WEIGHTS.evidenceVolume);
  factors.push({
    key: "evidenceVolume",
    label: "Evidence volume",
    score: volumeScore,
    max: WEIGHTS.evidenceVolume,
    detail: `${items.length} external source${items.length === 1 ? "" : "s"} retrieved and cited.`,
  });
  if (items.length === 0) {
    caveats.push(
      "No external sources could be retrieved, so every figure in this report is an unverified model estimate."
    );
  } else if (items.length < 4) {
    caveats.push("Thin evidence base — treat the financial ranges as directional only.");
  }

  /* 2. Authority — official statistics count for more than forum posts. */
  const avgAuthority =
    items.length > 0
      ? items.reduce((acc, i) => acc + i.authority, 0) / items.length
      : 0;
  const authorityScore = Math.round(avgAuthority * WEIGHTS.evidenceAuthority);
  factors.push({
    key: "evidenceAuthority",
    label: "Source authority",
    score: authorityScore,
    max: WEIGHTS.evidenceAuthority,
    detail:
      items.length > 0
        ? `Mean source authority ${(avgAuthority * 100).toFixed(0)}%, weighted toward official statistics and peer-reviewed work.`
        : "No sources to weigh.",
  });

  /* 3. Diversity — independent kinds of source corroborating each other. */
  const types = new Set(items.map((i) => i.sourceType));
  const diversityScore = Math.round(
    Math.min(types.size / 4, 1) * WEIGHTS.sourceDiversity
  );
  factors.push({
    key: "sourceDiversity",
    label: "Source diversity",
    score: diversityScore,
    max: WEIGHTS.sourceDiversity,
    detail: `${types.size} independent source type${types.size === 1 ? "" : "s"} (${[...types].join(", ") || "none"}).`,
  });
  if (types.size === 1 && items.length > 0) {
    caveats.push("All evidence came from a single class of source — corroboration is weak.");
  }

  /* 4. Consensus — do independently-run models land on the same number?
        The zero-score case returned early above, so at least one exists here. */
  let consensusScore: number;
  let consensusDetail: string;

  if (scores.length < 2) {
    // A single run earns roughly half credit: not contradicted, but not corroborated.
    consensusScore = Math.round(WEIGHTS.modelConsensus * 0.45);
    consensusDetail =
      "Only one model produced a verdict, so cross-model agreement could not be measured.";
    caveats.push("Single-model verdict — no independent second opinion was available.");
  } else {
    const spread = stdDev(scores);
    // 0 spread = perfect agreement; >=20 points apart = no agreement.
    const agreement = Math.max(0, 1 - spread / 20);
    consensusScore = Math.round(agreement * WEIGHTS.modelConsensus);
    consensusDetail = `${scores.length} independent models scored [${scores.join(", ")}], spread ±${spread.toFixed(1)} points.`;
    if (spread > 12) {
      caveats.push(
        `Models disagreed substantially (±${spread.toFixed(0)} points) — the verdict is genuinely uncertain.`
      );
    }
  }
  factors.push({
    key: "modelConsensus",
    label: "Cross-model agreement",
    score: consensusScore,
    max: WEIGHTS.modelConsensus,
    detail: consensusDetail,
  });

  /* 5. Specificity — a vague pitch cannot produce a trustworthy assessment. */
  const desc = (input.pitchDescription || "").trim();
  const words = desc.split(/\s+/).filter(Boolean).length;
  const hasNumbers = /\d/.test(desc);
  const hasMaterials =
    /material|component|steel|plastic|sensor|motor|battery|pcb|mould|mold|resin|fabric|alloy|chip|module|polymer/i.test(
      desc
    );
  const hasMarket = /customer|market|user|buyer|segment|b2b|d2c|retail|wholesale/i.test(desc);

  let specificityRatio = Math.min(words / 90, 1) * 0.55;
  if (hasNumbers) specificityRatio += 0.15;
  if (hasMaterials) specificityRatio += 0.15;
  if (hasMarket) specificityRatio += 0.15;
  specificityRatio = Math.min(specificityRatio, 1);

  const specificityScore = Math.round(specificityRatio * WEIGHTS.pitchSpecificity);
  factors.push({
    key: "pitchSpecificity",
    label: "Pitch specificity",
    score: specificityScore,
    max: WEIGHTS.pitchSpecificity,
    detail: `${words} words${hasNumbers ? ", includes figures" : ", no figures given"}${hasMaterials ? ", names materials" : ""}${hasMarket ? ", defines a market" : ""}.`,
  });
  if (words < 25) {
    caveats.push("The pitch is very short — adding materials, volumes and a target buyer will sharpen this report.");
  }

  /* 6. Internal knowledge base overlap. */
  const kb = input.internalKbScore ?? 0;
  const kbScore = Math.round(Math.min(kb / 60, 1) * WEIGHTS.internalKnowledge);
  factors.push({
    key: "internalKnowledge",
    label: "Internal knowledge match",
    score: kbScore,
    max: WEIGHTS.internalKnowledge,
    detail:
      kb > 0
        ? `Matched existing NxtVenture guides and prior reports (relevance ${kb.toFixed(0)}).`
        : "No comparable material in the internal knowledge base.",
  });

  /* 7. Historical calibration — does this land where similar pitches landed? */
  const neighbours = input.historicalNeighbours ?? [];
  let calibrationScore = 0;
  let calibrationDetail = "No comparable past assessments yet — the calibration set grows with use.";

  if (neighbours.length > 0 && scores.length > 0) {
    const currentMean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const historicalMean = neighbours.reduce((a, b) => a + b, 0) / neighbours.length;
    const drift = Math.abs(currentMean - historicalMean);
    const alignment = Math.max(0, 1 - drift / 30);
    calibrationScore = Math.round(alignment * WEIGHTS.historicalCalibration);
    const driftPts = Number(drift.toFixed(0));
    calibrationDetail = `Compared against ${neighbours.length} similar past assessment${neighbours.length === 1 ? "" : "s"} (mean ${historicalMean.toFixed(0)}/100, drift ${driftPts} point${driftPts === 1 ? "" : "s"}).`;
    if (drift > 25) {
      caveats.push(
        "This verdict diverges sharply from how comparable pitches scored previously."
      );
    }
  }
  factors.push({
    key: "historicalCalibration",
    label: "Historical calibration",
    score: calibrationScore,
    max: WEIGHTS.historicalCalibration,
    detail: calibrationDetail,
  });

  const total = factors.reduce((acc, f) => acc + f.score, 0);
  const maxTotal = factors.reduce((acc, f) => acc + f.max, 0);
  const score = Math.max(0, Math.min(100, Math.round((total / maxTotal) * 100)));
  const resolvedBand = band(score);

  const summary =
    `${resolvedBand} confidence (${score}/100). ` +
    (items.length > 0
      ? `Grounded in ${items.length} cited source${items.length === 1 ? "" : "s"} across ${types.size} source type${types.size === 1 ? "" : "s"}`
      : "No external evidence was retrievable") +
    (scores.length >= 2
      ? `, corroborated by ${scores.length} independent models.`
      : scores.length === 1
        ? ", from a single model verdict."
        : ".");

  return { score, band: resolvedBand, factors, summary, caveats };
}
