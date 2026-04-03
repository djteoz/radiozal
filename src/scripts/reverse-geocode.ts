/**
 * Reverse geocode stations: fill in city names using Nominatim (OpenStreetMap).
 * Rate limit: 1 request per second (Nominatim policy).
 * Run: npx tsx src/scripts/reverse-geocode.ts
 */
import { getDb, initSchema } from "../lib/db";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
const DELAY_MS = 1100; // 1.1 sec between requests (Nominatim: max 1/sec)

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface NominatimResult {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    suburb?: string;
    municipality?: string;
    county?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `${NOMINATIM_URL}?lat=${lat}&lon=${lon}&format=json&zoom=10&accept-language=en`,
      {
        headers: {
          "User-Agent": "RadioZal/1.0 (radiozal.ru)",
        },
      }
    );
    if (!res.ok) return "";
    const data: NominatimResult = await res.json();
    const addr = data.address;
    if (!addr) return "";
    // Priority: city > town > village > municipality > suburb > hamlet > county
    return addr.city || addr.town || addr.village || addr.municipality || addr.suburb || addr.hamlet || addr.county || "";
  } catch {
    return "";
  }
}

async function main() {
  initSchema();
  const db = getDb();

  // Phase 1: Find "city" names that are actually state/province names.
  // These span large geographic areas - many stations with same "city" but far apart.
  const suspectCities = db.prepare(`
    SELECT city, countrycode, COUNT(*) as cnt,
           MAX(geo_lat) - MIN(geo_lat) as lat_span,
           MAX(geo_long) - MIN(geo_long) as lng_span
    FROM stations
    WHERE city IS NOT NULL AND city != ''
      AND geo_lat IS NOT NULL AND ABS(geo_lat) > 0.1
      AND (last_check_ok = 1 OR is_curated = 1)
    GROUP BY city, countrycode
    HAVING (lat_span > 1.0 OR lng_span > 1.0) AND cnt >= 3
  `).all() as { city: string; countrycode: string; cnt: number; lat_span: number; lng_span: number }[];

  console.log(`Found ${suspectCities.length} suspect state/province "city" names to re-geocode:`);
  suspectCities.slice(0, 20).forEach(c => 
    console.log(`  ${c.city} (${c.countrycode}): ${c.cnt} stations, span ${c.lat_span.toFixed(1)}°x${c.lng_span.toFixed(1)}°`)
  );

  const suspectSet = new Set(suspectCities.map(c => `${c.city}|${c.countrycode}`));

  // Get stations with empty/bad city 
  const stations = db.prepare(`
    SELECT id, geo_lat, geo_long, city, countrycode
    FROM stations
    WHERE geo_lat IS NOT NULL 
      AND geo_long IS NOT NULL
      AND ABS(geo_lat) > 0.1
      AND (last_check_ok = 1 OR is_curated = 1)
      AND (city = '' OR city IS NULL OR city LIKE '%,%' OR LENGTH(city) > 50)
    ORDER BY votes DESC
  `).all() as { id: string; geo_lat: number; geo_long: number; city: string; countrycode: string }[];

  // Add stations whose "city" is a suspect state/province name
  const allWithCity = db.prepare(`
    SELECT id, geo_lat, geo_long, city, countrycode
    FROM stations
    WHERE geo_lat IS NOT NULL 
      AND geo_long IS NOT NULL
      AND ABS(geo_lat) > 0.1
      AND (last_check_ok = 1 OR is_curated = 1)
      AND city IS NOT NULL AND city != ''
    ORDER BY votes DESC
  `).all() as { id: string; geo_lat: number; geo_long: number; city: string; countrycode: string }[];

  const seenIds = new Set(stations.map(s => s.id));
  for (const s of allWithCity) {
    if (!seenIds.has(s.id) && suspectSet.has(`${s.city}|${s.countrycode}`)) {
      stations.push(s);
      seenIds.add(s.id);
    }
  }

  console.log(`Total stations to geocode: ${stations.length}`);

  const updateStmt = db.prepare(`
    UPDATE stations SET city = @city, updated_at = datetime('now') WHERE id = @id
  `);

  // Cache: same rounded coords -> same city
  const cache = new Map<string, string>();

  let done = 0;
  let updated = 0;
  let cached = 0;

  for (const s of stations) {
    const key = `${s.geo_lat.toFixed(2)},${s.geo_long.toFixed(2)}`;
    
    let cityName: string;
    if (cache.has(key)) {
      cityName = cache.get(key)!;
      cached++;
    } else {
      cityName = await reverseGeocode(s.geo_lat, s.geo_long);
      cache.set(key, cityName);
      await sleep(DELAY_MS);
    }

    if (cityName) {
      updateStmt.run({ id: s.id, city: cityName });
      updated++;
    }

    done++;
    if (done % 50 === 0 || done === stations.length) {
      console.log(`Progress: ${done}/${stations.length} (updated: ${updated}, cached: ${cached})`);
    }
  }

  console.log(`\nDone! Updated ${updated} stations out of ${stations.length}`);
  console.log(`Cache hits: ${cached}`);
  db.close();
}

main().catch(console.error);
