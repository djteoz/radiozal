import { NextResponse } from "next/server";
import { getPlaceV2 } from "@/lib/rg-compat";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const { placeId } = await params;
  const data = getPlaceV2(placeId);
  if (!data) {
    return NextResponse.json(
      { apiVersion: 0, error: "Not Found" },
      { status: 404 }
    );
  }
  return NextResponse.json(data);
}
