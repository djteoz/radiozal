import { NextRequest, NextResponse } from "next/server";
import { queryStations, countStations, rowToStation } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const countrycode = params.get("country") || undefined;
  const tag = params.get("tag") || undefined;
  const search = params.get("search") || undefined;
  const limit = Math.min(Number(params.get("limit") || 50), 200);
  const offset = Number(params.get("offset") || 0);

  const rows = queryStations({ countrycode, tag, search, limit, offset });
  const total = countStations({ countrycode, tag });
  const stations = rows.map(rowToStation);

  return NextResponse.json({ stations, total, limit, offset });
}
