import { NextResponse } from "next/server";
import { getStreamUrl } from "@/lib/rg-compat";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await params;
  const streamUrl = getStreamUrl(channelId);

  if (!streamUrl) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Redirect to the actual stream URL.
  // The RG frontend expects to hit this endpoint as the audio src.
  return NextResponse.redirect(streamUrl, 302);
}
