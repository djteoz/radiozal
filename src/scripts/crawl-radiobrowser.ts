/**
 * Crawl ALL stations from Radio Browser API with geo coordinates.
 * Fetches ~53k stations in paginated batches.
 * Run: npx tsx src/scripts/crawl-radiobrowser.ts
 */
import { initSchema, upsertStations, getDb } from "../lib/db";

const API_SERVERS = [
  "https://all.api.radio-browser.info/json",
  "https://de1.api.radio-browser.info/json",
  "https://nl1.api.radio-browser.info/json",
];

const PAGE_SIZE = 5000;
const TIMEOUT_MS = 30_000;

interface RBStation {
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  favicon: string;
  tags: string;
  country: string;
  countrycode: string;
  language: string;
  codec: string;
  bitrate: number;
  votes: number;
  lastcheckok: number;
  geo_lat: number | null;
  geo_long: number | null;
  state: string;
}

async function apiFetch(path: string): Promise<RBStation[]> {
  for (const base of API_SERVERS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const res = await fetch(`${base}${path}`, {
        headers: { "User-Agent": "RadioZal-Crawler/1.0" },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) return await res.json();
    } catch {
      // try next server
    }
  }
  return [];
}

function isValidStation(s: RBStation): boolean {
  return !!(
    s.url_resolved &&
    s.name &&
    s.name.trim().length >= 2 &&
    s.url_resolved.startsWith("http") &&
    s.lastcheckok === 1
  );
}

/** Derive city name — RadioBrowser has no `city` field, only `state` (province).
 *  Leave empty; the reverse-geocode script will fill it from coordinates. */
function deriveCity(_s: RBStation): string {
  return "";
}

function rbToDbStation(s: RBStation) {
  const lat = s.geo_lat && Math.abs(s.geo_lat) > 0.01 ? s.geo_lat : null;
  const lng = s.geo_long && Math.abs(s.geo_long) > 0.01 ? s.geo_long : null;

  return {
    id: s.stationuuid,
    name: s.name.trim(),
    url: s.url || s.url_resolved,
    url_resolved: s.url_resolved,
    favicon: s.favicon || "",
    tags: s.tags || "",
    country: s.country || "",
    countrycode: s.countrycode || "",
    language: s.language || "",
    codec: s.codec || "",
    bitrate: s.bitrate || 0,
    votes: s.votes || 0,
    geo_lat: lat,
    geo_long: lng,
    city: deriveCity(s),
    source: "radiobrowser",
    source_id: s.stationuuid,
    is_curated: 0,
  };
}

async function main() {
  console.log("=== Radio Browser FULL Crawler ===\n");
  initSchema();

  const allStations: RBStation[] = [];
  let offset = 0;
  let page = 1;

  while (true) {
    console.log(`Page ${page}: fetching offset=${offset}...`);
    const stations = await apiFetch(
      `/stations/search?lastcheckok=1&hidebroken=true&order=votes&reverse=true&limit=${PAGE_SIZE}&offset=${offset}`
    );

    if (stations.length === 0) {
      console.log("  No more stations.");
      break;
    }

    const valid = stations.filter(isValidStation);
    console.log(`  Got ${stations.length}, valid: ${valid.length}`);
    allStations.push(...valid);

    if (stations.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
    page++;

    await new Promise(r => setTimeout(r, 500));
  }

  // Deduplicate by url_resolved
  const seen = new Set<string>();
  const unique = allStations.filter(s => {
    const key = s.url_resolved;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`\nTotal unique valid stations: ${unique.length}`);

  // Batch insert
  const batch = unique.map(rbToDbStation);
  const BATCH_SIZE = 1000;
  for (let i = 0; i < batch.length; i += BATCH_SIZE) {
    const chunk = batch.slice(i, i + BATCH_SIZE);
    upsertStations(chunk);
    console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${chunk.length} stations`);
  }

  const db = getDb();
  const total = (db.prepare("SELECT COUNT(*) as cnt FROM stations").get() as { cnt: number }).cnt;
  const withGeo = (db.prepare("SELECT COUNT(*) as cnt FROM stations WHERE geo_lat IS NOT NULL").get() as { cnt: number }).cnt;
  const cities = (db.prepare("SELECT COUNT(DISTINCT city || countrycode) as cnt FROM stations WHERE city != ''").get() as { cnt: number }).cnt;
  console.log(`\nDB: ${total} total, ${withGeo} with geo, ${cities} cities`);
  console.log("Done.");
}

main().catch(console.error);
