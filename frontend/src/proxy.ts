import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname !== "/login") {
    if (req.nextUrl.searchParams.has("demo")) return
    const loginUrl = new URL("/login", req.nextUrl.origin)
    return NextResponse.redirect(loginUrl)
  }
})

export const config = {
  matcher: [
    "/((?!api/auth|api/proxy|_next/static|_next/image|favicon.ico|images/|login|/?$).*)",
  ],
}
