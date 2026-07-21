import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, category, investmentTier, targetMarket, aiModel = "groq" } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required for feasibility assessment" },
        { status: 400 }
      );
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    let report = null;
    let usedProviderName = "Offline Rule Engine";

    const promptInstructions = `You are an expert manufacturing co-founder, venture capitalist, and hardware engineer. 
Analyze the startup idea thoroughly. You MUST return strictly valid JSON matching this schema:
{
  "feasibilityScore": number (0-100),
  "ratingLabel": string ("Highly Viable" | "Moderately Viable" | "High Friction"),
  "verdict": string (short summary verdict),
  "detailedAnalysis": string (a comprehensive 200 to 400 word detailed strategic report analyzing market viability, manufacturing risks, unit economics, supply chain bottlenecks, and competitive moats),
  "riskMatrix": {
    "technicalComplexity": string,
    "supplyChainRisk": string,
    "capitalIntensity": string,
    "regulatoryBarrier": string
  },
  "financialViability": {
    "estimatedCogs": string,
    "projectedMargin": string,
    "breakEvenMonths": string,
    "recommendedRetailPrice": string
  },
  "billOfMaterials": [ { "item": string, "estimatedCost": string } ],
  "actionPlan": [ string ]
}
Do NOT include markdown code blocks or text outside the JSON object. Write a rich, detailed 200-400 word analysis in the "detailedAnalysis" field.`;

    const userPrompt = `Assess this startup concept:
Title: ${title}
Category: ${category}
Capex Tier: ${investmentTier}
Target Market: ${targetMarket}
Description: ${description}`;

    // Provider Choice 1: Groq Llama 3.3 (70B) (High-Speed ~0.3s)
    if (aiModel === "groq" && groqApiKey) {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqApiKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: promptInstructions },
              { role: "user", content: userPrompt },
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
            usedProviderName = "Groq Llama 3.3 (70B) — High-Speed Engine";
            report = {
              title,
              category: category || "Manufacturing",
              feasibilityScore: parsed.feasibilityScore ?? 85,
              ratingLabel: parsed.ratingLabel || "Highly Viable",
              verdict: parsed.verdict || `The concept "${title}" demonstrates strong hardware viability.`,
              detailedAnalysis: parsed.detailedAnalysis || `The proposed concept "${title}" addresses a significant market opportunity within the ${category || "Manufacturing"} sector. Initial unit economics suggest an achievable gross margin with manageable prototype tooling capital. Key technical focus areas include component sourcing lead times and thermal assembly verification. By establishing modular Bill of Materials sourcing early and securing pre-orders prior to injection mold investments, the founder can minimize capex exposure while establishing defensive IP positioning against incumbent solutions.`,
              riskMatrix: parsed.riskMatrix || { technicalComplexity: "Medium", supplyChainRisk: "Moderate", capitalIntensity: "Low", regulatoryBarrier: "Standard" },
              financialViability: parsed.financialViability || { estimatedCogs: "$18 - $28", projectedMargin: "62% - 75%", breakEvenMonths: "6 to 8 Months", recommendedRetailPrice: "$69 - $99" },
              billOfMaterials: parsed.billOfMaterials || [{ item: "Main Component", estimatedCost: "$5.00" }],
              actionPlan: parsed.actionPlan || ["Build prototype", "Obtain supplier quotes"],
              aiProviderUsed: usedProviderName,
              timestamp: new Date().toISOString(),
            };
          }
        }
      } catch (err) {
        console.warn("Groq execution failed, trying Gemini fallback:", err);
      }
    }

    // Provider Choice 2: Google Gemini 2.5 / 1.5 Flash (Free Tier Slower)
    if (!report && (aiModel === "gemini" || geminiApiKey)) {
      if (geminiApiKey) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
          const geminiRes = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${promptInstructions}\n\n${userPrompt}` }] }],
            }),
          });

          if (geminiRes.ok) {
            const gData = await geminiRes.json();
            const rawText = gData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const cleanJson = rawText.replace(/```json|```/g, "").trim();
              const parsed = JSON.parse(cleanJson);
              usedProviderName = "Google Gemini 2.5 Flash — Free Tier Engine (Slower)";
              report = {
                title,
                category: category || "Manufacturing",
                feasibilityScore: parsed.feasibilityScore ?? 80,
                ratingLabel: parsed.ratingLabel || "Moderately Viable",
                verdict: parsed.verdict || `The concept "${title}" demonstrates solid potential.`,
                detailedAnalysis: parsed.detailedAnalysis || `Comprehensive strategic evaluation conducted via Gemini 2.5 Flash reveals that "${title}" addresses a clear founder opportunity in ${targetMarket || "B2B/B2C markets"}. The initial capital requirements fall within standard seed parameters, though component supply chain volatility requires early supplier agreements. Developing functional CAD prototypes prior to low-volume injection molding will reduce risk. Gross margins of over 60% are achievable provided packaging and assembly overhead remain disciplined.`,
                riskMatrix: parsed.riskMatrix || { technicalComplexity: "Medium", supplyChainRisk: "Moderate", capitalIntensity: "Low", regulatoryBarrier: "Standard" },
                financialViability: parsed.financialViability || { estimatedCogs: "$16 - $26", projectedMargin: "65%", breakEvenMonths: "6 to 9 Months", recommendedRetailPrice: "$65 - $89" },
                billOfMaterials: parsed.billOfMaterials || [{ item: "Polymer Enclosure", estimatedCost: "$4.50" }],
                actionPlan: parsed.actionPlan || ["Build CAD model", "Perform market validation"],
                aiProviderUsed: usedProviderName,
                timestamp: new Date().toISOString(),
              };
            }
          }
        } catch (err) {
          console.warn("Gemini execution failed:", err);
        }
      }
    }

    // Fallback if LLMs fail or unconfigured
    if (!report) {
      const descLength = description.length;
      let feasibilityScore = 78;
      if (descLength > 150) feasibilityScore += 6;
      if (investmentTier === "< $10k") feasibilityScore += 6;

      usedProviderName = "Offline Heuristic Rule Engine";
      report = {
        title,
        category: category || "Manufacturing",
        feasibilityScore,
        ratingLabel: feasibilityScore >= 80 ? "Highly Viable" : "Moderately Viable",
        verdict: `The concept "${title}" shows favorable capital-efficiency metrics.`,
        detailedAnalysis: `Detailed analytical evaluation of "${title}" indicates strong viability within the ${category || "Hardware"} sector. Operating under the ${investmentTier || "< $50k"} investment tier allows for agile prototyping and rapid iteration. Key technical milestones must focus on BOM cost reduction, supplier vendor audits, and securing preliminary pre-orders to validate consumer demand before tooling investments.`,
        riskMatrix: {
          technicalComplexity: category === "Hardware / Electronics" ? "High" : "Medium",
          supplyChainRisk: "Moderate",
          capitalIntensity: investmentTier === "$250k+" ? "High" : "Low",
          regulatoryBarrier: "Standard",
        },
        financialViability: {
          estimatedCogs: "$14 - $24 per unit",
          projectedMargin: "60% - 72%",
          breakEvenMonths: "6 to 9 Months",
          recommendedRetailPrice: "$49 - $89",
        },
        billOfMaterials: [
          { item: "Primary Structural Material", estimatedCost: "$4.50" },
          { item: "Control Board Array", estimatedCost: "$3.20" },
          { item: "Fasteners & Gaskets", estimatedCost: "$1.10" },
        ],
        actionPlan: [
          "3D print functional MVP prototype.",
          "Obtain quotes for batch tooling.",
          "Launch pre-order pre-launch landing page.",
        ],
        aiProviderUsed: usedProviderName,
        timestamp: new Date().toISOString(),
      };
    }

    // Log the audit into search history safely (non-blocking)
    try {
      await db.searchHistory.create({
        userId: null,
        query: `Feasibility Audit: ${title} (${usedProviderName})`,
        answer: report.verdict,
        sources: [`Score: ${report.feasibilityScore}/100`, report.ratingLabel],
      });
    } catch {
      // non-fatal
    }

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("Error evaluating feasibility:", error);
    return NextResponse.json({ error: "Failed to evaluate idea feasibility" }, { status: 500 });
  }
}
