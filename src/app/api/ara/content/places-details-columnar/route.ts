import { NextResponse } from "next/server";
import { getPlacesDetailsColumnar } from "@/lib/rg-compat";

export async function GET() {
  const data = getPlacesDetailsColumnar();
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, max-age=300, s-maxage=600" },
  });
}
