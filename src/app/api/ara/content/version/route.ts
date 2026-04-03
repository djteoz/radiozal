import { NextResponse } from "next/server";
import { getVersion } from "@/lib/rg-compat";

export async function GET() {
  return NextResponse.json(getVersion());
}
