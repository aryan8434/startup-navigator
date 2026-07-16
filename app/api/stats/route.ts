import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    const isAdmin = user?.role === "admin";

    const articles = await db.articles.findMany();
    const resources = await db.resources.findMany();
    const searchHistory = await db.searchHistory.findMany();
    const users = await db.users.findMany();

    // 1. Compute Category Breakdown for Articles
    const categoryBreakdown: Record<string, number> = {};
    articles.forEach((a) => {
      categoryBreakdown[a.category] = (categoryBreakdown[a.category] || 0) + 1;
    });

    // 2. Extrapolate Popular Search Topics
    // We group queries and count occurrences
    const queryCounts: Record<string, number> = {};
    searchHistory.forEach((log) => {
      const q = log.query.toLowerCase().trim();
      queryCounts[q] = (queryCounts[q] || 0) + 1;
    });

    const popularSearchQueries = Object.entries(queryCounts)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 3. Recent searches (limited to top 5)
    // Resolve email if possible for admin view
    const userMap = new Map(users.map((u) => [u.id, u.name]));
    const recentSearches = searchHistory
      .slice()
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
      .map((log) => ({
        id: log.id,
        query: log.query,
        timestamp: log.timestamp,
        userName: log.userId ? userMap.get(log.userId) || "Registered User" : "Anonymous Guest"
      }));

    // Construct response structure
    const baseStats = {
      totalArticles: articles.length,
      totalResources: resources.length,
      totalSearches: searchHistory.length,
      categoryBreakdown,
      popularSearchQueries,
      recentSearches
    };

    if (isAdmin) {
      // Add admin specific statistics
      return NextResponse.json({
        ...baseStats,
        totalUsers: users.length,
        recentUsers: users
          .slice()
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
          .map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            createdAt: u.createdAt
          }))
      });
    }

    return NextResponse.json(baseStats);
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
