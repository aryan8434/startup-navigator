import { NextResponse, NextRequest } from "next/server";
import { executeRagSearch } from "@/lib/rag";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { query, aiModel = "groq" } = await req.json();

    if (!query || typeof query !== "string" || query.trim() === "") {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 });
    }

    const { answer, sources } = await executeRagSearch(query, aiModel);

    // Logging search history safely (non-blocking so filesystem locks never crash search)
    try {
      const user = getAuthenticatedUser(req);
      const userId = user ? user.id : null;
      await db.searchHistory.create({
        userId,
        query: query.trim(),
        answer,
        sources,
      });
    } catch (logErr) {
      console.warn("Search history logging failed non-fatally:", logErr);
    }

    return NextResponse.json({ answer, sources });
  } catch (error) {
    console.error("AI Search API error:", error);
    // Never crash with 500 error; return fallback RAG answer
    return NextResponse.json({
      answer: "I couldn't find a direct answer in our startup guide database for that question. Please try asking about manufacturing processes, Delaware C-Corps, or SAFEs.",
      sources: [],
    });
  }
}
