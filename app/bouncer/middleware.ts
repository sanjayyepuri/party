import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected routes that require authentication
const protectedRoutes = ["/invitations", "/settings"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Check for Better Auth session cookie
  // In production (HTTPS), the cookie name is prefixed with __Secure-
  const sessionCookie =
  // Lightweight check for presence of a Better Auth session cookie.
  // NOTE:
  // - This middleware does NOT validate the session token (e.g. signature, expiry).
  // - An expired/invalid token will still pass this check and reach the route handler.
  // - Actual session validation and authorization MUST happen server-side
  //   in page components / API routes before any sensitive data is returned.
  //
  // This is an intentional design to keep middleware fast and avoid duplicating
  // session logic in multiple places. The trade-off is that users with invalid
  // sessions may only be redirected *after* the page handler runs.
  //
  // If you require stronger guarantees at the middleware layer (e.g. to
  // redirect users with expired sessions before hitting the page handler),
  // add a proper session validation step here (such as calling an internal
  // auth endpoint or decoding/verifying the session token).
  const sessionCookie = request.cookies.get("better-auth.session_token");

  if (!sessionCookie) {
    // Redirect to login if no session cookie is present at all
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Cookie is present; allow the request to proceed to server-side handlers,
  // where full session validation and authorization are performed.
  return NextResponse.next();
}

export const config = {
  matcher: ["/invitations/:path*", "/settings/:path*"],
};
