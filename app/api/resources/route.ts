import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";

// GET /api/resources - Get all resources
export async function GET() {
  try {
    const resources = await db.resources.findMany();
    // Sort by newest first
    resources.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json({ resources });
  } catch (error) {
    console.error("Fetch resources error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/resources - Create resource (Admin only)
export async function POST(req: NextRequest) {
  try {
    const user = getAuthenticatedUser(req);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const { title, description, type, category, fileUrl } = await req.json();

    if (!title || !description || !type || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newResource = await db.resources.create({
      title,
      description,
      type,
      category,
      fileUrl: fileUrl || "/templates/mock.zip"
    });

    return NextResponse.json({ resource: newResource }, { status: 201 });
  } catch (error) {
    console.error("Create resource error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
