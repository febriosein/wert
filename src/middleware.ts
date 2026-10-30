import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 1. Core Security Headers (PRD Section 12)
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(), geolocation=(), browsing-topics=()"
  );

  // Content-Security-Policy (Allow self, Supabase, PDF plugin rendering, and inline styles for Tailwind/Next.js)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://*.supabase.co";
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: ${supabaseUrl};
    font-src 'self' data:;
    object-src 'self' blob:;
    base-uri 'self';
    form-action 'self';
    frame-src 'self' blob: ${supabaseUrl};
    frame-ancestors 'self';
    connect-src 'self' blob: ${supabaseUrl} wss://${supabaseUrl.replace(/^https?:\/\//, "")};
  `.replace(/\s{2,}/g, " ").trim();

  response.headers.set("Content-Security-Policy", cspHeader);

  // 2. Photocopy Shop Public Computer Privacy: Cache-Control: no-store (PRD 7.2)
  // Ensures browsers on public computers never cache sensitive user files or previews
  const pathname = request.nextUrl.pathname;
  const isPublicStatic =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname === "/" ||
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname === "/bantuan" ||
    pathname === "/help";

  if (!isPublicStatic) {
    response.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate, max-age=0");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
