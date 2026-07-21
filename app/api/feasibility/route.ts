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

    const groqApiKey = process.env.GROQ_API_KEY;

    let report = null;

    if (groqApiKey) {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqApiKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content:
                  "You are an expert manufacturing co-founder, venture capitalist, and hardware engineer. Analyze startup ideas and return strictly JSON containing: feasibilityScore (number 0-100), ratingLabel (string), verdict (string), riskMatrix ({technicalComplexity, supplyChainRisk, capitalIntensity, regulatoryBarrier}), financialViability ({estimatedCogs, projectedMargin, breakEvenMonths, recommendedRetailPrice}), billOfMaterials ([{item, estimatedCost}]), actionPlan ([string]). Do NOT include markdown code fences or outside text.",
              },
              {
                role: "user",
                content: `Assess this startup concept:
Title: ${title}
Category: ${category}
Capex Tier: ${investmentTier}
Target Market: ${targetMarket}
Description: ${description}`,
              },
            ],
            temperature: 0.3,
            response_format: { type: "json_object" },
          }),
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          const rawJson = data.choices?.[0]?.message?.content;
          if (rawJson) {
            const parsed = JSON.parse(rawJson);
            report = {
              title,
              category: category || "Manufacturing",
              feasibilityScore: parsed.feasibilityScore ?? 82,
              ratingLabel: parsed.ratingLabel || (parsed.feasibilityScore >= 80 ? "Highly Viable" : "Moderately Viable"),
              riskMatrix: parsed.riskMatrix || {
                technicalComplexity: "Medium",
                supplyChainRisk: "Moderate",
                capitalIntensity: "Low",
                regulatoryBarrier: "Standard",
              },
              financialViability: parsed.financialViability || {
                estimatedCogs: "$15 - $28",
                projectedMargin: "60% - 75%",
                breakEvenMonths: "6 to 9 Months",
                recommendedRetailPrice: "$59 - $99",
              },
              billOfMaterials: parsed.billOfMaterials || [
                { item: "Primary Structural Material", estimatedCost: "$5.00" },
                { item: "Control Board / Sensor Array", estimatedCost: "$4.50" },
              ],
              actionPlan: parsed.actionPlan || [
                "Build initial 3D printed functional prototype.",
                "Source low-volume batch supplier quotes.",
              ],
              verdict: parsed.verdict || `The concept "${title}" shows strong market feasibility.`,
              timestamp: new Date().toISOString(),
            };
          }
        }
      } catch (llmErr) {
        console.error("Groq AI evaluation failed, resorting to fallback logic:", llmErr);
      }
    }

    // Fallback if LLM is unavailable or fails
    if (!report) {
      const descLength = description.length;
      let feasibilityScore = 75;
      if (descLength > 150) feasibilityScore += 8;
      if (investmentTier === "< $10k") feasibilityScore += 7;
      if (investmentTier === "$250k+") feasibilityScore -= 6;
      feasibilityScore = Math.min(96, Math.max(45, feasibilityScore));

      const technicalComplexity =
        category === "Hardware / Electronics" || category === "Industrial Automation" ? "High" : "Medium";
      const supplyChainRisk =
        category === "BioTech / Healthcare" || category === "GreenTech / Sustainability" ? "Medium-High" : "Moderate";
      const capitalIntensity =
        investmentTier === "$250k+" ? "High" : investmentTier === "$50k - $250k" ? "Moderate" : "Low";
      const regulatoryBarrier =
        category === "BioTech / Healthcare" || category === "FMCG / Consumer Goods" ? "High (FDA/ISO)" : "Standard";

      report = {
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
        verdict: `The concept "${title}" shows strong potential with a feasibility score of ${feasibilityScore}/100. Target market (${
          targetMarket || "General SMBs"
        }) has growing demand, and initial capital requirement is well within the ${
          investmentTier || "$10k-$50k"
        } tier. Focus heavily on securing component suppliers early to mitigate lead-time risks.`,
        timestamp: new Date().toISOString(),
      };
    }

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
