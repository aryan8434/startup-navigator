import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, signToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
    }

    const existingUser = await db.users.findUnique({ email });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists with this email" }, { status: 400 });
    }

    const allUsers = await db.users.findMany();
    // First user is automatically admin, or if email starts with admin
    const role = allUsers.length === 0 || email.toLowerCase().startsWith("admin") ? "admin" : "user";

    const passwordHash = hashPassword(password);
    const newUser = await db.users.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role
    });

    const token = signToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name
    });

    const response = NextResponse.json({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

    // Set cookie
    response.cookies.set("sn_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/"
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
