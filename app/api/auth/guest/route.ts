import { NextResponse, NextRequest } from "next/server";
import { getAuthenticatedUser, signGuestToken, SESSION_MAX_AGE_SECONDS } from "@/lib/auth";

/**
 * Starts a guest session so visitors can run the full pipeline — the two-stage
 * validation gate, live evidence, dual-model consensus and confidence scoring —
 * and generate AI ideas without creating an account. Their runs are logged
 * against the guest id, so the dashboard shows them just as it does for users.
 */
export async function POST(req: NextRequest) {
  try {
    // Keep an existing session: a signed-in user is never downgraded, and a
    // returning guest keeps the id their history is filed under.
    const existing = getAuthenticatedUser(req);
    if (existing) {
      return NextResponse.json({ user: existing });
    }

    const { token, user } = signGuestToken();
    const response = NextResponse.json({ user });

    response.cookies.set("sn_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: "/"
    });

    return response;
  } catch (error) {
    console.error("Guest session error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
