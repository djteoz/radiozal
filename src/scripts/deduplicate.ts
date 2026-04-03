/**
 * Deduplicate stations: for same name+country, keep best stream.
 * Run: npx tsx src/scripts/deduplicate.ts
 */
import { initSchema, deduplicateStations, getDb } from "../lib/db";

function main() {
  console.log("=== Station Deduplication ===\n");
  initSchema();

  const db = getDb();
  const before = (db.prepare("SELECT COUNT(*) as cnt FROM stations").get() as { cnt: number }).cnt;

  const removed = deduplicateStations();

  const after = (db.prepare("SELECT COUNT(*) as cnt FROM stations").get() as { cnt: number }).cnt;
  console.log(`Before: ${before}`);
  console.log(`Removed: ${removed}`);
  console.log(`After: ${after}`);
  console.log("Done.");
}

main();
