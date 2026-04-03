import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Rewrite all page routes to the internal route handler that serves RG HTML
  return NextResponse.rewrite(new URL("/rg-page", request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /api (API routes)
     * - /assets (RG static assets)
     * - /fonts (RG fonts)
     * - /_next (Next.js internals)
     * - /rg-page (internal HTML route)
     * - /rg.html (static HTML file)
     * - /favicon, static files
     */
    "/((?!api|assets|fonts|tiles|_next|rg-page|rg\\.html|favicon|logo\\.png|app-icon\\.png|apple-touch-icon\\.png|manifest\\.json|.*\\.(?:png|ico|svg|jpg|jpeg|webp|json)$).*)",
  ],
};
