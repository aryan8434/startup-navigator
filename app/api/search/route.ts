import { NextResponse, NextRequest } from "next/server";
import { executeRagSearch } from "@/lib/rag";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string" || query.trim() === "") {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 });
    }

    const { answer, sources } = await executeRagSearch(query);

    // Capture authenticated user if present
    const user = getAuthenticatedUser(req);
    const userId = user ? user.id : null;

    // Log this search transaction to the history database
    await db.searchHistory.create({
      userId,
      query: query.trim(),
      answer,
      sources
    });

    return NextResponse.json({ answer, sources });
  } catch (error) {
    console.error("AI Search API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
