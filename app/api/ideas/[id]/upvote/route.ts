import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updated = await db.ideas.upvote(id);
    if (!updated) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, upvotes: updated.upvotes });
  } catch (error) {
    console.error("Error upvoting idea:", error);
    return NextResponse.json({ error: "Failed to upvote idea" }, { status: 500 });
  }
}
