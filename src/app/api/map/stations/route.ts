import { NextRequest, NextResponse } from "next/server";
import { getStationsByCity, rowToStation } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get("city") || "";
  const countrycode = request.nextUrl.searchParams.get("cc") || "";
  const lat = request.nextUrl.searchParams.get("lat");
  const lng = request.nextUrl.searchParams.get("lng");

  const rows = getStationsByCity(
    city, 
    countrycode,
    lat ? parseFloat(lat) : undefined,
    lng ? parseFloat(lng) : undefined
  );
  const stations = rows.map(rowToStation);
  return NextResponse.json({ stations });
}
