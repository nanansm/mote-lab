import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);
  const isAuthenticated = !!sessionCookie;

  const protectedRoutes = ["/dashboard", "/onboarding", "/auth/extension"];
  const ownerRoutes = ["/owner"];
  const authRoutes = ["/login", "/register"];

  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));
  const isOwnerRoute = ownerRoutes.some((r) => pathname.startsWith(r));
  const isAuthPage = authRoutes.some((r) => pathname === r);

  if (isOwnerRoute) {
    const allCookies = request.cookies.getAll().map((c) => c.name);
    console.log("[middleware-owner] path:", pathname, "isAuthenticated:", isAuthenticated, "cookies:", allCookies);
  }

  // /owner/* — requires session; role check is done in owner/layout.tsx (server component)
  // Non-owners are redirected to / (not /control-panel/login — don't leak the URL)
  if (isOwnerRoute && !isAuthenticated) {
    console.log("[middleware-owner] no session → redirect /");
    return NextResponse.redirect(new URL("/", request.url));
  }

  // /dashboard, /onboarding — requires session
  if (isProtected && !isAuthenticated) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // /login, /register — redirect to dashboard if already logged in
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/owner/:path*",
    "/onboarding",
    "/login",
    "/register",
    "/auth/extension",
  ],
};
