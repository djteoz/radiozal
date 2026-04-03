import { NextRequest, NextResponse } from "next/server";
import { getSettings } from "@/lib/rg-compat";

export async function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get("locale") || "en";
  return NextResponse.json(getSettings(locale));
}
