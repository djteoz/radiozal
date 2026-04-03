/**
 * RG-compatible data layer.
 * Provides Radio Garden-compatible API responses using local SQLite data.
 *
 * Generates deterministic 8-char IDs for places, channels, and countries
 * so that the same entity always gets the same ID across restarts.
 */

import crypto from "crypto";
import { getDb, type StationRow } from "./db";

const HIDDEN_COUNTRIES = ["UA"];
const VERSION = "a1b2c3d"; // Our version hash (7 hex chars like RG)

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

/** Generate a deterministic 8-char ID from an arbitrary string key. */
function genId(input: string): string {
  return crypto
    .createHash("sha256")
    .update(input)
    .digest("base64url")
    .slice(0, 8);
}

/** Create a URL-friendly slug from a name. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlaceData {
  id: string;
  title: string;
  country: string;
  countrycode: string;
  countryId: string;
  lat: number;
  lng: number;
  size: number; // station count
  boost: boolean;
  slug: string;
  utcOffset: number;
}

interface ChannelData {
  id: string;
  title: string;
  placeId: string;
  placeTitle: string;
  countryId: string;
  countryTitle: string;
  countrycode: string;
  slug: string;
  stream: string; // domain of the stream
  streamUrl: string; // actual stream URL
  website: string;
  secure: boolean;
}

interface CountryData {
  id: string;
  title: string;
  code: string;
}

// ---------------------------------------------------------------------------
// Caches (built lazily on first request)
// ---------------------------------------------------------------------------

let _places: PlaceData[] | null = null;
let _placeMap: Map<string, PlaceData> | null = null;
let _channels: ChannelData[] | null = null;
let _channelMap: Map<string, ChannelData> | null = null;
let _countryMap: Map<string, CountryData> | null = null;
let _stationsByPlace: Map<string, ChannelData[]> | null = null;
// Map from station db id -> channel id
let _stationIdToChannelId: Map<string, string> | null = null;

function invalidateCache() {
  _places = null;
  _placeMap = null;
  _channels = null;
  _channelMap = null;
  _countryMap = null;
  _stationsByPlace = null;
  _stationIdToChannelId = null;
}

/** Build all caches from the database. */
function buildCaches() {
  if (_places) return;

  const db = getDb();
  const hiddenPlaceholders = HIDDEN_COUNTRIES.map(() => "?").join(",");

  // Get all verified stations with geo coordinates
  const rows = db
    .prepare(
      `SELECT * FROM stations
       WHERE geo_lat IS NOT NULL
         AND geo_long IS NOT NULL
         AND ABS(geo_lat) > 0.1
         AND (last_check_ok = 1 OR is_curated = 1)
         AND countrycode NOT IN (${hiddenPlaceholders})
       ORDER BY votes DESC, name ASC`
    )
    .all(...HIDDEN_COUNTRIES) as StationRow[];

  // Build country map
  const countryMap = new Map<string, CountryData>();
  for (const row of rows) {
    if (!row.countrycode || countryMap.has(row.countrycode)) continue;
    countryMap.set(row.countrycode, {
      id: genId(`country:${row.countrycode}`),
      title: row.country || row.countrycode,
      code: row.countrycode,
    });
  }

  // Group stations by city+countrycode to form places
  // For stations without city name, use coordinate grid (0.1 degree)
  interface CityGroup {
    key: string;
    city: string;
    countrycode: string;
    country: string;
    stations: StationRow[];
    latSum: number;
    lngSum: number;
  }

  const cityGroups = new Map<string, CityGroup>();

  for (const row of rows) {
    // Clean city name: strip region prefix like "Noord-Holland, Amsterdam"
    let city = row.city || "";
    if (city.includes(",")) {
      city = city.split(",").pop()!.trim();
    }

    let key: string;
    if (city && city.length <= 50) {
      key = `${city}|${row.countrycode}`;
    } else {
      // No city name -> group by coordinate grid
      const gridLat = Math.round((row.geo_lat ?? 0) * 10) / 10;
      const gridLng = Math.round((row.geo_long ?? 0) * 10) / 10;
      key = `grid:${gridLat}|${gridLng}|${row.countrycode}`;
      // Try to find a city name from nearby stations in the same grid
      city = row.country || row.countrycode;
    }

    let group = cityGroups.get(key);
    if (!group) {
      group = {
        key,
        city,
        countrycode: row.countrycode,
        country: row.country,
        stations: [],
        latSum: 0,
        lngSum: 0,
      };
      cityGroups.set(key, group);
    }
    group.stations.push(row);
    group.latSum += row.geo_lat ?? 0;
    group.lngSum += row.geo_long ?? 0;
    // Use the best city name (non-empty, from the station with most votes)
    if (
      city.length > 0 &&
      city.length <= 50 &&
      (group.city === group.country || group.city.length > city.length)
    ) {
      group.city = city;
    }
  }

  // Build places and channels
  const places: PlaceData[] = [];
  const placeMap = new Map<string, PlaceData>();
  const channels: ChannelData[] = [];
  const channelMap = new Map<string, ChannelData>();
  const stationsByPlace = new Map<string, ChannelData[]>();
  const stationIdToChannelId = new Map<string, string>();

  for (const group of cityGroups.values()) {
    const lat = group.latSum / group.stations.length;
    const lng = group.lngSum / group.stations.length;
    const placeId = genId(`place:${group.key}`);

    const place: PlaceData = {
      id: placeId,
      title: group.city || group.country,
      country: group.country,
      countrycode: group.countrycode,
      countryId: countryMap.get(group.countrycode)?.id || genId(`country:${group.countrycode}`),
      lat: Math.round(lat * 1e6) / 1e6,
      lng: Math.round(lng * 1e6) / 1e6,
      size: group.stations.length,
      boost: group.stations.length >= 50,
      slug: slugify(group.city || group.country),
      utcOffset: estimateUtcOffset(lng),
    };

    places.push(place);
    placeMap.set(placeId, place);

    const placeChannels: ChannelData[] = [];
    for (const st of group.stations) {
      const channelId = genId(`channel:${st.id}`);

      let streamDomain = "";
      try {
        streamDomain = new URL(st.url_resolved).hostname;
      } catch {
        streamDomain = st.url_resolved;
      }

      const channel: ChannelData = {
        id: channelId,
        title: st.name,
        placeId,
        placeTitle: place.title,
        countryId: place.countryId,
        countryTitle: group.country,
        countrycode: group.countrycode,
        slug: slugify(st.name),
        stream: streamDomain,
        streamUrl: st.url_resolved,
        website: st.favicon || "",
        secure: st.url_resolved.startsWith("https"),
      };

      channels.push(channel);
      channelMap.set(channelId, channel);
      placeChannels.push(channel);
      stationIdToChannelId.set(st.id, channelId);
    }

    stationsByPlace.set(placeId, placeChannels);
  }

  // Sort places by size descending
  places.sort((a, b) => b.size - a.size);

  _places = places;
  _placeMap = placeMap;
  _channels = channels;
  _channelMap = channelMap;
  _countryMap = countryMap;
  _stationsByPlace = stationsByPlace;
  _stationIdToChannelId = stationIdToChannelId;
}

/** Rough UTC offset estimate from longitude (-180..+180 -> -720..+720 minutes). */
function estimateUtcOffset(lng: number): number {
  return Math.round((lng / 15) * 60);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getVersion(): string {
  return VERSION;
}

/** /api/ara/content/places-core-columnar */
export function getPlacesCoreColumnar() {
  buildCaches();
  const places = _places!;
  return {
    apiVersion: 0,
    version: VERSION,
    data: {
      version: VERSION,
      ids: places.map((p) => p.id),
      lngs: places.map((p) => p.lng),
      lats: places.map((p) => p.lat),
      sizes: places.map((p) => p.size),
      boosts: places.map((p) => p.boost),
    },
  };
}

/** /api/ara/content/places-details-columnar */
export function getPlacesDetailsColumnar() {
  buildCaches();
  const places = _places!;

  // Build unique countries list & index
  const countryList: string[] = [];
  const countryIndexMap = new Map<string, number>();
  const countryIdx: number[] = [];

  for (const p of places) {
    if (!countryIndexMap.has(p.country)) {
      countryIndexMap.set(p.country, countryList.length);
      countryList.push(p.country);
    }
    countryIdx.push(countryIndexMap.get(p.country)!);
  }

  return {
    apiVersion: 0,
    version: VERSION,
    data: {
      version: VERSION,
      titles: places.map((p) => p.title),
      countries: countryList,
      countryIdx,
    },
  };
}

/** /api/ara/content/page/{placeId} */
export function getPlacePage(placeId: string) {
  buildCaches();
  const place = _placeMap!.get(placeId);
  if (!place) return null;

  const channels = _stationsByPlace!.get(placeId) || [];

  // Build main station list
  const stationItems = channels.map((ch) => ({
    page: {
      url: `/listen/${ch.slug}/${ch.id}`,
      type: "channel" as const,
      place: { id: place.id, title: place.title },
      title: ch.title,
      secure: ch.secure,
      country: { id: place.countryId, title: place.country },
      preroll: false,
      website: ch.website,
      stream: ch.stream,
    },
  }));

  // Find nearby places (within ~150km, same country first, up to 10)
  const nearbyPlaces = findNearbyPlaces(place, 10);
  const nearbyItems = nearbyPlaces.map((np) => ({
    title: np.title,
    rightDetail: `${Math.round(haversineKm(place.lat, place.lng, np.lat, np.lng))} km`,
    page: {
      map: np.id,
      url: `/visit/${np.slug}/${np.id}`,
      type: "page" as const,
      count: np.size,
      title: np.title,
      subtitle: np.country,
    },
  }));

  // Cities in same country (top 20 by size)
  const countryPlaces = _places!
    .filter((p) => p.countrycode === place.countrycode && p.id !== place.id)
    .slice(0, 20)
    .map((p) => ({
      title: p.title,
      leftAccessory: "count" as const,
      leftAccessoryCount: p.size,
      page: {
        map: p.id,
        url: `/visit/${p.slug}/${p.id}`,
        type: "page" as const,
        count: p.size,
        title: p.title,
        subtitle: place.country,
      },
    }));

  const content: Array<Record<string, unknown>> = [
    {
      itemsType: "channel",
      title: `Stations in ${place.title}`,
      type: "list",
      items: stationItems,
    },
  ];

  if (nearbyItems.length > 0) {
    content.push({
      title: `Nearby ${place.title}`,
      type: "list",
      items: nearbyItems,
    });
  }

  if (countryPlaces.length > 0) {
    content.push({
      title: `Cities in ${place.country}`,
      type: "list",
      items: countryPlaces,
    });
  }

  return {
    apiVersion: 0,
    version: VERSION,
    data: {
      type: "page",
      count: channels.length,
      map: place.id,
      title: place.title,
      subtitle: place.country,
      url: `/visit/${place.slug}/${place.id}`,
      utcOffset: place.utcOffset,
      content,
    },
  };
}

/** /api/ara/content/channel/{channelId} */
export function getChannel(channelId: string) {
  buildCaches();
  const ch = _channelMap!.get(channelId);
  if (!ch) return null;

  return {
    apiVersion: 0,
    version: VERSION,
    data: {
      url: `/listen/${ch.slug}/${ch.id}`,
      type: "channel",
      place: { id: ch.placeId, title: ch.placeTitle },
      title: ch.title,
      secure: ch.secure,
      country: { id: ch.countryId, title: ch.countryTitle },
      preroll: false,
      website: ch.website,
      stream: ch.stream,
      id: ch.id,
    },
  };
}

/** /api/ara/content/place-v2/{placeId} */
export function getPlaceV2(placeId: string) {
  buildCaches();
  const place = _placeMap!.get(placeId);
  if (!place) return null;

  return {
    apiVersion: 0,
    version: VERSION,
    data: {
      size: place.size,
      title: place.title,
      geo: [place.lng, place.lat],
      boost: place.boost,
      country: place.country,
      id: place.id,
    },
  };
}

/** Get the actual stream URL for a channel (for proxying). */
export function getStreamUrl(channelId: string): string | null {
  buildCaches();
  const ch = _channelMap!.get(channelId);
  return ch?.streamUrl ?? null;
}

/** /api/search?q=... */
export function searchChannelsAndPlaces(query: string) {
  buildCaches();
  if (!query || query.length < 1) {
    return { took: 0, query, hits: { hits: [] }, version: VERSION, apiVersion: 0 };
  }

  const lowerQuery = query.toLowerCase();
  const hits: Array<{ _source: Record<string, unknown>; _score: number }> = [];

  // Search places
  for (const place of _places!) {
    if (place.title.toLowerCase().includes(lowerQuery)) {
      hits.push({
        _source: {
          code: place.countrycode,
          page: {
            map: place.id,
            url: `/visit/${place.slug}/${place.id}`,
            type: "page",
            count: place.size,
            title: place.title,
            subtitle: place.country,
          },
          type: "place",
        },
        _score: 1,
      });
    }
    if (hits.length >= 50) break;
  }

  // Search channels
  let channelHits = 0;
  for (const ch of _channels!) {
    if (ch.title.toLowerCase().includes(lowerQuery)) {
      const place = _placeMap!.get(ch.placeId);
      hits.push({
        _source: {
          code: ch.countrycode,
          page: {
            url: `/listen/${ch.slug}/${ch.id}`,
            type: "channel",
            place: { id: ch.placeId, title: ch.placeTitle },
            title: ch.title,
            secure: ch.secure,
            country: { id: ch.countryId, title: ch.countryTitle },
            preroll: false,
            website: ch.website,
            subtitle: `${ch.placeTitle}, ${ch.countryTitle}`,
            stream: ch.stream,
          },
          type: "channel",
        },
        _score: 1,
      });
      channelHits++;
      if (channelHits >= 20) break;
    }
  }

  return {
    took: 1,
    query,
    hits: { hits },
    version: VERSION,
    apiVersion: 0,
  };
}

/** POST /api/ara/content/favorites/v2 — resolve channel IDs to channel data */
export function resolveFavorites(channelIds: string[]) {
  buildCaches();
  const items = channelIds
    .map((id) => {
      const ch = _channelMap!.get(id);
      if (!ch) return null;
      return {
        page: {
          url: `/listen/${ch.slug}/${ch.id}`,
          type: "channel" as const,
          place: { id: ch.placeId, title: ch.placeTitle },
          title: ch.title,
          secure: ch.secure,
          country: { id: ch.countryId, title: ch.countryTitle },
          preroll: false,
          website: ch.website,
          stream: ch.stream,
          id: ch.id,
        },
      };
    })
    .filter(Boolean);

  return { apiVersion: 0, version: VERSION, data: items };
}

/** /api/ara/content/settings/index */
export function getSettings(locale = "en") {
  buildCaches();
  const totalPlaces = _places!.length;
  const totalChannels = _channels!.length;

  return {
    apiVersion: 0,
    version: VERSION,
    data: {
      type: "page",
      title: "Settings",
      url: "/settings",
      content: [
        {
          type: "list",
          title: "Information",
          rightAccessory: "chevron-right",
          items: [
            {
              page: { type: "page", title: "Радио Зал", url: "/settings/radiozal" },
              title: "Радио Зал",
            },
            {
              page: { type: "page", title: "Submit a Radio Station", url: "/settings/submit" },
              title: "Submit a Radio Station",
            },
            {
              page: { type: "page", title: "Contact", url: "/settings/contact" },
              title: "Contact",
            },
            {
              page: { type: "page", title: "Privacy Policy", url: "/settings/privacy-policy" },
              title: "Privacy Policy",
            },
          ],
        },
        {
          type: "list",
          title: "Statistics",
          items: [
            { title: "Cities", rightDetail: `${totalPlaces}` },
            { title: "Stations", rightDetail: `${totalChannels}` },
          ],
        },
      ],
    },
  };
}

/** /api/ara/content/browse — Browse page with country list */
export function getBrowsePage() {
  buildCaches();
  const countries = getCountriesWithPlaces();
  const countryItems = countries.map((c) => ({
    title: c.title,
    rightDetail: `${c.stationCount}`,
    page: {
      url: `/browse/${c.code.toLowerCase()}/${c.id}`,
      type: "page" as const,
      title: c.title,
    },
  }));

  return {
    apiVersion: 0,
    version: VERSION,
    data: {
      type: "page",
      title: "Browse",
      url: "/browse",
      content: [
        {
          type: "list",
          title: "Countries",
          itemsType: "default",
          items: countryItems,
        },
      ],
    },
  };
}

/** /api/ara/content/search — Search landing page with popular stations */
export function getSearchLandingPage() {
  buildCaches();
  // Pick top stations by votes for "Popular" section
  const topChannels = [..._channels!]
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 15);

  const popularItems = topChannels.map((ch) => ({
    page: {
      url: `/listen/${ch.slug}/${ch.id}`,
      type: "channel" as const,
      place: { id: ch.placeId, title: ch.placeTitle },
      title: ch.title,
      secure: ch.secure,
      country: { id: ch.countryId, title: ch.countryTitle },
      preroll: false,
      website: ch.website,
      stream: ch.stream,
    },
  }));

  return {
    apiVersion: 0,
    version: VERSION,
    data: {
      type: "page",
      title: "Search",
      url: "/search",
      content: [
        {
          type: "list",
          title: "Popular Across the Globe",
          subtitle: "An audience favorite for every country",
          itemsType: "channel",
          items: popularItems,
        },
      ],
    },
  };
}

/** Get all countries with place counts (for Browse tab). */
export function getCountriesWithPlaces() {
  buildCaches();
  const countryPlaces = new Map<string, { count: number; stationCount: number }>();
  for (const p of _places!) {
    const cur = countryPlaces.get(p.countrycode) || { count: 0, stationCount: 0 };
    cur.count += 1;
    cur.stationCount += p.size;
    countryPlaces.set(p.countrycode, cur);
  }

  const countries: Array<{
    id: string;
    title: string;
    code: string;
    placeCount: number;
    stationCount: number;
  }> = [];

  for (const [code, data] of countryPlaces) {
    const country = _countryMap!.get(code);
    if (country) {
      countries.push({
        ...country,
        placeCount: data.count,
        stationCount: data.stationCount,
      });
    }
  }

  countries.sort((a, b) => b.stationCount - a.stationCount);
  return countries;
}

/** Get places in a country (for Browse > Country drill-down). */
export function getPlacesByCountry(countrycode: string) {
  buildCaches();
  return _places!
    .filter((p) => p.countrycode === countrycode.toUpperCase())
    .map((p) => ({
      title: p.title,
      leftAccessory: "count" as const,
      leftAccessoryCount: p.size,
      page: {
        map: p.id,
        url: `/visit/${p.slug}/${p.id}`,
        type: "page" as const,
        count: p.size,
        title: p.title,
        subtitle: p.country,
      },
    }));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearbyPlaces(origin: PlaceData, limit: number): PlaceData[] {
  const places = _places!;
  const scored: Array<{ place: PlaceData; dist: number }> = [];

  for (const p of places) {
    if (p.id === origin.id) continue;
    const dist = haversineKm(origin.lat, origin.lng, p.lat, p.lng);
    if (dist < 300) {
      scored.push({ place: p, dist });
    }
  }

  scored.sort((a, b) => a.dist - b.dist);
  return scored.slice(0, limit).map((s) => s.place);
}

export { invalidateCache };
