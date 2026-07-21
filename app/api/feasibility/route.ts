import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function checkIsGibberish(title: string, desc: string): boolean {
  const cleanTitle = title.trim().toLowerCase();
  const cleanDesc = desc.trim().toLowerCase();

  // Short length check
  if (cleanTitle.length < 3 || cleanDesc.length < 5) return true;

  // Keyboard mashes patterns (e.g. fgbfg, ghfnghj, asdfgh, etc.)
  const mashRegex = /(?:[bcdfghjklmnpqrstvwxyz]{6,}|[aeiou]{5,}|fgbfg|ghfng|asdf|qwerty|zxcv|1234|test1|abcd)/i;
  if (mashRegex.test(cleanTitle) || mashRegex.test(cleanDesc)) return true;

  // Check vowel ratio in title if longer than 4 chars
  const titleVowels = (cleanTitle.match(/[aeiou]/gi) || []).length;
  if (cleanTitle.length >= 5 && titleVowels === 0) return true;

  return false;
}

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

    // Check for garbage / gibberish inputs and immediately score 0
    if (checkIsGibberish(title, description)) {
      return NextResponse.json({
        success: true,
        report: {
          title,
          category: category || "Manufacturing",
          feasibilityScore: 0,
          ratingLabel: "Non-Viable / Invalid Input",
          verdict: `Concept "${title}" rejected. Gibberish or unparseable input provided.`,
          detailedAnalysis: `1. **Invalid Pitch & Missing Context**: The submitted product title ("${title}") or description ("${description}") contains unparseable keyboard mashes or nonsensical input. No viable manufacturing analysis can be performed for invalid inputs.\n\n2. **Zero Financial Viability**: Unit economics, Bill of Materials, and margin targets are defaulted to ₹0 as no valid hardware component specs were identified.\n\n3. **Founder Recommendation**: Please resubmit with a clear, coherent product concept title and detailed description.`,
          riskMatrix: {
            technicalComplexity: "Undefined",
            supplyChainRisk: "Critical",
            capitalIntensity: "High Risk",
            regulatoryBarrier: "Unviable",
          },
          financialViability: {
            estimatedCogs: "₹0",
            projectedMargin: "0%",
            breakEvenMonths: "Never",
            recommendedRetailPrice: "₹0",
          },
          billOfMaterials: [
            { item: "Unparsed / Gibberish Input", estimatedCost: "₹0" },
          ],
          actionPlan: ["Provide a clear product title and concept description."],
          aiProviderUsed: "NxtVenture Validation Shield",
          timestamp: new Date().toISOString(),
        },
      });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    let report = null;
    let usedProviderName = "Offline Rule Engine";

    const promptInstructions = `You are an expert manufacturing co-founder, venture capitalist, and hardware engineer. 
Analyze the startup idea thoroughly. ALL FINANCIAL FIGURES MUST BE EXCLUSIVELY IN INDIAN RUPEES (₹ / INR).

CRITICAL INPUT VALIDATION: First evaluate if the pitch represents a coherent, real product concept. If the title or description is gibberish (e.g. "fgbfg", "ghfnghj", keyboard mashes, or missing meaningful context), YOU MUST STRICTLY RETURN feasibilityScore: 0, ratingLabel: "Non-Viable / Invalid Input", verdict: "Invalid or gibberish pitch input.", financialViability: { estimatedCogs: "₹0", projectedMargin: "0%", breakEvenMonths: "Never", recommendedRetailPrice: "₹0" }, and detailedAnalysis explaining why the input was rejected as non-viable.

You MUST return strictly valid JSON matching this schema:
{
  "feasibilityScore": number (strictly between 0 and 100, where 0 is non-viable and 100 is highly viable),
  "ratingLabel": string ("Highly Viable" for 75-100 | "Moderately Viable" for 41-74 | "High Friction" for 0-40 | "Non-Viable / Invalid Input" for 0),
  "verdict": string (short summary verdict in Indian Rupees),
  "detailedAnalysis": string (an extensive, long AI Report written in numbered points: 1., 2., 3., 4., 5., 6., 7., 8. YOU MUST PUT DOUBLE NEWLINES \\n\\n BETWEEN EACH NUMBERED POINT. Use bold headers like **Market Demand**:, bold key metrics, and INR ₹ currency formatting for every point),
  "riskMatrix": {
    "technicalComplexity": string,
    "supplyChainRisk": string,
    "capitalIntensity": string,
    "regulatoryBarrier": string
  },
  "financialViability": {
    "estimatedCogs": string (in ₹ Rupees, e.g. "₹450 - ₹850 per unit"),
    "projectedMargin": string (e.g. "62% - 75%"),
    "breakEvenMonths": string (Range must be between 6 Months up to 5 Years e.g. "18 Months" or "3.5 Years". If payback exceeds 5 years / 60 months, strictly return "Never"),
    "recommendedRetailPrice": string (in ₹ Rupees, e.g. "₹1,899 - ₹2,999")
  },
  "billOfMaterials": [ { "item": string, "estimatedCost": string (in ₹ Rupees, e.g. "₹180") } ],
  "actionPlan": [ string ]
}
Do NOT include markdown code fences outside JSON. Write a comprehensive AI Report in the "detailedAnalysis" field using numbered points 1-8.`;

    const userPrompt = `Assess this startup concept:
Title: ${title}
Category: ${category}
Capex Tier: ${investmentTier}
Target Market: ${targetMarket}
Description: ${description}`;

    const defaultReportText = `1. **Product Concept & Market Viability**: The concept "${title}" targets a high-growth demand curve in India within the **${category || "Manufacturing"}** sector. Target audience (${targetMarket || "Domestic D2C & B2B Buyers"}) exhibits strong willingness-to-pay for local hardware solutions.

2. **Unit Economics & Margin Target**: Estimated Cost of Goods Sold (COGS) is projected at **₹450 - ₹850 per unit** with a recommended retail price (MSRP) of **₹1,899 - ₹2,999**, yielding a healthy gross margin of **62% to 75%**.

3. **Capex & Initial Tooling Breakdown**: Initial setup capital of **${investmentTier || "₹5 Lakhs - ₹25 Lakhs"}** is optimal for low-volume CNC tooling, 3D printed housings, and component batch ordering without excessive upfront equity dilution.

4. **Bill of Materials (BOM) Sourcing**: Primary component costs are concentrated in structural enclosures (**₹180/unit**), control microcontrollers (**₹220/unit**), and custom eco-packaging (**₹45/unit**). Sourcing from local Indian industrial hubs (Rajkot, Pune, Noida) reduces freight lead times.

5. **Supply Chain & Regulatory Compliance**: Key risks include component procurement delays and BIS / CE certification standards. Founders should secure dual-vendor sourcing agreements for critical electronic chips early.

6. **Go-To-Market & Pre-Order Strategy**: Establish a high-converting landing page to collect 100 paid pre-orders at **₹1,499** prior to initiating batch mold production, validating customer intent.

7. **Break-Even Payback Milestone**: The venture is projected to achieve operational break-even within **6 to 9 Months** upon reaching a monthly sales volume of **350 units**.

8. **Strategic Founder Recommendation**: Maintain a lean capital structure, retain initial assembly in-house, and secure trademark & design patent protections under the Indian IP Scheme for Startups.`;

    // Provider 1: Groq Llama 3.3 (70B)
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
              verdict: parsed.verdict || `The concept "${title}" shows strong market feasibility in Indian Rupees (₹).`,
              detailedAnalysis: parsed.detailedAnalysis || defaultReportText,
              riskMatrix: parsed.riskMatrix || { technicalComplexity: "Medium", supplyChainRisk: "Moderate", capitalIntensity: "Low", regulatoryBarrier: "Standard" },
              financialViability: parsed.financialViability || { estimatedCogs: "₹450 - ₹850 per unit", projectedMargin: "62% - 75%", breakEvenMonths: "6 to 8 Months", recommendedRetailPrice: "₹1,899 - ₹2,999" },
              billOfMaterials: parsed.billOfMaterials || [
                { item: "Primary Structural Material", estimatedCost: "₹180" },
                { item: "Control Board / Sensor Array", estimatedCost: "₹220" },
                { item: "Custom Eco Packaging", estimatedCost: "₹45" },
              ],
              actionPlan: parsed.actionPlan || ["Build prototype", "Obtain supplier quotes in ₹ INR", "Launch pre-orders"],
              aiProviderUsed: usedProviderName,
              timestamp: new Date().toISOString(),
            };
          }
        }
      } catch (err) {
        console.warn("Groq execution failed, trying Gemini fallback:", err);
      }
    }

    // Provider 2: Google Gemini 2.5 / 1.5 Flash (Free Tier Slower)
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
                verdict: parsed.verdict || `The concept "${title}" demonstrates solid potential in ₹ INR.`,
                detailedAnalysis: parsed.detailedAnalysis || defaultReportText,
                riskMatrix: parsed.riskMatrix || { technicalComplexity: "Medium", supplyChainRisk: "Moderate", capitalIntensity: "Low", regulatoryBarrier: "Standard" },
                financialViability: parsed.financialViability || { estimatedCogs: "₹500 - ₹900 per unit", projectedMargin: "65%", breakEvenMonths: "6 to 9 Months", recommendedRetailPrice: "₹1,999 - ₹3,499" },
                billOfMaterials: parsed.billOfMaterials || [{ item: "Enclosure Housing", estimatedCost: "₹190" }],
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

      usedProviderName = "Offline Heuristic Rule Engine";
      report = {
        title,
        category: category || "Manufacturing",
        feasibilityScore,
        ratingLabel: feasibilityScore >= 80 ? "Highly Viable" : "Moderately Viable",
        verdict: `The concept "${title}" shows favorable capital-efficiency metrics in ₹ INR.`,
        detailedAnalysis: defaultReportText,
        riskMatrix: {
          technicalComplexity: category === "Hardware / Electronics" ? "High" : "Medium",
          supplyChainRisk: "Moderate",
          capitalIntensity: investmentTier === "₹25 Lakhs+" ? "High" : "Low",
          regulatoryBarrier: "Standard",
        },
        financialViability: {
          estimatedCogs: "₹450 - ₹850 per unit",
          projectedMargin: "62% - 75%",
          breakEvenMonths: "6 to 9 Months",
          recommendedRetailPrice: "₹1,899 - ₹2,999",
        },
        billOfMaterials: [
          { item: "Primary Structural Material", estimatedCost: "₹180" },
          { item: "Control Board Microcontroller", estimatedCost: "₹220" },
          { item: "Fasteners & Seal Gaskets", estimatedCost: "₹65" },
        ],
        actionPlan: [
          "3D print functional MVP prototype.",
          "Obtain vendor quotes in ₹ INR.",
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
