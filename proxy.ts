import { NextRequest, NextResponse } from "next/server";

// Renamed from `middleware.ts` in Next.js 16, which deprecated that convention
// in favour of `proxy` to clarify the network boundary.
//
// This layer only checks that a session cookie is present, redirecting
// anonymous visitors away from protected routes. The real signature
// verification and role check (e.g. admin-only) happens in lib/auth.ts on every
// API route, so authorization is never actually decided here.
export function proxy(req: NextRequest) {
  const token = req.cookies.get("sn_session")?.value;
  const { pathname } = req.nextUrl;

  if ((pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
