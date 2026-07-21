import { NextResponse } from "next/server";

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

    return NextResponse.json({ success: true, ideas: generatedIdeas, providerUsed });
  } catch (error) {
    console.error("Error generating ideas:", error);
    return NextResponse.json({ error: "Failed to generate AI ideas" }, { status: 500 });
  }
}
