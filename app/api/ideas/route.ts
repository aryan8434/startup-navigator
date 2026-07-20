import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const investmentTier = searchParams.get("investmentTier");
    const difficulty = searchParams.get("difficulty");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "upvotes"; // "upvotes", "newest", "margin"

    let ideas = await db.ideas.findMany();

    if (category && category !== "All") {
      ideas = ideas.filter((i) => i.category.toLowerCase() === category.toLowerCase());
    }

    if (investmentTier && investmentTier !== "All") {
      ideas = ideas.filter((i) => i.investmentTier === investmentTier);
    }

    if (difficulty && difficulty !== "All") {
      ideas = ideas.filter((i) => i.difficulty.toLowerCase() === difficulty.toLowerCase());
    }

    if (search && search.trim() !== "") {
      const q = search.toLowerCase();
      ideas = ideas.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.tagline.toLowerCase().includes(q) ||
          i.summary.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (sort === "upvotes") {
      ideas.sort((a, b) => b.upvotes - a.upvotes);
    } else if (sort === "newest") {
      ideas.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sort === "margin") {
      ideas.sort((a, b) => (a.unitEconomics?.grossMargin || 0) < (b.unitEconomics?.grossMargin || 0) ? 1 : -1);
    }

    return NextResponse.json({ ideas, count: ideas.length });
  } catch (error) {
    console.error("Error fetching ideas:", error);
    return NextResponse.json({ error: "Failed to fetch ideas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      tagline,
      category,
      investmentTier,
      difficulty,
      summary,
      problemStatement,
      proposedSolution,
      targetMarket,
      tam,
      tags,
    } = body;

    if (!title || !tagline || !category) {
      return NextResponse.json({ error: "Title, tagline, and category are required" }, { status: 400 });
    }

    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");

    const newIdea = await db.ideas.create({
      title,
      slug,
      tagline,
      category: category || "Manufacturing",
      investmentTier: investmentTier || "$10k - $50k",
      profitMargin: body.profitMargin || "50 - 65%",
      difficulty: difficulty || "Intermediate",
      targetMarket: targetMarket || "SMBs & Direct Consumers",
      tam: tam || "$1.0 Billion Global Market",
      sam: body.sam || "$150 Million Accessible Market",
      som: body.som || "$10 Million Initial Targeted Volume",
      summary: summary || tagline,
      problemStatement: problemStatement || "High cost and inefficiencies in current traditional supply chains.",
      proposedSolution: proposedSolution || "Micro-factory local production with high-margin direct distribution.",
      manufacturingProcess: body.manufacturingProcess || ["Prototyping", "Tooling", "Batch Assembly", "Quality Check"],
      billOfMaterials: body.billOfMaterials || [{ item: "Raw Material Component", costPerUnit: "$10.00", supplierType: "Distributor", essential: true }],
      machineryNeeded: body.machineryNeeded || [{ name: "Standard CNC Workstation", estimatedCost: "$5,000", purpose: "Assembly" }],
      unitEconomics: body.unitEconomics || {
        rawMaterialCost: 10,
        laborCostPerUnit: 5,
        packagingCost: 2,
        wholesalePrice: 40,
        retailPrice: 79,
        grossMargin: 65,
      },
      regulatoryRequirements: body.regulatoryRequirements || ["Standard ISO Quality Clearance", "Local Business Operating Permit"],
      competitorLandscape: body.competitorLandscape || [{ name: "Traditional Supplier", weakness: "Slow lead times", differentiation: "Fast micro-mill delivery" }],
      growthPlaybook: body.growthPlaybook || ["Launch direct-to-consumer digital channels", "Target regional b2b distributors"],
      tags: Array.isArray(tags) ? tags : (tags || "manufacturing,startup").split(",").map((t: string) => t.trim()),
      featured: false,
    });

    return NextResponse.json({ success: true, idea: newIdea }, { status: 201 });
  } catch (error) {
    console.error("Error creating idea:", error);
    return NextResponse.json({ error: "Failed to create idea" }, { status: 500 });
  }
}
