import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, category, investmentTier, targetMarket } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required for feasibility assessment" },
        { status: 400 }
      );
    }

    const descLength = description.length;
    const titleTokens = title.toLowerCase().split(/\s+/);
    
    // Algorithmic Base Scoring logic
    let feasibilityScore = 75;
    if (descLength > 150) feasibilityScore += 8;
    if (investmentTier === "< $10k") feasibilityScore += 7;
    if (investmentTier === "$250k+") feasibilityScore -= 6;

    // Cap between 45 and 96
    feasibilityScore = Math.min(96, Math.max(45, feasibilityScore));

    const technicalComplexity = category === "Hardware / Electronics" || category === "Industrial Automation" ? "High" : "Medium";
    const supplyChainRisk = category === "BioTech / Healthcare" || category === "GreenTech / Sustainability" ? "Medium-High" : "Moderate";
    const capitalIntensity = investmentTier === "$250k+" ? "High" : investmentTier === "$50k - $250k" ? "Moderate" : "Low";
    const regulatoryBarrier = category === "BioTech / Healthcare" || category === "FMCG / Consumer Goods" ? "High (FDA/ISO)" : "Standard";

    const report = {
      title,
      category: category || "Manufacturing",
      feasibilityScore,
      ratingLabel: feasibilityScore >= 80 ? "Highly Viable" : feasibilityScore >= 65 ? "Moderately Viable" : "High Friction",
      riskMatrix: {
        technicalComplexity,
        supplyChainRisk,
        capitalIntensity,
        regulatoryBarrier,
      },
      financialViability: {
        estimatedCogs: "$12 - $24 per unit",
        projectedMargin: "58% - 72%",
        breakEvenMonths: "6 to 9 Months",
        recommendedRetailPrice: "$49 - $89",
      },
      billOfMaterials: [
        { item: "Primary Structural Component / Polymer Stock", estimatedCost: "$4.50" },
        { item: "Electronic Micro-Controller / Modular Sensor", estimatedCost: "$3.20" },
        { item: "Precision Fasteners & Seal Gaskets", estimatedCost: "$1.10" },
        { item: "Custom Eco-Branded Packaging & User Guide", estimatedCost: "$0.90" },
      ],
      actionPlan: [
        "Create initial CAD assembly and 3D print a functional prototype.",
        "Obtain supplier quotes for mold tooling and low-volume batch production (100 units).",
        "Perform regulatory compliance audit (FCC/CE/ISO certifications).",
        "Set up a high-converting landing page to collect 100 pre-orders before mass production.",
      ],
      verdict: `The concept "${title}" shows strong potential with a feasibility score of ${feasibilityScore}/100. Target market (${targetMarket || "General SMBs"}) has growing demand, and initial capital requirement is well within the ${investmentTier || "$10k-$50k"} tier. Focus heavily on securing component suppliers early to mitigate lead-time risks.`,
      timestamp: new Date().toISOString(),
    };

    // Log the audit into search history for founder dashboard tracking
    await db.searchHistory.create({
      userId: null,
      query: `Feasibility Audit: ${title}`,
      answer: report.verdict,
      sources: [`Score: ${report.feasibilityScore}/100`, report.ratingLabel],
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("Error evaluating feasibility:", error);
    return NextResponse.json({ error: "Failed to evaluate idea feasibility" }, { status: 500 });
  }
}
