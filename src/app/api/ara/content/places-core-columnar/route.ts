import { NextResponse } from "next/server";
import { getPlacesCoreColumnar } from "@/lib/rg-compat";

export async function GET() {
  const data = getPlacesCoreColumnar();
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, max-age=300, s-maxage=600" },
  });
}
