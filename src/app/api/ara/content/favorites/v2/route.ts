import { NextResponse } from "next/server";
import { resolveFavorites } from "@/lib/rg-compat";

export async function POST(request: Request) {
  let ids: string[];
  try {
    const body = await request.json();
    // Frontend sends { favorites: [...ids] }
    if (body && Array.isArray(body.favorites)) {
      ids = body.favorites;
    } else if (Array.isArray(body)) {
      ids = body;
    } else {
      return NextResponse.json(
        { apiVersion: 0, error: "Expected favorites array" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { apiVersion: 0, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const data = resolveFavorites(ids);
  return NextResponse.json(data);
}
