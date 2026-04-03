export interface Station {
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  favicon: string;
  tags: string;
  country: string;
  countrycode: string;
  language: string;
  votes: number;
  codec: string;
  bitrate: number;
  geo_lat?: number | null;
  geo_long?: number | null;
  city?: string;
}

import { queryStations, getTopStations as dbTop, rowToStation, countStations, getDb } from "./db";

function hasDb(): boolean {
  try {
    const db = getDb();
    const row = db.prepare("SELECT COUNT(*) as cnt FROM stations WHERE last_check_ok = 1 OR is_curated = 1").get() as { cnt: number };
    return row.cnt > 0;
  } catch {
    return false;
  }
}

// ── Remote API fallback (used when DB is empty) ──────────────────────

const API_BASE = "https://all.api.radio-browser.info/json";
const API_FALLBACKS = [
  "https://de1.api.radio-browser.info/json",
  "https://nl1.api.radio-browser.info/json",
  "https://at1.api.radio-browser.info/json",
];

async function apiFetch(path: string, revalidate = 3600): Promise<Station[]> {
  const servers = [API_BASE, ...API_FALLBACKS];

  for (const base of servers) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${base}${path}`, {
        headers: { "User-Agent": "RadioZal/1.0" },
        next: { revalidate },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data: Station[] = await res.json();
        return data.filter(
          (s) => s.url_resolved && s.name && s.url_resolved.startsWith("http")
        );
      }
    } catch {
      // try next server
    }
  }

  return [];
}

// ── Public API (DB-first, fallback to remote) ────────────────────────

export async function getTopStations(limit = 50): Promise<Station[]> {
  if (hasDb()) {
    return dbTop(limit).map(rowToStation);
  }
  return apiFetch(`/stations/topvote/${limit}?hidebroken=true&lastcheckok=1`);
}

export async function getStationsByCountry(
  countryCode: string,
  limit = 50
): Promise<Station[]> {
  if (hasDb()) {
    return queryStations({ countrycode: countryCode, limit }).map(rowToStation);
  }
  return apiFetch(
    `/stations/bycountrycodeexact/${countryCode}?order=votes&reverse=true&hidebroken=true&lastcheckok=1&limit=${limit}`
  );
}

export async function searchStations(query: string): Promise<Station[]> {
  if (hasDb()) {
    return queryStations({ search: query, limit: 50 }).map(rowToStation);
  }
  return apiFetch(
    `/stations/byname/${encodeURIComponent(query)}?order=votes&reverse=true&hidebroken=true&lastcheckok=1&limit=50`,
    60
  );
}

export async function getStationsByTag(
  tag: string,
  limit = 50
): Promise<Station[]> {
  if (hasDb()) {
    return queryStations({ tag, limit }).map(rowToStation);
  }
  return apiFetch(
    `/stations/bytag/${encodeURIComponent(tag)}?order=votes&reverse=true&hidebroken=true&lastcheckok=1&limit=${limit}`
  );
}

export { countStations } from "./db";
