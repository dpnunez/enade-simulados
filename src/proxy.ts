import { getSessionCookie } from "better-auth/cookies";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_ROUTES = ["/login"];
const PRIVATE_PREFIXES = ["/app"];

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const hasSessionCookie = Boolean(getSessionCookie(request));

  const isPrivateRoute = PRIVATE_PREFIXES.some((prefix) =>
    path.startsWith(prefix),
  );

  const isAuthRoute = AUTH_ROUTES.some((route) => path.startsWith(route));

  if (isPrivateRoute && !hasSessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthRoute && hasSessionCookie) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/login"],
};
