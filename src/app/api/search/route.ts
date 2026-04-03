import { NextRequest, NextResponse } from "next/server";
import { searchChannelsAndPlaces } from "@/lib/rg-compat";

export const dynamic = "force-dynamic";

/**
 * GET /api/search?q=...
 * RG-compatible search endpoint.
 * Returns Elasticsearch-like format: { took, query, hits: { hits: [...] } }
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  const data = searchChannelsAndPlaces(q.trim());
  return NextResponse.json(data);
}
