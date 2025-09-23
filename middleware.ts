import { updateSession } from "@/lib/appwrite/middleware"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ["/editor/:path*"],
}
