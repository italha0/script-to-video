import { updateSession } from "@/lib/supabase/middleware"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

// Extend middleware to preserve original destination when redirecting to login
export async function middleware(request: NextRequest) {
  const response = await updateSession(request)

  // After updateSession we can inspect auth cookie presence via response (no direct user exposed here),
  // so we rely on the redirect logic already inside updateSession for unauthenticated protected routes.
  // We only enhance that logic here for auth pages (avoid showing them when already signed in) because
  // updateSession intentionally doesn't redirect authenticated users away from /auth/*.

  // If user is already authenticated and visits an auth route, redirect to editor.
  // We detect authentication heuristically: presence of the sb-access-token cookie.
  const hasSession = request.cookies.get("sb-access-token") || request.cookies.get("sb:token")
  if (hasSession && request.nextUrl.pathname.startsWith("/auth")) {
    const url = request.nextUrl.clone()
    url.pathname = "/editor"
    url.search = ""
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
