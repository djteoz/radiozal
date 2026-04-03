import { NextResponse } from "next/server";
import { getChannel } from "@/lib/rg-compat";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await params;
  const data = getChannel(channelId);
  if (!data) {
    return NextResponse.json(
      { apiVersion: 0, error: "Not Found" },
      { status: 404 }
    );
  }
  return NextResponse.json(data);
}
