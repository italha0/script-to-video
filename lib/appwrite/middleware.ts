import { NextResponse, type NextRequest } from 'next/server';


export async function updateSession(request: NextRequest) {
  const response = NextResponse.next();
  const isProtectedPage = request.nextUrl.pathname.startsWith("/editor");
  const isAuthPage = request.nextUrl.pathname.startsWith("/auth");

  // Check for Appwrite session cookie (client-side session)
  const hasSession = Boolean(request.cookies.get('a_session') || request.cookies.get('a_session_legacy'));

  if (hasSession) {
    // User is authenticated
    if (isAuthPage) {
      // If authenticated user tries to access auth page, redirect to editor
      const url = request.nextUrl.clone();
      url.pathname = "/editor";
      url.search = "";
      return NextResponse.redirect(url);
    }
  } else {
    // User is not authenticated
    if (isProtectedPage) {
      // If unauthenticated user tries to access protected page, redirect to login
      const url = request.nextUrl.clone();
      const redirect = request.nextUrl.pathname + (request.nextUrl.search || "");
      const safeRedirect = redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/editor";
      url.pathname = "/auth/login";
      url.search = `redirect=${encodeURIComponent(safeRedirect)}`;
      return NextResponse.redirect(url);
    }
  }

  return response;
}