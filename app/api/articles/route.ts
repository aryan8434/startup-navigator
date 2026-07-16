import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";

// GET /api/articles - Fetch all articles
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");

    let articles = await db.articles.findMany();

    if (category) {
      articles = articles.filter(
        (a) => a.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (tag) {
      articles = articles.filter((a) =>
        a.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
      );
    }

    // Sort by newest first
    articles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ articles });
  } catch (error) {
    console.error("Fetch articles error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/articles - Create an article (Admin only)
export async function POST(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const { title, content, category, summary, tags } = await req.json();

    if (!title || !content || !category || !summary) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newArticle = await db.articles.create({
      title,
      content,
      category,
      summary,
      tags: Array.isArray(tags) ? tags : []
    });

    return NextResponse.json({ article: newArticle }, { status: 201 });
  } catch (error) {
    console.error("Create article error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
