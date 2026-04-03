/**
 * Full pipeline: init DB, import curated, crawl all sources, health check.
 * Run: npx tsx src/scripts/cron.ts
 * Schedule via crontab every 6 hours.
 */
const { execSync } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const opts = { cwd: root, stdio: "inherit" as const };

console.log(`\n[${ new Date().toISOString() }] === Cron Job Start ===\n`);

try {
  console.log("Step 1: Init DB + seed curated...");
  execSync("npx tsx src/scripts/init-db.ts", opts);

  console.log("\nStep 2: Crawl Radio Browser (all stations)...");
  execSync("npx tsx src/scripts/crawl-radiobrowser.ts", opts);

  console.log("\nStep 3: Crawl FMSTREAM (full pagination)...");
  execSync("npx tsx src/scripts/crawl-fmstream.ts", opts);

  console.log("\nStep 4: Crawl StreamURL...");
  execSync("npx tsx src/scripts/crawl-streamurl.ts", opts);

  console.log("\nStep 5: Deduplicate stations...");
  execSync("npx tsx src/scripts/deduplicate.ts", opts);

  console.log("\nStep 6: Health check...");
  execSync("npx tsx src/scripts/health-check.ts", opts);

  console.log(`\n[${ new Date().toISOString() }] === Cron Job Complete ===`);
} catch (err) {
  console.error("Cron job failed:", err);
  process.exit(1);
}
