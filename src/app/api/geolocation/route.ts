import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/geolocation
 * Определяет местоположение пользователя по IP-адресу.
 * Использует ip-api.com (бесплатный, без ключа, 45 req/min).
 */
export async function GET(req: NextRequest) {
  // IP из заголовков (прокси/nginx) или из самого запроса
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIp || "";

  // На localhost ip будет пустым или 127.0.0.1 — ip-api сам определит внешний IP
  const query = ip && ip !== "127.0.0.1" && ip !== "::1" ? ip : "";

  try {
    const res = await fetch(
      `http://ip-api.com/json/${query}?fields=status,lat,lon,city,country,countryCode&lang=en`,
      { cache: "no-store" },
    );

    if (!res.ok) {
      return NextResponse.json(
        { lat: 55.75, lng: 37.62, city: "Москва", source: "fallback" },
        { status: 200 },
      );
    }

    const data = await res.json();

    if (data.status === "success") {
      return NextResponse.json({
        lat: data.lat,
        lng: data.lon,
        city: data.city || "",
        country: data.country || "",
        countryCode: data.countryCode || "",
        source: "ip",
      });
    }

    // Фоллбэк — Москва
    return NextResponse.json({
      lat: 55.75,
      lng: 37.62,
      city: "Москва",
      source: "fallback",
    });
  } catch {
    return NextResponse.json({
      lat: 55.75,
      lng: 37.62,
      city: "Москва",
      source: "fallback",
    });
  }
}
