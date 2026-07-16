import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = getAuthenticatedUser(req);

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const success = await db.resources.delete(id);

    if (!success) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Resource deleted successfully", success: true });
  } catch (error) {
    console.error("Delete resource error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
