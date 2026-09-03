import { NextResponse } from "next/server";
import { db, type Idea } from "@/lib/db";
import { chatJson, type ProviderId } from "@/lib/providers";
import { gatherEvidence, formatEvidenceForPrompt } from "@/lib/evidence";

/** Shape the generator prompt asks for. Every field is optional because it is
 *  model output: the mapping below supplies a default for anything missing. */
interface GeneratedIdea {
  id?: string;
  title?: string;
  tagline?: string;
  category?: string;
  investmentTier?: string;
  difficulty?: string;
  upvotes?: number;
  feasibilityScore?: number;
  profitMargin?: string;
  tam?: string;
  problemStatement?: string;
  proposedSolution?: string;
  billOfMaterials?: { item?: string; costPerUnit?: string }[];
  manufacturingProcess?: string[];
}

export async function POST(request: Request) {
  try {
    const { category = "Manufacturing", investmentTier = "₹5 Lakhs - ₹25 Lakhs", aiModel = "groq" } = await request.json();

    // Ground generation in live market data so ideas reference real conditions
    // rather than the model's stale priors. Failure here is non-fatal.
    const evidence = await gatherEvidence({
      title: `${category} manufacturing India`,
      description: `manufacturing startup opportunities in ${category} at ${investmentTier} capex in India`,
      category,
    }).catch(() => null);

    const evidenceBlock = evidence ? formatEvidenceForPrompt(evidence) : "No external evidence retrieved.";

    const systemPrompt = `You are a world-class manufacturing co-founder and venture capitalist.
Generate 3 unique, high-profit manufacturing startup ideas in the "${category}" category under Capex Tier "${investmentTier}".

Ground your ideas in the retrieved evidence below. Do not invent market statistics that contradict it, and set feasibilityScore honestly based on how well the evidence supports the concept.

RETRIEVED MARKET EVIDENCE:
${evidenceBlock}

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

    let generatedIdeas: GeneratedIdea[] | null = null;
    let providerUsed = "Offline AI Generator";

    // One call: the router tries every candidate model on the preferred
    // provider, then falls through to the other providers before giving up.
    try {
      const out = await chatJson<{ generatedIdeas: GeneratedIdea[] }>(
        { system: systemPrompt, user: userPrompt, temperature: 0.7, maxTokens: 5000 },
        (aiModel === "gemini" ? "gemini" : "groq") as ProviderId
      );
      if (out && Array.isArray(out.data?.generatedIdeas) && out.data.generatedIdeas.length > 0) {
        generatedIdeas = out.data.generatedIdeas;
        providerUsed = out.meta.label;
      }
    } catch (err) {
      console.warn("AI idea generation failed across all providers:", err);
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
        title: idea.title || "Untitled AI concept",
        slug: idea.id || `gen-${Math.random().toString(36).substring(2, 9)}`,
        tagline: idea.tagline || "AI Generated manufacturing innovation",
        category: (idea.category || category || "Manufacturing") as Idea["category"],
        investmentTier: (idea.investmentTier || investmentTier || "₹5 Lakhs - ₹25 Lakhs") as Idea["investmentTier"],
        profitMargin: idea.profitMargin || "65%",
        difficulty: (idea.difficulty || "Intermediate") as Idea["difficulty"],
        targetMarket: "D2C Consumers & B2B Wholesalers",
        tam: idea.tam || "₹250 Cr",
        sam: "₹75 Cr",
        som: "₹15 Cr",
        summary: idea.tagline || idea.title || "AI generated manufacturing concept",
        problemStatement: idea.problemStatement || "High cost and inefficiency in traditional hardware production.",
        proposedSolution: idea.proposedSolution || "Modular digital manufacturing process with localized supply chain.",
        manufacturingProcess: idea.manufacturingProcess || ["CAD Modeling", "Tooling Assembly", "Quality Inspection"],
        billOfMaterials: (idea.billOfMaterials || [{ item: "Main Chassis", costPerUnit: "₹250" }]).map((b) => ({
          item: String(b.item ?? "Component"),
          costPerUnit: String(b.costPerUnit ?? "₹0"),
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
