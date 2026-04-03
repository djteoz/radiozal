/**
 * Health-check radio streams by sending HEAD requests.
 * Tests streams in batches with concurrency control.
 * Run: npx tsx src/scripts/health-check.ts
 */
import { initSchema, getStationsForHealthCheck, updateHealthCheck, pruneDeadStations, getDb } from "../lib/db";

const CONCURRENCY = 50;
const TIMEOUT_MS = 6000;
const BATCH_SIZE = 2000;

async function checkStream(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: { "User-Agent": "RadioZal-HealthCheck/1.0" },
      redirect: "follow",
    });
    clearTimeout(timer);

    if (!res.ok) return false;

    const ct = res.headers.get("content-type") || "";
    // Valid audio content types
    return /audio|mpegurl|x-scpls|ogg|aac|mp3|mpeg|pls|m3u/i.test(ct);
  } catch {
    return false;
  }
}

/** Run checks in batches with limited concurrency */
async function runBatch<T, R>(items: T[], fn: (item: T) => Promise<R>, concurrency: number): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

async function main() {
  console.log("=== Stream Health Checker ===\n");
  initSchema();

  const stations = getStationsForHealthCheck(BATCH_SIZE);
  console.log(`Checking ${stations.length} stations...\n`);

  let ok = 0;
  let fail = 0;

  await runBatch(
    stations,
    async (station) => {
      const isOk = await checkStream(station.url_resolved);
      updateHealthCheck(station.url_resolved, isOk);
      if (isOk) {
        ok++;
      } else {
        fail++;
        if (station.fail_count >= 5) {
          console.log(`  DEAD: ${station.name} (${station.fail_count + 1} fails)`);
        }
      }
    },
    CONCURRENCY
  );

  console.log(`\nResults: ${ok} OK, ${fail} FAIL`);

  // Prune stations that have failed 10+ consecutive checks (not curated)
  const pruned = pruneDeadStations(10);
  if (pruned > 0) {
    console.log(`Pruned ${pruned} dead stations.`);
  }

  const db = getDb();
  const total = (db.prepare("SELECT COUNT(*) as cnt FROM stations").get() as { cnt: number }).cnt;
  const verified = (db.prepare("SELECT COUNT(*) as cnt FROM stations WHERE last_check_ok = 1").get() as { cnt: number }).cnt;
  console.log(`\nDB: ${total} total, ${verified} verified.`);
  console.log("Done.");
}

main().catch(console.error);
