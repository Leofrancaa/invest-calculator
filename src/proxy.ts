import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/security";

export async function proxy(request: NextRequest) {
  const publicAssets = new Set([
    "/manifest.webmanifest",
    "/sw.js",
    "/offline.html",
    "/icons/icon-192.png",
    "/icons/icon-512.png",
    "/icons/icon-maskable-512.png",
    "/icons/apple-touch-icon.png",
  ]);
  if (publicAssets.has(request.nextUrl.pathname)) {
    const response = NextResponse.next();
    if (request.nextUrl.pathname === "/sw.js") {
      response.headers.set(
        "Cache-Control",
        "no-cache, no-store, must-revalidate",
      );
      response.headers.set(
        "Content-Type",
        "application/javascript; charset=utf-8",
      );
      response.headers.set("Service-Worker-Allowed", "/");
    }
    response.headers.set("X-Content-Type-Options", "nosniff");
    return response;
  }
  const authenticated = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
    process.env.AUTH_SECRET,
    process.env.ADMIN_PASSWORD_HASH,
  );
  const path = request.nextUrl.pathname;
  if (!authenticated && path !== "/login") {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
  if (authenticated && path === "/login" && request.method === "GET")
    return NextResponse.redirect(new URL("/", request.url));
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "same-origin");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.svg|favicon.ico).*)"],
};
