import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let history = await db.searchHistory.findMany();

    if (user.role === "admin") {
      // Admins see all history, sorted by newest first
      history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else {
      // Normal users see only their own history
      history = history
        .filter((h) => h.userId === user.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    // Resolve sources details (article titles and IDs) to return to frontend
    const articles = await db.articles.findMany();
    const articlesMap = new Map(articles.map((a) => [a.id, a]));

    const historyWithSources = history.map((h) => {
      const resolvedSources = h.sources
        .map((id) => {
          const article = articlesMap.get(id);
          return article ? { id: article.id, title: article.title } : null;
        })
        .filter((s) => s !== null);

      return {
        ...h,
        resolvedSources
      };
    });

    return NextResponse.json({ history: historyWithSources });
  } catch (error) {
    console.error("Fetch search history error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
