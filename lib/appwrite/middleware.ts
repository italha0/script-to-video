import { NextResponse, type NextRequest } from 'next/server';
import { Client, Account } from 'appwrite';

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next();
  const client = new Client();

  client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

  const account = new Account(client);

  const isProtectedPage = request.nextUrl.pathname.startsWith("/editor");
  const isAuthPage = request.nextUrl.pathname.startsWith("/auth");

  try {
    const session = await account.get(); // Get current session

    if (session) {
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
  } catch (error) {
    // No session found or an error occurred (e.g., session expired)
    console.error("Appwrite session check failed:", error);
    // Ensure session cookies are cleared if there was an error
    response.cookies.delete('a_session'); // Appwrite session cookie name
    response.cookies.delete('a_session_legacy'); // Older Appwrite session cookie name

    if (isProtectedPage) {
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