import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // If the secret is not configured, bypass authentication entirely (e.g. local dev)
  if (!process.env.SYNAPSE_ACCESS_KEY) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Allow access to login page, static files, and api/auth endpoints
  if (
    pathname === "/login" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("synapse_session");

  // Allow if cookie matches the secret
  if (sessionCookie?.value === process.env.SYNAPSE_ACCESS_KEY) {
    return NextResponse.next();
  }

  // For API routes, return 401 Unauthorized instead of redirecting to HTML login page
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Redirect to login
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
