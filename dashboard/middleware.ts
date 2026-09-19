import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/" || path === "/logo.png" || path === "/logo.jpg" || path.startsWith("/login") || path.startsWith("/signup") || path.startsWith("/terms") || path.startsWith("/privacy") || path.startsWith("/contact") || path.startsWith("/api/auth")) {
    return NextResponse.next();
  }
  if (!request.cookies.get("signal_session") && !path.startsWith("/api/")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
