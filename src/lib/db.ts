import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "radio.db");

/** Countries hidden from display (stations kept in DB but never shown) */
const HIDDEN_COUNTRIES = ["UA"];

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
  }
  return _db;
}

/** Station row as stored in the database */
export interface StationRow {
  id: string;
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
  geo_lat: number | null;
  geo_long: number | null;
  city: string;
  source: string;
  source_id: string;
  is_curated: number;
  last_check_at: string | null;
  last_check_ok: number;
  check_count: number;
  fail_count: number;
  created_at: string;
  updated_at: string;
}

/** Initialize the database schema */
export function initSchema() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS stations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL DEFAULT '',
      url_resolved TEXT NOT NULL UNIQUE,
      favicon TEXT DEFAULT '',
      tags TEXT DEFAULT '',
      country TEXT DEFAULT '',
      countrycode TEXT DEFAULT '',
      language TEXT DEFAULT '',
      codec TEXT DEFAULT '',
      bitrate INTEGER DEFAULT 0,
      votes INTEGER DEFAULT 0,
      geo_lat REAL,
      geo_long REAL,
      city TEXT DEFAULT '',
      source TEXT DEFAULT 'manual',
      source_id TEXT DEFAULT '',
      is_curated INTEGER DEFAULT 0,
      last_check_at TEXT,
      last_check_ok INTEGER DEFAULT 0,
      check_count INTEGER DEFAULT 0,
      fail_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_stations_countrycode ON stations(countrycode);
    CREATE INDEX IF NOT EXISTS idx_stations_check ON stations(last_check_ok);
    CREATE INDEX IF NOT EXISTS idx_stations_name ON stations(name COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_stations_source ON stations(source);
    CREATE INDEX IF NOT EXISTS idx_stations_curated ON stations(is_curated);
    CREATE INDEX IF NOT EXISTS idx_stations_votes ON stations(votes);
  `);

  // Migrate: add geo columns if missing (for existing databases)
  const cols = db.prepare("PRAGMA table_info(stations)").all() as { name: string }[];
  const colNames = new Set(cols.map(c => c.name));
  if (!colNames.has("geo_lat")) {
    db.exec("ALTER TABLE stations ADD COLUMN geo_lat REAL");
    db.exec("ALTER TABLE stations ADD COLUMN geo_long REAL");
    db.exec("ALTER TABLE stations ADD COLUMN city TEXT DEFAULT ''");
  }

  // Create geo indexes (after migration ensures columns exist)
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_stations_geo ON stations(geo_lat, geo_long);
    CREATE INDEX IF NOT EXISTS idx_stations_city ON stations(city);
  `);
}

/** Upsert a station — insert or update if url_resolved already exists */
export function upsertStation(station: {
  id: string;
  name: string;
  url?: string;
  url_resolved: string;
  favicon?: string;
  tags?: string;
  country?: string;
  countrycode?: string;
  language?: string;
  codec?: string;
  bitrate?: number;
  votes?: number;
  geo_lat?: number | null;
  geo_long?: number | null;
  city?: string;
  source?: string;
  source_id?: string;
  is_curated?: number;
}) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO stations (id, name, url, url_resolved, favicon, tags, country, countrycode, language, codec, bitrate, votes, geo_lat, geo_long, city, source, source_id, is_curated)
    VALUES (@id, @name, @url, @url_resolved, @favicon, @tags, @country, @countrycode, @language, @codec, @bitrate, @votes, @geo_lat, @geo_long, @city, @source, @source_id, @is_curated)
    ON CONFLICT(url_resolved) DO UPDATE SET
      name = CASE WHEN excluded.is_curated = 1 THEN excluded.name ELSE COALESCE(NULLIF(excluded.name, ''), stations.name) END,
      favicon = CASE WHEN excluded.favicon != '' THEN excluded.favicon ELSE stations.favicon END,
      tags = CASE WHEN excluded.tags != '' THEN excluded.tags ELSE stations.tags END,
      country = CASE WHEN excluded.country != '' THEN excluded.country ELSE stations.country END,
      countrycode = CASE WHEN excluded.countrycode != '' THEN excluded.countrycode ELSE stations.countrycode END,
      language = CASE WHEN excluded.language != '' THEN excluded.language ELSE stations.language END,
      codec = CASE WHEN excluded.codec != '' THEN excluded.codec ELSE stations.codec END,
      bitrate = CASE WHEN excluded.bitrate > 0 THEN excluded.bitrate ELSE stations.bitrate END,
      votes = CASE WHEN excluded.votes > stations.votes THEN excluded.votes ELSE stations.votes END,
      geo_lat = CASE WHEN excluded.geo_lat IS NOT NULL THEN excluded.geo_lat ELSE stations.geo_lat END,
      geo_long = CASE WHEN excluded.geo_long IS NOT NULL THEN excluded.geo_long ELSE stations.geo_long END,
      city = CASE WHEN excluded.city != '' THEN excluded.city ELSE stations.city END,
      is_curated = CASE WHEN excluded.is_curated = 1 THEN 1 ELSE stations.is_curated END,
      updated_at = datetime('now')
  `);
  stmt.run({
    id: station.id,
    name: station.name,
    url: station.url || station.url_resolved,
    url_resolved: station.url_resolved,
    favicon: station.favicon || "",
    tags: station.tags || "",
    country: station.country || "",
    countrycode: station.countrycode || "",
    language: station.language || "",
    codec: station.codec || "",
    bitrate: station.bitrate || 0,
    votes: station.votes || 0,
    geo_lat: station.geo_lat ?? null,
    geo_long: station.geo_long ?? null,
    city: station.city || "",
    source: station.source || "manual",
    source_id: station.source_id || "",
    is_curated: station.is_curated || 0,
  });
}

/** Bulk upsert stations in a transaction */
export function upsertStations(stations: Parameters<typeof upsertStation>[0][]) {
  const db = getDb();
  const tx = db.transaction(() => {
    for (const s of stations) {
      upsertStation(s);
    }
  });
  tx();
}

/** Update health check result for a station */
export function updateHealthCheck(urlResolved: string, ok: boolean) {
  const db = getDb();
  db.prepare(`
    UPDATE stations SET
      last_check_at = datetime('now'),
      last_check_ok = @ok,
      check_count = check_count + 1,
      fail_count = CASE WHEN @ok = 0 THEN fail_count + 1 ELSE 0 END,
      updated_at = datetime('now')
    WHERE url_resolved = @url
  `).run({ url: urlResolved, ok: ok ? 1 : 0 });
}

/** Query stations with filters */
export function queryStations(opts: {
  countrycode?: string;
  tag?: string;
  search?: string;
  limit?: number;
  offset?: number;
  onlyVerified?: boolean;
}): StationRow[] {
  const db = getDb();
  const conditions: string[] = [];
  const params: Record<string, unknown> = {};

  if (opts.onlyVerified !== false) {
    // By default, only return stations that passed health check or are curated
    conditions.push("(last_check_ok = 1 OR is_curated = 1)");
  }

  if (HIDDEN_COUNTRIES.length) {
    conditions.push(`countrycode NOT IN (${HIDDEN_COUNTRIES.map((_, i) => `@_hc${i}`).join(",")})`);
    HIDDEN_COUNTRIES.forEach((c, i) => { params[`_hc${i}`] = c; });
  }

  if (opts.countrycode) {
    conditions.push("countrycode = @countrycode");
    params.countrycode = opts.countrycode.toUpperCase();
  }

  if (opts.tag) {
    conditions.push("tags LIKE @tag");
    params.tag = `%${opts.tag}%`;
  }

  if (opts.search) {
    conditions.push("name LIKE @search");
    params.search = `%${opts.search}%`;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = opts.limit || 50;
  const offset = opts.offset || 0;

  return db.prepare(`
    SELECT * FROM stations
    ${where}
    ORDER BY is_curated DESC, votes DESC, name ASC
    LIMIT @limit OFFSET @offset
  `).all({ ...params, limit, offset }) as StationRow[];
}

/** Get top stations globally */
export function getTopStations(limit = 50): StationRow[] {
  const db = getDb();
  const hiddenPlaceholders = HIDDEN_COUNTRIES.map(() => "?").join(",");
  return db.prepare(`
    SELECT * FROM stations
    WHERE (last_check_ok = 1 OR is_curated = 1)
      AND countrycode NOT IN (${hiddenPlaceholders})
    ORDER BY votes DESC
    LIMIT ?
  `).all(...HIDDEN_COUNTRIES, limit) as StationRow[];
}

/** Count stations matching a filter */
export function countStations(opts: {
  countrycode?: string;
  tag?: string;
  onlyVerified?: boolean;
}): number {
  const db = getDb();
  const conditions: string[] = [];
  const params: Record<string, unknown> = {};

  if (opts.onlyVerified !== false) {
    conditions.push("(last_check_ok = 1 OR is_curated = 1)");
  }
  if (HIDDEN_COUNTRIES.length) {
    conditions.push(`countrycode NOT IN (${HIDDEN_COUNTRIES.map((_, i) => `@_hc${i}`).join(",")})`);
    HIDDEN_COUNTRIES.forEach((c, i) => { params[`_hc${i}`] = c; });
  }
  if (opts.countrycode) {
    conditions.push("countrycode = @countrycode");
    params.countrycode = opts.countrycode.toUpperCase();
  }
  if (opts.tag) {
    conditions.push("tags LIKE @tag");
    params.tag = `%${opts.tag}%`;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const row = db.prepare(`SELECT COUNT(*) as cnt FROM stations ${where}`).get(params) as { cnt: number };
  return row.cnt;
}

/** Get all stations that need health checking (oldest checked first) */
export function getStationsForHealthCheck(limit = 200): StationRow[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM stations
    ORDER BY last_check_at ASC NULLS FIRST
    LIMIT ?
  `).all(limit) as StationRow[];
}

/** Remove stations that have failed too many consecutive checks */
export function pruneDeadStations(maxFails = 10) {
  const db = getDb();
  const result = db.prepare(`
    DELETE FROM stations
    WHERE fail_count >= ? AND is_curated = 0
  `).run(maxFails);
  return result.changes;
}

/** Deduplicate: for stations with same name+countrycode, keep the one with highest votes/bitrate */
export function deduplicateStations(): number {
  const db = getDb();
  // Find duplicate groups and keep the best station in each
  const result = db.prepare(`
    DELETE FROM stations
    WHERE id NOT IN (
      SELECT id FROM (
        SELECT id,
          ROW_NUMBER() OVER (
            PARTITION BY LOWER(TRIM(name)), countrycode
            ORDER BY is_curated DESC, votes DESC, bitrate DESC
          ) as rn
        FROM stations
        WHERE countrycode != ''
      )
      WHERE rn = 1
    )
    AND countrycode != ''
    AND is_curated = 0
  `).run();
  return result.changes;
}

/** Convert DB row to the Station interface used by the frontend */
export function rowToStation(row: StationRow) {
  return {
    stationuuid: row.id,
    name: row.name,
    url: row.url,
    url_resolved: row.url_resolved,
    favicon: row.favicon,
    tags: row.tags,
    country: row.country,
    countrycode: row.countrycode,
    language: row.language,
    votes: row.votes,
    codec: row.codec,
    bitrate: row.bitrate,
    geo_lat: row.geo_lat,
    geo_long: row.geo_long,
    city: row.city,
  };
}

/** Get all cities with station counts for the map */
export function getCitiesForMap(): { city: string; countrycode: string; country: string; lat: number; lng: number; count: number }[] {
  const db = getDb();
  const hiddenPlaceholders = HIDDEN_COUNTRIES.map(() => "?").join(",");
  // Strategy: group by actual city name + countrycode.
  // For stations with empty city, fall back to coordinate grid (0.2 degree ~ 22km).
  // Strip region prefixes like "Noord-Holland, Amsterdam" -> "Amsterdam"
  return db.prepare(`
    WITH cleaned AS (
      SELECT 
        id,
        geo_lat,
        geo_long,
        countrycode,
        country,
        CASE
          WHEN city LIKE '%,%' THEN TRIM(SUBSTR(city, INSTR(city, ',') + 1))
          ELSE city
        END as clean_city
      FROM stations
      WHERE geo_lat IS NOT NULL 
        AND geo_long IS NOT NULL
        AND ABS(geo_lat) > 0.1
        AND (last_check_ok = 1 OR is_curated = 1)
        AND countrycode NOT IN (${hiddenPlaceholders})
    ),
    -- Stations with a real city name: group by city + countrycode
    named AS (
      SELECT
        clean_city as city,
        countrycode,
        MAX(country) as country,
        ROUND(AVG(geo_lat), 4) as lat,
        ROUND(AVG(geo_long), 4) as lng,
        COUNT(*) as count
      FROM cleaned
      WHERE clean_city != '' AND LENGTH(clean_city) <= 50
      GROUP BY clean_city, countrycode
    ),
    -- Stations without city name: group by coordinate grid (0.2 degree)
    unnamed AS (
      SELECT
        COALESCE(
          (SELECT c2.clean_city FROM cleaned c2 
           WHERE c2.clean_city != '' AND LENGTH(c2.clean_city) <= 50
             AND ROUND(c2.geo_lat, 1) = ROUND(c.geo_lat, 1)
             AND ROUND(c2.geo_long, 1) = ROUND(c.geo_long, 1)
             AND c2.countrycode = c.countrycode
           GROUP BY c2.clean_city ORDER BY COUNT(*) DESC LIMIT 1),
          c.country
        ) as city,
        c.countrycode,
        c.country,
        ROUND(AVG(c.geo_lat), 4) as lat,
        ROUND(AVG(c.geo_long), 4) as lng,
        COUNT(*) as count
      FROM cleaned c
      WHERE c.clean_city = '' OR c.clean_city IS NULL OR LENGTH(c.clean_city) > 50
      GROUP BY ROUND(c.geo_lat, 1), ROUND(c.geo_long, 1), c.countrycode
    )
    SELECT city, countrycode, country, lat, lng, count FROM named
    UNION ALL
    SELECT city, countrycode, country, lat, lng, count FROM unnamed
    ORDER BY count DESC
  `).all(...HIDDEN_COUNTRIES) as { city: string; countrycode: string; country: string; lat: number; lng: number; count: number }[];
}

/** Get stations near a specific location (for map clicks) */
export function getStationsByCity(city: string, countrycode: string, lat?: number, lng?: number): StationRow[] {
  const db = getDb();

  // First try exact city name match (handles cleaned names like "Amsterdam")
  // Also search for "Province, City" pattern in the raw data
  const byCity = db.prepare(`
    SELECT * FROM stations
    WHERE countrycode = @countrycode
      AND (last_check_ok = 1 OR is_curated = 1)
      AND (
        city = @city 
        OR city LIKE '%' || @city
        OR TRIM(SUBSTR(city, INSTR(city, ',') + 1)) = @city
      )
    ORDER BY votes DESC, name ASC
  `).all({ city, countrycode }) as StationRow[];

  if (byCity.length > 0) return byCity;

  // Fallback: coordinate-based search (0.15 degree radius)
  if (lat !== undefined && lng !== undefined) {
    return db.prepare(`
      SELECT * FROM stations
      WHERE ABS(geo_lat - @lat) < 0.15 
        AND ABS(geo_long - @lng) < 0.15
        AND countrycode = @countrycode
        AND (last_check_ok = 1 OR is_curated = 1)
      ORDER BY votes DESC, name ASC
    `).all({ lat, lng, countrycode }) as StationRow[];
  }

  return [];
}
