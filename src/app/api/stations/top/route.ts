import { NextRequest, NextResponse } from "next/server";
import { getTopStations, rowToStation } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") || 50), 200);
  const rows = getTopStations(limit);
  const stations = rows.map(rowToStation);

  return NextResponse.json({ stations });
}
