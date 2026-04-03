import { NextResponse } from "next/server";
import { getPlacePage } from "@/lib/rg-compat";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const { placeId } = await params;
  const data = getPlacePage(placeId);
  if (!data) {
    return NextResponse.json(
      { apiVersion: 0, error: "Not Found" },
      { status: 404 }
    );
  }
  return NextResponse.json(data);
}
