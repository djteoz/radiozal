/**
 * Crawl streamurl.link and import stations into our database.
 *
 * streamurl.link is a search engine for radio streams. We:
 * 1. Search for broad terms (/s/QUERY/) + paginate via /load-more.php
 * 2. Collect station slugs and metadata from search results
 * 3. Fetch each station page (/station/SLUG/) for base64-encoded stream URLs
 *
 * Run: npx tsx src/scripts/crawl-streamurl.ts
 */
import { initSchema, upsertStations, getDb } from "../lib/db";
import crypto from "crypto";

const BASE = "https://streamurl.link";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const TIMEOUT = 30_000;
const MAX_PAGES = 5; // pages per search query
const STATION_DELAY = 300; // ms between station page fetches

// Broad search queries to discover stations
const SEARCH_QUERIES = [
  "radio",
  "FM",
  "news",
  "music",
  "rock",
  "jazz",
  "pop",
  "classical",
  "electronic",
  "hip hop",
  "country",
  "talk",
  "BBC",
  "NPR",
  "lounge",
  "chill",
  "dance",
  "reggae",
  "metal",
  "80s",
  "90s",
  "ambient",
  "latin",
];

interface StationMeta {
  slug: string;
  name: string;
  meta: string; // e.g. "News · UK"
}

interface ParsedStation {
  name: string;
  url: string;
  tags: string;
  country: string;
}

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return "";
    return await res.text();
  } catch {
    clearTimeout(timer);
    return "";
  }
}

function decodeStreamUrl(encoded: string): string {
  if (!encoded) return "";
  try {
    // URL-safe base64: replace - with +, _ with /
    let b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    return Buffer.from(b64, "base64").toString("utf8");
  } catch {
    return "";
  }
}

/** Parse station cards from HTML (search page or load-more response) */
function parseStationCards(html: string): StationMeta[] {
  const cards: StationMeta[] = [];
  const re =
    /href="\/station\/([^/]+)\/"[^>]*>[\s\S]*?class="station-name">\s*([^<]+)[\s\S]*?class="station-meta">\s*([^<]*)/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    cards.push({
      slug: m[1].trim(),
      name: m[2].trim(),
      meta: m[3].trim(),
    });
  }
  return cards;
}

/** Search for stations and collect slugs across pages */
async function searchStations(query: string): Promise<StationMeta[]> {
  const all: StationMeta[] = [];

  // First page: /s/QUERY/
  const firstPageHtml = await fetchText(
    `${BASE}/s/${encodeURIComponent(query)}/`
  );
  if (!firstPageHtml) return all;

  all.push(...parseStationCards(firstPageHtml));

  // Subsequent pages via load-more.php
  for (let page = 1; page < MAX_PAGES; page++) {
    const json = await fetchText(
      `${BASE}/load-more.php?q=${encodeURIComponent(query)}&page=${page + 1}`
    );
    if (!json) break;

    try {
      const data = JSON.parse(json);
      if (!data.success || !data.html) break;
      const cards = parseStationCards(data.html);
      if (cards.length === 0) break;
      all.push(...cards);
      if (!data.has_more) break;
    } catch {
      break;
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  return all;
}

/** Fetch a station page and extract the base64 stream URL */
async function fetchStationStream(
  slug: string
): Promise<string | null> {
  const html = await fetchText(`${BASE}/station/${slug}/`);
  if (!html) return null;

  // Find data-url with base64-encoded stream (not the share URL)
  const matches = [
    ...html.matchAll(/data-url="([^"]+)"/g),
  ];

  for (const m of matches) {
    const val = m[1];
    // Skip URLs that are already plain URLs (share links)
    if (val.startsWith("http")) continue;
    const decoded = decodeStreamUrl(val);
    if (decoded.startsWith("http")) return decoded;
  }

  return null;
}

function parseCountryFromMeta(meta: string): string {
  // Meta format: "Genre · Country" or just "Country"
  const parts = meta.split("·").map((s) => s.trim());
  return parts.length > 1 ? parts[parts.length - 1] : parts[0] || "";
}

function parseTagFromMeta(meta: string): string {
  const parts = meta.split("·").map((s) => s.trim());
  return parts.length > 1 ? parts[0] : "";
}

function toDbStation(s: ParsedStation) {
  const id = crypto.createHash("md5").update(s.url).digest("hex");
  return {
    id,
    name: s.name,
    url: s.url,
    url_resolved: s.url,
    favicon: "",
    tags: s.tags,
    country: s.country,
    countrycode: "",
    language: "",
    codec: "",
    bitrate: 0,
    votes: 0,
    source: "streamurl",
    source_id: id,
    is_curated: 0,
  };
}

async function main() {
  console.log("=== StreamURL.link Crawler ===\n");
  initSchema();

  // Phase 1: Collect station slugs from search
  const slugMap = new Map<string, StationMeta>();

  for (const query of SEARCH_QUERIES) {
    console.log(`Searching: "${query}"...`);
    const cards = await searchStations(query);
    let newCount = 0;
    for (const card of cards) {
      if (!slugMap.has(card.slug)) {
        slugMap.set(card.slug, card);
        newCount++;
      }
    }
    console.log(`  Found ${cards.length} results, ${newCount} new.`);
    await new Promise((r) => setTimeout(r, 800));
  }

  console.log(`\nTotal unique stations discovered: ${slugMap.size}`);

  // Phase 2: Fetch stream URLs for each station
  const stations: ParsedStation[] = [];
  let fetched = 0;
  let failed = 0;

  for (const [slug, meta] of slugMap) {
    const streamUrl = await fetchStationStream(slug);

    if (streamUrl) {
      stations.push({
        name: meta.name,
        url: streamUrl,
        tags: parseTagFromMeta(meta.meta),
        country: parseCountryFromMeta(meta.meta),
      });
    } else {
      failed++;
    }

    fetched++;
    if (fetched % 50 === 0) {
      console.log(
        `  Progress: ${fetched}/${slugMap.size} (${stations.length} OK, ${failed} failed)`
      );
    }

    await new Promise((r) => setTimeout(r, STATION_DELAY));
  }

  console.log(
    `\nFetched ${fetched} stations: ${stations.length} with streams, ${failed} failed`
  );

  // Deduplicate by URL
  const seen = new Set<string>();
  const unique = stations.filter((s) => {
    if (seen.has(s.url)) return false;
    seen.add(s.url);
    return true;
  });

  console.log(`Unique stations: ${unique.length}`);

  if (unique.length === 0) {
    console.log("No stations found.");
    return;
  }

  // Batch insert
  const batch = unique.map(toDbStation);
  const BATCH_SIZE = 500;
  for (let i = 0; i < batch.length; i += BATCH_SIZE) {
    const chunk = batch.slice(i, i + BATCH_SIZE);
    upsertStations(chunk);
    console.log(
      `  Inserted batch ${Math.floor(i / BATCH_SIZE) + 1} (${chunk.length} stations)`
    );
  }

  const db = getDb();
  const count = (
    db.prepare("SELECT COUNT(*) as cnt FROM stations").get() as { cnt: number }
  ).cnt;
  const srcCount = (
    db
      .prepare("SELECT COUNT(*) as cnt FROM stations WHERE source = 'streamurl'")
      .get() as { cnt: number }
  ).cnt;
  console.log(`\nStreamURL stations in DB: ${srcCount}`);
  console.log(`Total stations in DB: ${count}`);
  console.log("Done.");
}

main().catch(console.error);
