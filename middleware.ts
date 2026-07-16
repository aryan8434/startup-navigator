import { NextRequest, NextResponse } from "next/server";

// Edge middleware can't use the `jsonwebtoken` package (it needs Node's crypto
// module, unavailable in the Edge runtime). So this layer only checks that a
// session cookie is present, redirecting anonymous visitors away from
// protected routes. The real signature verification and role check (e.g.
// admin-only) happens in lib/auth.ts on every API route, which runs in the
// full Node.js runtime, so authorization is never actually bypassed here.
export function middleware(req: NextRequest) {
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
