import { updateSession } from "@/lib/supabase/middleware"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

// Extend middleware to preserve original destination when redirecting to login
export async function middleware(request: NextRequest) {
  const response = await updateSession(request)

  // After updateSession we can inspect auth cookie presence via response (no direct user exposed here),
  // so we rely on the redirect logic already inside updateSession for unauthenticated protected routes.
  // We only enhance that logic here for auth pages (avoid showing them when already signed in) because
  // updateSession intentionally doesn't redirect authenticated users away from /auth/*.

  // If user is already authenticated and visits an auth route, redirect to editor.
  // Use server-validated auth check instead of cookie heuristics to prevent loops with expired tokens
  if (request.nextUrl.pathname.startsWith("/auth")) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {
            // No-op for middleware validation check
          },
        },
      },
    )
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const url = request.nextUrl.clone()
      url.pathname = "/editor"
      url.search = ""
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: ["/editor/:path*", "/auth/:path*"],
}
