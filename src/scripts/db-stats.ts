import { getDb } from "../lib/db";

const db = getDb();
const total = db.prepare("SELECT COUNT(*) as c FROM stations").get() as { c: number };
const verified = db.prepare("SELECT COUNT(*) as c FROM stations WHERE last_check_ok = 1").get() as { c: number };
const withGeo = db.prepare("SELECT COUNT(*) as c FROM stations WHERE geo_lat IS NOT NULL AND geo_long IS NOT NULL AND ABS(geo_lat) > 0.1").get() as { c: number };
const withCity = db.prepare("SELECT COUNT(*) as c FROM stations WHERE city != '' AND city IS NOT NULL").get() as { c: number };
const countries = db.prepare("SELECT COUNT(DISTINCT countrycode) as c FROM stations WHERE countrycode != ''").get() as { c: number };
const cities = db.prepare("SELECT COUNT(DISTINCT city || '|' || countrycode) as c FROM stations WHERE city != '' AND geo_lat IS NOT NULL").get() as { c: number };

console.log("DB Stats:");
console.log(`  Total stations: ${total.c}`);
console.log(`  Verified (last_check_ok=1): ${verified.c}`);
console.log(`  With geo: ${withGeo.c}`);
console.log(`  With city name: ${withCity.c}`);
console.log(`  Distinct countries: ${countries.c}`);
console.log(`  Distinct cities: ${cities.c}`);

const sample = db.prepare(`
  SELECT id, name, city, countrycode, country, geo_lat, geo_long, url_resolved
  FROM stations 
  WHERE last_check_ok = 1 AND city != '' AND geo_lat IS NOT NULL
  ORDER BY votes DESC
  LIMIT 5
`).all();
console.log("\nTop verified stations with city+geo:");
console.log(JSON.stringify(sample, null, 2));
