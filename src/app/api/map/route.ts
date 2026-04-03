import { NextResponse } from "next/server";
import { getCitiesForMap } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET() {
  const cities = getCitiesForMap();
  return NextResponse.json(cities);
}
