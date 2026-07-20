import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let idea = await db.ideas.findUnique({ id });
    if (!idea) {
      idea = await db.ideas.findUnique({ slug: id });
    }

    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    return NextResponse.json({ idea });
  } catch (error) {
    console.error("Error fetching idea:", error);
    return NextResponse.json({ error: "Failed to fetch idea" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await db.ideas.delete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Idea deleted successfully" });
  } catch (error) {
    console.error("Error deleting idea:", error);
    return NextResponse.json({ error: "Failed to delete idea" }, { status: 500 });
  }
}
