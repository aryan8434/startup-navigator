import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/articles/[id] - Fetch article details
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const article = await db.articles.findUnique({ id });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({ article });
  } catch (error) {
    console.error("Fetch single article error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/articles/[id] - Update an article (Admin only)
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = getAuthenticatedUser(req);

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const updates = await req.json();
    const updated = await db.articles.update(id, updates);

    if (!updated) {
      return NextResponse.json({ error: "Article not found or could not be updated" }, { status: 404 });
    }

    return NextResponse.json({ article: updated });
  } catch (error) {
    console.error("Update article error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/articles/[id] - Delete an article (Admin only)
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = getAuthenticatedUser(req);

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const success = await db.articles.delete(id);

    if (!success) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Article deleted successfully", success: true });
  } catch (error) {
    console.error("Delete article error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
