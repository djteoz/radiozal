/**
 * Initialize the database schema and seed curated stations.
 * Run: npx tsx src/scripts/init-db.ts
 */
import fs from "fs";
import path from "path";
import { getDb, initSchema, upsertStations } from "../lib/db";
import { CURATED_RU } from "../lib/curated";

// Ensure data directory exists
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

console.log("Initializing database...");
initSchema();

// Seed curated stations
const curated = CURATED_RU.map((s) => ({
  id: s.stationuuid,
  name: s.name,
  url: s.url,
  url_resolved: s.url_resolved,
  favicon: s.favicon,
  tags: s.tags,
  country: s.country,
  countrycode: s.countrycode,
  language: s.language,
  codec: s.codec,
  bitrate: s.bitrate,
  votes: s.votes,
  source: "curated" as const,
  source_id: s.stationuuid,
  is_curated: 1,
}));

upsertStations(curated);
console.log(`Seeded ${curated.length} curated stations.`);

const db = getDb();
const count = (db.prepare("SELECT COUNT(*) as cnt FROM stations").get() as { cnt: number }).cnt;
console.log(`Total stations in DB: ${count}`);
console.log("Done.");
