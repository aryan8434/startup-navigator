import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { category = "Manufacturing", investmentTier = "₹5 Lakhs - ₹25 Lakhs", aiModel = "groq" } = await request.json();

    const groqApiKey = process.env.GROQ_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    const systemPrompt = `You are a world-class manufacturing co-founder and venture capitalist. 
Generate 3 unique, high-profit manufacturing startup ideas in the "${category}" category under Capex Tier "${investmentTier}".
Return strictly valid JSON matching this schema:
{
  "generatedIdeas": [
    {
      "id": string (unique slug e.g. "gen-smart-compost-1"),
      "title": string,
      "tagline": string,
      "category": string,
      "investmentTier": string,
      "difficulty": string ("Beginner" | "Intermediate" | "Advanced"),
      "upvotes": number (between 40 and 150),
      "feasibilityScore": number (between 80 and 95),
      "profitMargin": string (e.g. "65%"),
      "tam": string (e.g. "₹450 Cr"),
      "problemStatement": string,
      "proposedSolution": string,
      "billOfMaterials": [ { "item": string, "costPerUnit": string } ],
      "manufacturingProcess": [ string ]
    }
  ]
}
Do NOT wrap in markdown or extra text. Output strictly valid JSON.`;

    const userPrompt = `Generate 3 innovative manufacturing startup concepts for category: ${category}, capex: ${investmentTier}. Include Indian Rupees ₹ pricing.`;

    let generatedIdeas = null;
    let providerUsed = "Offline AI Generator";

    // Groq Generator
    if (aiModel === "groq" && groqApiKey) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqApiKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.7,
            response_format: { type: "json_object" },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const raw = data.choices?.[0]?.message?.content;
          if (raw) {
            const parsed = JSON.parse(raw);
            generatedIdeas = parsed.generatedIdeas;
            providerUsed = "Groq Llama 3.3 (70B)";
          }
        }
      } catch (err) {
        console.warn("Groq idea generation failed, falling back to Gemini:", err);
      }
    }

    // Gemini Generator
    if (!generatedIdeas && (aiModel === "gemini" || geminiApiKey)) {
      if (geminiApiKey) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
          const gRes = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
            }),
          });

          if (gRes.ok) {
            const gData = await gRes.json();
            const rawText = gData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const cleanJson = rawText.replace(/```json|```/g, "").trim();
              const parsed = JSON.parse(cleanJson);
              generatedIdeas = parsed.generatedIdeas;
              providerUsed = "Google Gemini 2.5 Flash";
            }
          }
        } catch (err) {
          console.warn("Gemini idea generation failed:", err);
        }
      }
    }

    // Fallback Mock Ideas if LLMs are unavailable
    if (!generatedIdeas) {
      generatedIdeas = [
        {
          id: `gen-ai-${Date.now()}-1`,
          title: `Autonomous Micro-Solar Water Purifier`,
          tagline: `Off-grid UV LED filtration unit for rural households and eco-resorts.`,
          category: category || "GreenTech / Sustainability",
          investmentTier: investmentTier || "₹5 Lakhs - ₹25 Lakhs",
          difficulty: "Intermediate",
          upvotes: 94,
          feasibilityScore: 89,
          profitMargin: "68%",
          tam: "₹350 Cr",
          problemStatement: "Lack of clean drinking water in off-grid rural areas.",
          proposedSolution: "Solar-powered automated UV filtration with IoT quality monitor.",
          billOfMaterials: [
            { item: "UV LED Module", costPerUnit: "₹280" },
            { item: "Micro Solar Panel 10W", costPerUnit: "₹350" },
            { item: "Filter Vessel", costPerUnit: "₹180" }
          ],
          manufacturingProcess: ["Rotational Molding", "PCB SMT Assembly", "Pressure Leak Test"]
        },
        {
          id: `gen-ai-${Date.now()}-2`,
          title: `Biodegradable Mycelium Packaging Crates`,
          tagline: `Eco-friendly alternative to expanded polystyrene (Styrofoam) crates.`,
          category: category || "Manufacturing",
          investmentTier: investmentTier || "₹5 Lakhs - ₹25 Lakhs",
          difficulty: "Beginner",
          upvotes: 112,
          feasibilityScore: 92,
          profitMargin: "72%",
          tam: "₹600 Cr",
          problemStatement: "Single-use plastic packaging waste causing environmental damage.",
          proposedSolution: "Molded mushroom mycelium insulation packaging grown from agricultural waste.",
          billOfMaterials: [
            { item: "Agri Crop Residue Substrate", costPerUnit: "₹25" },
            { item: "Mycelium Spore Inoculant", costPerUnit: "₹15" },
            { item: "Thermoformed Mold", costPerUnit: "₹40" }
          ],
          manufacturingProcess: ["Substrate Inoculation", "Molding Chamber", "Heat Desiccation"]
        }
      ];
    }

    // Mark generated ideas as isAiGenerated and save to database
    const savedIdeas = [];
    for (const idea of generatedIdeas) {
      const formattedIdea = {
        title: idea.title,
        slug: idea.id || `gen-${Math.random().toString(36).substring(2, 9)}`,
        tagline: idea.tagline || "AI Generated manufacturing innovation",
        category: (idea.category as any) || category || "Manufacturing",
        investmentTier: (idea.investmentTier as any) || investmentTier || "₹5 Lakhs - ₹25 Lakhs",
        profitMargin: idea.profitMargin || "65%",
        difficulty: (idea.difficulty as any) || "Intermediate",
        targetMarket: "D2C Consumers & B2B Wholesalers",
        tam: idea.tam || "₹250 Cr",
        sam: "₹75 Cr",
        som: "₹15 Cr",
        summary: idea.tagline || idea.title,
        problemStatement: idea.problemStatement || "High cost and inefficiency in traditional hardware production.",
        proposedSolution: idea.proposedSolution || "Modular digital manufacturing process with localized supply chain.",
        manufacturingProcess: idea.manufacturingProcess || ["CAD Modeling", "Tooling Assembly", "Quality Inspection"],
        billOfMaterials: (idea.billOfMaterials || [{ item: "Main Chassis", costPerUnit: "₹250" }]).map((b: any) => ({
          item: b.item,
          costPerUnit: b.costPerUnit,
          supplierType: "Domestic Distributor",
          essential: true,
        })),
        machineryNeeded: [
          { name: "CNC Milling Machine", estimatedCost: "₹4,50,000", purpose: "Precision component machining" },
        ],
        unitEconomics: {
          rawMaterialCost: 280,
          laborCostPerUnit: 120,
          packagingCost: 45,
          wholesalePrice: 999,
          retailPrice: 1499,
          grossMargin: 65,
        },
        regulatoryRequirements: ["BIS Safety Standard", "ISO 9001 Quality Certification"],
        competitorLandscape: [
          { name: "Legacy Incumbent Corp", weakness: "High overhead and slow lead times", differentiation: "5x faster localized tooling turnaround" },
        ],
        growthPlaybook: ["Build MVP prototype", "Secure 100 pre-orders via D2C landing page"],
        tags: ["AI Generated", "Manufacturing", category],
        upvotes: idea.upvotes || Math.floor(Math.random() * 60) + 40,
        featured: false,
        isAiGenerated: true,
      };

      try {
        const saved = await db.ideas.create(formattedIdea);
        savedIdeas.push({ ...saved, isAiGenerated: true });
      } catch (err) {
        console.warn("Failed to persist AI idea:", err);
        savedIdeas.push({ ...formattedIdea, id: formattedIdea.slug });
      }
    }

    return NextResponse.json({ success: true, ideas: savedIdeas, providerUsed });
  } catch (error) {
    console.error("Error generating ideas:", error);
    return NextResponse.json({ error: "Failed to generate AI ideas" }, { status: 500 });
  }
}
