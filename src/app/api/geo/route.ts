import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/geo
 * RG-compatible geolocation endpoint.
 * Returns: { eu, country_code, region_code, latitude, longitude, city }
 */
export async function GET(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIp || "";
  const query = ip && ip !== "127.0.0.1" && ip !== "::1" ? ip : "";

  try {
    const res = await fetch(
      `http://ip-api.com/json/${query}?fields=status,lat,lon,city,country,countryCode,region&lang=en`,
      { cache: "no-store" }
    );

    if (!res.ok) throw new Error("ip-api failed");

    const data = await res.json();

    if (data.status !== "success") throw new Error("ip-api: " + data.status);

    return NextResponse.json({
      eu: false,
      country_code: data.countryCode || "RU",
      region_code: data.region || "",
      latitude: data.lat || 55.75,
      longitude: data.lon || 37.62,
      city: data.city || "Moscow",
    });
  } catch {
    // Fallback: Moscow
    return NextResponse.json({
      eu: false,
      country_code: "RU",
      region_code: "",
      latitude: 55.75,
      longitude: 37.62,
      city: "Moscow",
    });
  }
}
