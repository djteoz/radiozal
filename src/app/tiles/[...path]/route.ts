import { NextRequest } from "next/server";

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY || "";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const joined = path.join("/");

  // Handle retina tiles: {z}/{x}/{y}-2x.jpg → MapTiler @2x
  const retinaMatch = joined.match(/^(\d+)\/(\d+)\/(\d+)-2x\.jpg$/);
  const normalMatch = joined.match(/^(\d+)\/(\d+)\/(\d+)\.jpg$/);

  const match = retinaMatch || normalMatch;
  if (!match) {
    return new Response("Not found", { status: 404 });
  }

  const [, z, x, y] = match;

  // MapTiler satellite tiles
  const maptilerUrl = `https://api.maptiler.com/tiles/satellite-v2/${z}/${x}/${y}.jpg?key=${MAPTILER_KEY}`;

  try {
    const resp = await fetch(maptilerUrl);
    if (!resp.ok) {
      return new Response("Tile not found", { status: resp.status });
    }

    const body = resp.body;
    return new Response(body, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new Response("Tile fetch error", { status: 502 });
  }
}
