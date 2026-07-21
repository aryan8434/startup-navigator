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
    const geminiApiKey = process.env.GEMINI_API_KEY;

    let report = null;

    // Provider 1: Groq Llama 3.3 (70B)
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
        console.error("Groq AI evaluation failed, attempting Gemini fallback:", llmErr);
      }
    }

    // Provider 2: Google Gemini 2.5 / 1.5 Flash (Free Tier)
    if (!report && geminiApiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
        const prompt = `Analyze startup concept and output valid JSON: { "feasibilityScore": 82, "ratingLabel": "Highly Viable", "verdict": "string", "riskMatrix": { "technicalComplexity": "Medium", "supplyChainRisk": "Moderate", "capitalIntensity": "Low", "regulatoryBarrier": "Standard" }, "financialViability": { "estimatedCogs": "$15-$25", "projectedMargin": "60%", "breakEvenMonths": "6 Months", "recommendedRetailPrice": "$69" }, "billOfMaterials": [{"item": "Part 1", "estimatedCost": "$5"}], "actionPlan": ["Step 1"] }. Title: ${title}, Description: ${description}`;

        const geminiRes = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });

        if (geminiRes.ok) {
          const gData = await geminiRes.json();
          const rawText = gData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const cleanJson = rawText.replace(/```json|```/g, "").trim();
            const parsed = JSON.parse(cleanJson);
            report = {
              title,
              category: category || "Manufacturing",
              feasibilityScore: parsed.feasibilityScore ?? 80,
              ratingLabel: parsed.ratingLabel || "Moderately Viable",
              riskMatrix: parsed.riskMatrix || { technicalComplexity: "Medium", supplyChainRisk: "Moderate", capitalIntensity: "Low", regulatoryBarrier: "Standard" },
              financialViability: parsed.financialViability || { estimatedCogs: "$15 - $25", projectedMargin: "65%", breakEvenMonths: "6 to 8 Months", recommendedRetailPrice: "$59" },
              billOfMaterials: parsed.billOfMaterials || [{ item: "Structural Core", estimatedCost: "$4.00" }],
              actionPlan: parsed.actionPlan || ["Create 3D prototype", "Perform cost analysis"],
              verdict: parsed.verdict || `The concept "${title}" was analyzed via Gemini 2.5 Flash.`,
              timestamp: new Date().toISOString(),
            };
          }
        }
      } catch (geminiErr) {
        console.error("Gemini AI evaluation failed:", geminiErr);
      }
    }

    // Fallback algorithmic scoring if LLM calls are unconfigured or fail
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

    // Safely log the audit into search history (non-blocking)
    try {
      await db.searchHistory.create({
        userId: null,
        query: `Feasibility Audit: ${title}`,
        answer: report.verdict,
        sources: [`Score: ${report.feasibilityScore}/100`, report.ratingLabel],
      });
    } catch (logErr) {
      console.warn("Feasibility log save failed non-fatally:", logErr);
    }

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("Error evaluating feasibility:", error);
    return NextResponse.json({ error: "Failed to evaluate idea feasibility" }, { status: 500 });
  }
}
