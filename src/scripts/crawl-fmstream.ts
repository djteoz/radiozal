/**
 * Crawl FMSTREAM.org with FULL pagination (all letters A-Z, 0, un).
 * Each letter page paginates with n=0,50,100,...
 * Run: npx tsx src/scripts/crawl-fmstream.ts
 */
import { initSchema, upsertStations, getDb } from "../lib/db";
import crypto from "crypto";

const BASE = "https://fmstream.org";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const TIMEOUT = 60_000;
const PAGE_DELAY = 4000;  // 4s between pages to avoid rate limiting
const COUNTRY_DELAY = 10000; // 10s between countries
const LETTER_DELAY = 3000; // 3s between letters

const PROTOCOLS = ["http", "https", "mms", "mmsh", "rtsp", "rtmp"];
const H5_CODECS = ["mp3", "aac", "mp4", "ogg", "hls", "mpd", "opu", "vor", "flc"];

// FMSTREAM country codes
const COUNTRY_PAGES: { fmCode: string; countrycode: string; country: string }[] = [
  { fmCode: "RUS", countrycode: "RU", country: "Russia" },
  { fmCode: "USA", countrycode: "US", country: "United States" },
  { fmCode: "G", countrycode: "GB", country: "United Kingdom" },
  { fmCode: "D", countrycode: "DE", country: "Germany" },
  { fmCode: "F", countrycode: "FR", country: "France" },
  { fmCode: "J", countrycode: "JP", country: "Japan" },
  { fmCode: "B", countrycode: "BR", country: "Brazil" },
  { fmCode: "I", countrycode: "IT", country: "Italy" },
  { fmCode: "E", countrycode: "ES", country: "Spain" },
  { fmCode: "POL", countrycode: "PL", country: "Poland" },
  { fmCode: "HOL", countrycode: "NL", country: "Netherlands" },
  { fmCode: "CAN", countrycode: "CA", country: "Canada" },
  { fmCode: "AUS", countrycode: "AU", country: "Australia" },
  { fmCode: "TUR", countrycode: "TR", country: "Turkey" },
  { fmCode: "IND", countrycode: "IN", country: "India" },
  { fmCode: "MEX", countrycode: "MX", country: "Mexico" },
  { fmCode: "KOR", countrycode: "KR", country: "South Korea" },
  { fmCode: "BLR", countrycode: "BY", country: "Belarus" },
  { fmCode: "KAZ", countrycode: "KZ", country: "Kazakhstan" },
];

// All letter/sort options for pagination
const SORT_OPTIONS = [
  ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)), // A-Z
  "0", // digits
  "un", // unnamed
];

interface ParsedStation {
  name: string;
  url: string;
  codec: string;
  bitrate: number;
  country: string;
  countrycode: string;
}

async function fetchPage(url: string, retries = 3): Promise<string> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.status === 429) {
        const wait = 10_000 * (attempt + 1);
        console.log(`    429 rate limited, waiting ${wait / 1000}s...`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      if (!res.ok) return "";
      return await res.text();
    } catch {
      clearTimeout(timer);
      if (attempt < retries - 1) {
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }
      return "";
    }
  }
  return "";
}

function pickBestStream(
  streams: unknown[][]
): { url: string; codec: string; bitrate: number } | null {
  let best: { url: string; codec: string; bitrate: number; score: number } | null = null;

  for (const d of streams) {
    if (!d || !d[0] || typeof d[0] !== "string") continue;

    const urlPath = (d[0] as string).replace(/\\\//g, "/");
    const protoFlags = typeof d[7] === "number" ? d[7] : 0;
    const protoIdx = protoFlags & 7;
    const isInactive = protoFlags & 8;
    const isHidden = protoFlags & 16;

    if (isInactive || isHidden) continue;
    if (protoIdx >= PROTOCOLS.length) continue;

    const proto = PROTOCOLS[protoIdx];
    if (proto !== "http" && proto !== "https") continue;

    const fullUrl = `${proto}://${urlPath}`;

    const rawCodec = d[1];
    let codec = "";
    if (typeof rawCodec === "string") {
      codec = rawCodec === "flc" ? "flac" : rawCodec;
    } else if (typeof rawCodec === "number" && rawCodec > 0) {
      codec = "aac";
    }

    const bitrate = typeof d[2] === "number" ? d[2] : 0;

    let score = bitrate;
    if (proto === "https") score += 10000;
    if (codec && H5_CODECS.includes(codec)) score += 5000;
    if (codec === "mp3" || codec === "aac") score += 1000;

    if (!best || score > best.score) {
      best = { url: fullUrl, codec, bitrate, score };
    }
  }

  return best ? { url: best.url, codec: best.codec, bitrate: best.bitrate } : null;
}

function parseStations(
  html: string,
  countrycode: string,
  country: string
): ParsedStation[] {
  const nameMatches = [...html.matchAll(/<h3\s+class=["']stn["']>([^<]+)/g)];
  if (nameMatches.length === 0) return [];

  const scriptMatch = html.match(/<script>\s*var\s+data\s*=\s*(\[[\s\S]*?\]\]);/);
  if (!scriptMatch) return [];

  let dataArray: unknown[][][];
  try {
    const jsonStr = scriptMatch[1]
      .replace(/,(?=\s*[,\]])/g, ",null")
      .replace(/'/g, '"');
    dataArray = JSON.parse(jsonStr);
  } catch {
    try {
      dataArray = new Function(`return ${scriptMatch[1]}`)();
    } catch {
      return [];
    }
  }

  const stations: ParsedStation[] = [];

  for (let i = 0; i < Math.min(nameMatches.length, dataArray.length); i++) {
    const name = nameMatches[i][1].trim();
    if (!name || name.length < 2) continue;

    const streams = dataArray[i];
    if (!Array.isArray(streams) || streams.length === 0) continue;

    const best = pickBestStream(streams);
    if (!best) continue;

    stations.push({
      name,
      url: best.url,
      codec: best.codec,
      bitrate: best.bitrate,
      country,
      countrycode,
    });
  }

  return stations;
}

function toDbStation(s: ParsedStation) {
  const id = crypto.createHash("md5").update(s.url).digest("hex");
  return {
    id,
    name: s.name,
    url: s.url,
    url_resolved: s.url,
    favicon: "",
    tags: "radio",
    country: s.country,
    countrycode: s.countrycode,
    language: "",
    codec: s.codec,
    bitrate: s.bitrate,
    votes: 0,
    source: "fmstream",
    source_id: id,
    is_curated: 0,
  };
}

async function crawlCountryFull(cp: typeof COUNTRY_PAGES[0]): Promise<ParsedStation[]> {
  const allStations: ParsedStation[] = [];

  for (let li = 0; li < SORT_OPTIONS.length; li++) {
    const letter = SORT_OPTIONS[li];
    let offset = 0;
    let pageNum = 1;
    let letterTotal = 0;

    while (true) {
      const url = `${BASE}/index.php?c=${cp.fmCode}&o=${letter}&n=${offset}`;
      const html = await fetchPage(url);

      if (!html) break;

      const stations = parseStations(html, cp.countrycode, cp.country);

      if (stations.length === 0) break;

      allStations.push(...stations);
      letterTotal += stations.length;

      // FMSTREAM serves ~50 per page; if less, no more pages
      if (stations.length < 45) break;

      offset += 50;
      pageNum++;

      // Safety limit per letter
      if (pageNum > 100) break;

      await new Promise(r => setTimeout(r, PAGE_DELAY));
    }

    if (letterTotal > 0) {
      console.log(`    [${letter}] ${letterTotal} stations`);
    }

    // Delay between letters
    if (li < SORT_OPTIONS.length - 1) {
      await new Promise(r => setTimeout(r, LETTER_DELAY));
    }
  }

  return allStations;
}

async function main() {
  console.log("=== FMSTREAM Full Crawler ===\n");
  initSchema();

  const allStations: ParsedStation[] = [];

  // Check which countries already have fmstream stations
  const db = getDb();
  const existingCounts = db
    .prepare(
      `SELECT countrycode, COUNT(*) as cnt FROM stations WHERE source = 'fmstream' GROUP BY countrycode`
    )
    .all() as { countrycode: string; cnt: number }[];
  const countryStationMap = new Map(existingCounts.map(r => [r.countrycode, r.cnt]));

  const skipExisting = process.argv.includes("--skip-existing");

  for (const cp of COUNTRY_PAGES) {
    const existing = countryStationMap.get(cp.countrycode) || 0;
    if (skipExisting && existing > 10) {
      console.log(`\n--- ${cp.country} (${cp.fmCode}) --- SKIPPED (${existing} existing)`);
      continue;
    }
    console.log(`\n--- ${cp.country} (${cp.fmCode}) ---`);
    const stations = await crawlCountryFull(cp);
    console.log(`  Total: ${stations.length} stations`);
    allStations.push(...stations);

    await new Promise(r => setTimeout(r, COUNTRY_DELAY));
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  const unique = allStations.filter(s => {
    if (seen.has(s.url)) return false;
    seen.add(s.url);
    return true;
  });

  console.log(`\nTotal unique stations: ${unique.length}`);

  if (unique.length === 0) {
    console.log("No stations found.");
    return;
  }

  const batch = unique.map(toDbStation);
  const BATCH_SIZE = 500;
  for (let i = 0; i < batch.length; i += BATCH_SIZE) {
    const chunk = batch.slice(i, i + BATCH_SIZE);
    upsertStations(chunk);
    console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${chunk.length} stations`);
  }

  const db2 = getDb();
  const fmCount = (
    db2.prepare("SELECT COUNT(*) as cnt FROM stations WHERE source = 'fmstream'").get() as { cnt: number }
  ).cnt;
  const total = (db2.prepare("SELECT COUNT(*) as cnt FROM stations").get() as { cnt: number }).cnt;
  console.log(`\nFMSTREAM in DB: ${fmCount}`);
  console.log(`Total in DB: ${total}`);
  console.log("Done.");
}

main().catch(console.error);
