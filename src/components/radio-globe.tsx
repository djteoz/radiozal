"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Station } from "@/lib/api";
import { usePlayer } from "./player-context";
import { useFavorites } from "./favorites-context";
import { Equalizer } from "./equalizer";

/* ── Types ─────────────────────────────────────────── */

interface CityPoint {
  city: string;
  countrycode: string;
  country: string;
  lat: number;
  lng: number;
  count: number;
}

type Tab = "explore" | "favorites" | "browse" | "search" | "settings";

/* ── Helpers ───────────────────────────────────────── */

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestCity(lat: number, lng: number, cities: CityPoint[]) {
  let best: CityPoint | null = null;
  let bestDist = Infinity;
  for (const c of cities) {
    const d = haversine(lat, lng, c.lat, c.lng);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}

function getLocalTime(lng: number): string {
  const offset = Math.round(lng / 15);
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const local = new Date(utc + offset * 3600000);
  return `${String(local.getHours()).padStart(2, "0")}:${String(local.getMinutes()).padStart(2, "0")}`;
}

function formatDistance(km: number): string {
  if (km < 1) return "< 1 km";
  return `${Math.round(km)} km`;
}

/* ── Chevron ───────────────────────────────────────── */

function Chevron() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 32 32">
      <polyline points="13 8 21 16 13 24" />
    </svg>
  );
}

/* ── Constants ─────────────────────────────────────── */

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY || "";

/* ── Main Component ────────────────────────────────── */

export default function RadioGlobe() {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const citiesRef = useRef<CityPoint[]>([]);
  const geoTriggered = useRef(false);
  const handleCityClickRef = useRef<(point: CityPoint) => void>(undefined);
  const pulsingMarkerRef = useRef<any>(null);

  const [cities, setCities] = useState<CityPoint[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityPoint | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [globeReady, setGlobeReady] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [previousCity, setPreviousCity] = useState<CityPoint | null>(null);
  const [showAllStations, setShowAllStations] = useState(false);
  const [stationLocked, setStationLocked] = useState(false);

  /* Tabs */
  const [activeTab, setActiveTab] = useState<Tab>("explore");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Station[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  /* Browse */
  const [browseCountry, setBrowseCountry] = useState<string | null>(null);

  /* Settings sub-page */
  type SettingsPage = null | "about" | "contact" | "privacy";
  const [settingsPage, setSettingsPage] = useState<SettingsPage>(null);

  /* More menu (three dots) */
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  /* Player & favorites */
  const {
    play, pause, resume, next, prev,
    station: currentStation, isPlaying, volume, setVolume,
    nowPlaying, setPlaylist,
  } = usePlayer();
  const { favorites, isFavorite, toggle } = useFavorites();

  /* Keep citiesRef in sync */
  useEffect(() => {
    citiesRef.current = cities;
  }, [cities]);

  /* ── Computed ─────────────────────────────────────── */

  const nearbyCities = useMemo(() => {
    if (!selectedCity || !cities.length) return [];
    return cities
      .filter(
        (c) =>
          !(c.lat === selectedCity.lat &&
            c.lng === selectedCity.lng &&
            c.countrycode === selectedCity.countrycode)
      )
      .map((c) => ({
        ...c,
        distance: haversine(selectedCity.lat, selectedCity.lng, c.lat, c.lng),
      }))
      .filter((c) => c.distance < 200)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  }, [selectedCity, cities]);

  const popularStations = useMemo(() => {
    if (!stations.length) return [];
    return [...stations].sort((a, b) => (b.votes || 0) - (a.votes || 0)).slice(0, 3);
  }, [stations]);

  const countryCities = useMemo(() => {
    if (!selectedCity) return [];
    return cities
      .filter((c) => c.countrycode === selectedCity.countrycode)
      .sort((a, b) => b.count - a.count);
  }, [selectedCity, cities]);

  const countries = useMemo(() => {
    const map = new Map<string, { name: string; code: string; count: number }>();
    for (const c of cities) {
      const ex = map.get(c.countrycode);
      if (ex) ex.count += c.count;
      else map.set(c.countrycode, { name: c.country, code: c.countrycode, count: c.count });
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [cities]);

  const browseCities = useMemo(() => {
    if (!browseCountry) return [];
    return cities
      .filter((c) => c.countrycode === browseCountry)
      .sort((a, b) => b.count - a.count);
  }, [browseCountry, cities]);

  /* ── Effects ─────────────────────────────────────── */

  // Initialize MapLibre GL
  useEffect(() => {
    if (!mapContainerRef.current) return;
    let map: any;
    let resizeHandler: (() => void) | null = null;

    // Globe must fill the viewport to hide the backface (reverse side of the sphere).
    // MapLibre globe radius = worldSize / (2π), worldSize = 512 * 2^zoom.
    // Globe diameter = 512 * 2^zoom / π. For diameter >= maxDim:
    // zoom >= log2(maxDim * π / 512)
    function computeMinZoom() {
      // RG: globe fills the ENTIRE viewport (not just right portion)
      // The globe extends behind the left panel — panel overlays the globe
      const maxDim = Math.max(window.innerWidth, window.innerHeight);
      return Math.log2(maxDim * Math.PI / 512) + 0.3;
    }

    import("maplibre-gl").then(async (maplibregl) => {
      const calculatedMinZoom = computeMinZoom();

      const style = {
        version: 8 as const,
        projection: { type: "globe" as const },
        name: "RadioZal",
        sources: {
          satellite: {
            type: "raster" as const,
            tiles: [`https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`],
            tileSize: 512,
            maxzoom: 20,
          },
        },
        layers: [
          {
            id: "globe-fill",
            type: "background" as const,
            paint: { "background-color": "rgb(45, 0, 255)" },
          },
          {
            id: "satellite",
            type: "raster" as const,
            source: "satellite",
            minzoom: 0,
            maxzoom: 22,
          },
        ],
        sky: {
          "sky-color": "rgb(45, 0, 255)",
          "sky-horizon-blend": 0.5,
          "horizon-color": "rgb(45, 0, 255)",
          "horizon-fog-blend": 0.5,
          "fog-color": "rgb(45, 0, 255)",
          "fog-ground-blend": 0.5,
          "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 0.85, 6, 0.5, 10, 0.2, 12, 0],
        },
      };

      const container = mapContainerRef.current!;

      map = new maplibregl.Map({
        container,
        style: style as any,
        center: [75, 50] as [number, number],
        zoom: 2,
        minZoom: calculatedMinZoom,
        maxZoom: 18,
        attributionControl: false,
        renderWorldCopies: false,
        canvasContextAttributes: { antialias: true },
        doubleClickZoom: false,
        dragPan: false,
        scrollZoom: false,
        touchPitch: false,
        touchZoomRotate: false,
        dragRotate: false,
      });

      // Re-enable interactions with RG's exact zoom rates
      map.scrollZoom.enable();
      map.scrollZoom.setZoomRate(1 / 100);
      map.scrollZoom.setWheelZoomRate(1 / 200);
      map.dragRotate.enable();
      map.dragPan.enable();
      map.touchZoomRotate.enable();
      map.touchZoomRotate.disableRotation();

      // RG pinch rates
      try {
        map.scrollZoom.setPinchZoomRate?.(1 / 25);
        map.touchZoomRotate.setPinchRate?.(1 / 75);
      } catch {}

      // Initial padding: shift globe right to account for left panel
      map.setPadding({ left: 340, top: 0, right: 0, bottom: 0 });

      map.on("load", () => {
        setGlobeReady(true);
      });

      // Resize: update minZoom so globe always fills the viewport
      resizeHandler = () => {
        map.resize();
        const newMinZoom = computeMinZoom();
        map.setMinZoom(newMinZoom);
        if (map.getZoom() < newMinZoom) {
          map.setZoom(newMinZoom);
        }
      };
      window.addEventListener("resize", resizeHandler);

      mapRef.current = map;
    });

    return () => {
      if (resizeHandler) window.removeEventListener("resize", resizeHandler);
      map?.remove();
    };
  }, []);

  // Fetch cities
  useEffect(() => {
    fetch("/api/map")
      .then((r) => r.json())
      .then((data: CityPoint[]) => setCities(data))
      .catch(() => {});
  }, []);

  // Add cities layer to map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !globeReady || cities.length === 0) return;

    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: cities.map((c) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [c.lng, c.lat] },
        properties: { city: c.city, countrycode: c.countrycode, country: c.country, count: c.count, lat: c.lat, lng: c.lng },
      })),
    };

    if (map.getSource("cities")) {
      map.getSource("cities").setData(geojson);
      return;
    }

    map.addSource("cities", { type: "geojson", data: geojson });

    // Glow layer (bloom effect)
    map.addLayer({
      id: "cities-glow",
      type: "circle",
      source: "cities",
      paint: {
        "circle-color": "rgb(0, 255, 130)",
        "circle-radius": [
          "interpolate", ["linear"], ["zoom"],
          0, ["interpolate", ["linear"], ["get", "count"],
            1, 1.5 * 0.14 * 0.5,   // small: scale * globalScale
            5, 2.5 * 0.27 * 0.5,   // medium
            20, 4 * 0.42 * 0.5,    // large
            100, 5 * 0.42 * 0.5],
          6, ["interpolate", ["linear"], ["get", "count"],
            1, 3 * 0.14 * 0.5,
            5, 5 * 0.27 * 0.5,
            20, 8 * 0.42 * 0.5,
            100, 12 * 0.42 * 0.5],
          12, ["interpolate", ["linear"], ["get", "count"],
            1, 8,
            5, 14,
            20, 22,
            100, 30],
        ],
        "circle-opacity": 0.35,
        "circle-blur": 0.8,
      },
    });

    // Main dots layer — RG exact green: rgb(0, 255, 130) (#00FF82)
    map.addLayer({
      id: "cities-layer",
      type: "circle",
      source: "cities",
      paint: {
        "circle-color": "rgb(0, 255, 130)",
        "circle-radius": [
          "interpolate", ["linear"], ["zoom"],
          0, ["interpolate", ["linear"], ["get", "count"],
            1, 0.8,     // smallPlaceScale * globalScale ≈ small dot
            5, 1.2,     // mediumPlaceScale * globalScale
            20, 1.8,    // largePlaceScale * globalScale
            100, 2.5],
          4, ["interpolate", ["linear"], ["get", "count"],
            1, 1.5,
            5, 2.5,
            20, 4,
            100, 6],
          8, ["interpolate", ["linear"], ["get", "count"],
            1, 3,
            5, 5,
            20, 8,
            100, 12],
          14, ["interpolate", ["linear"], ["get", "count"],
            1, 6,
            5, 10,
            20, 16,
            100, 24],
        ],
        "circle-opacity": 0.9,
      },
    });

    // Click handler
    map.on("click", "cities-layer", (e: any) => {
      if (e.features?.length > 0) {
        const p = e.features[0].properties;
        handleCityClickRef.current?.({
          city: p.city, countrycode: p.countrycode, country: p.country,
          lat: Number(p.lat), lng: Number(p.lng), count: Number(p.count),
        });
      }
    });

    // Hover cursor
    map.on("mouseenter", "cities-layer", () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", "cities-layer", () => { map.getCanvas().style.cursor = ""; });
  }, [cities, globeReady]);

  // Pulsing ring marker for selected city
  useEffect(() => {
    if (pulsingMarkerRef.current) {
      pulsingMarkerRef.current.remove();
      pulsingMarkerRef.current = null;
    }
    const map = mapRef.current;
    if (!selectedCity || !map) return;

    import("maplibre-gl").then((maplibregl) => {
      const el = document.createElement("div");
      el.className = "globe-pulse-ring";
      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([selectedCity.lng, selectedCity.lat])
        .addTo(map);
      pulsingMarkerRef.current = marker;
    });
  }, [selectedCity]);

  /* ── Actions ─────────────────────────────────────── */

  const handleCityClick = useCallback(
    async (point: object) => {
      const city = point as CityPoint;
      if (selectedCity) setPreviousCity(selectedCity);
      setSelectedCity(city);
      setShowAllStations(false);
      setActiveTab("explore");
      setLoading(true);

      mapRef.current?.flyTo({
        center: [city.lng, city.lat],
        zoom: 10,
        duration: 1000,
        padding: { left: 340, top: 0, right: 0, bottom: 0 },
      });

      try {
        const res = await fetch(
          `/api/map/stations?city=${encodeURIComponent(city.city)}&cc=${city.countrycode}&lat=${city.lat}&lng=${city.lng}`,
        );
        const data = await res.json();
        const list: Station[] = data.stations || [];
        setStations(list);
        if (!stationLocked) setPlaylist(list);
      } catch {
        setStations([]);
      }
      setLoading(false);
    },
    [setPlaylist],
  );

  // Keep ref in sync for map event handlers
  useEffect(() => {
    handleCityClickRef.current = handleCityClick;
  }, [handleCityClick]);

  const flyToAndSelect = useCallback(
    (lat: number, lng: number) => {
      mapRef.current?.flyTo({
        center: [lng, lat],
        zoom: 9,
        duration: 1500,
        padding: { left: 340, top: 0, right: 0, bottom: 0 },
      });
      const list = citiesRef.current;
      if (list.length > 0) {
        const nearest = findNearestCity(lat, lng, list);
        if (nearest) setTimeout(() => handleCityClick(nearest), 1600);
      }
    },
    [handleCityClick],
  );

  useEffect(() => {
    if (!globeReady || cities.length === 0 || geoTriggered.current) return;
    geoTriggered.current = true;
    fetch("/api/geolocation")
      .then((r) => r.json())
      .then((data: { lat: number; lng: number }) => {
        flyToAndSelect(data.lat, data.lng);
      })
      .catch(() => flyToAndSelect(55.75, 37.62));
  }, [globeReady, cities, flyToAndSelect]);

  const handleLocateMe = useCallback(() => {
    fetch("/api/geolocation")
      .then((r) => r.json())
      .then((data: { lat: number; lng: number }) => {
        flyToAndSelect(data.lat, data.lng);
      })
      .catch(() => {});
  }, [flyToAndSelect]);

  const handleZoom = useCallback((dir: "in" | "out") => {
    const map = mapRef.current;
    if (!map) return;
    if (dir === "in") map.zoomIn({ duration: 400 });
    else map.zoomOut({ duration: 400 });
  }, []);

  /* Balloon Ride: fly to random city, play random station */
  const handleBalloonRide = useCallback(async () => {
    const list = citiesRef.current;
    if (list.length === 0) return;
    const randomCity = list[Math.floor(Math.random() * list.length)];
    setStationLocked(false);
    handleCityClick(randomCity);
    // After city loads, pick and play a random station
    try {
      const res = await fetch(
        `/api/map/stations?city=${encodeURIComponent(randomCity.city)}&cc=${randomCity.countrycode}&lat=${randomCity.lat}&lng=${randomCity.lng}`,
      );
      const data = await res.json();
      const stations: Station[] = data.stations || [];
      if (stations.length > 0) {
        const randomStation = stations[Math.floor(Math.random() * stations.length)];
        setPlaylist(stations);
        play(randomStation);
      }
    } catch {}
  }, [handleCityClick, play, setPlaylist]);

  /* Lock Station: keep playing current station while browsing globe */
  const handleLockStation = useCallback(() => {
    setStationLocked(prev => !prev);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      setSearchResults(data.stations || []);
    } catch {
      setSearchResults([]);
    }
    setSearchLoading(false);
  }, [searchQuery]);

  // Auto-search on typing (debounced)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => { handleSearch(); }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  // Shift globe center when panel is open/collapsed
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // 325 panel + 15 margin = 340px offset
    const leftPad = panelCollapsed ? 0 : 340;
    map.easeTo({ padding: { left: leftPad, top: 0, right: 0, bottom: 0 }, duration: 1000 });
  }, [panelCollapsed, globeReady]);

  const goBack = useCallback(() => {
    if (previousCity) {
      handleCityClick(previousCity);
      setPreviousCity(null);
    }
  }, [previousCity, handleCityClick]);

  const goToCountry = useCallback((code: string) => {
    setBrowseCountry(code);
    setActiveTab("browse");
  }, []);

  const playFromList = useCallback(
    (station: Station, list: Station[]) => {
      setPlaylist(list);
      play(station);
    },
    [play, setPlaylist],
  );

  /* ── Render ──────────────────────────────────────── */

  return (
    <div ref={containerRef} className="rg-root">
      {/* MapLibre GL container */}
      <div ref={mapContainerRef} className="rg-map" />

      {/* Crosshair — offset to account for left panel */}
      <div className="rg-crosshair" style={{ paddingLeft: panelCollapsed ? 0 : 'var(--rg-ui-total-width)' }}>
        <div className={`rg-crosshair-icon ${loading ? 'loading' : isPlaying ? 'playing' : 'idle'}`}>
          <svg focusable="false" viewBox="0 0 58 58" overflow="visible">
            <circle r="28" cx="50%" cy="50%" />
          </svg>
        </div>
      </div>

      {/* Loading overlay */}
      {!globeReady && (
        <div className="rg-loading">
          <div style={{ textAlign: 'center' }}>
            <div className="rg-spinner" />
            <p style={{ marginTop: 16, fontSize: 'var(--rg-type-5)', color: 'var(--rg-fg-2)' }}>Loading...</p>
          </div>
        </div>
      )}

      {/* ── Left Panel (wideUIContainer) ── */}
      <div className="rg-wide-ui">

        {/* Browser Container (header + content) */}
        <div className={`rg-browser ${panelCollapsed ? 'collapsed' : ''}`}>
          <article className="rg-page">

            {/* Header */}
            <header className="rg-header" style={{
              minHeight: panelCollapsed
                ? (selectedCity ? 'var(--rg-header-height-collapsed)' : 'var(--rg-header-topbar-height)')
                : (selectedCity ? 'var(--rg-header-height)' : 'var(--rg-header-topbar-height)'),
            }}>
              {/* Drag handle — always visible, absolutely centered */}
              <div className="rg-drag-handle-wrap">
                <button onClick={() => setPanelCollapsed(v => !v)} className="rg-drag-handle">
                  <div className="rg-handle-bar" />
                </button>
              </div>

              {/* Top bar — hidden when collapsed */}
              {!panelCollapsed && (
              <div className="rg-topbar">
                {/* Back button */}
                {previousCity ? (
                  <button onClick={goBack} className="rg-back-btn">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 32 32">
                      <polyline points="19 24 11 16 19 8" />
                    </svg>
                    <span>Back</span>
                  </button>
                ) : (
                  <div style={{ flex: 1 }} />
                )}

                {/* Share + Heart — RG pill style */}
                <div className="rg-topbar-actions">
                  <button className="rg-action-pill" title="Share">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 32 32">
                      <path d="M15.97 16.615V5m-5.267 4.459L15.97 5l5.33 4.459m-1.774 3.173H23.5V26h-15V12.632h3.933" />
                    </svg>
                  </button>
                  <button
                    onClick={() => currentStation && toggle(currentStation)}
                    className="rg-action-pill"
                    title="Favorite"
                    style={{ color: currentStation && isFavorite(currentStation.stationuuid) ? 'var(--rg-error)' : undefined }}
                  >
                    <svg width="16" height="16" fill={currentStation && isFavorite(currentStation.stationuuid) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.4" viewBox="0 0 32 32">
                      <path d="M11.198 9C8.85 9 7 10.89 7 13.29c0 3.128 1.92 5.82 9 11.71 7.08-5.89 9-8.582 9-11.71C25 10.89 23.15 9 20.802 9c-2.098 0-3.237 1.273-4.126 2.327l-.676.8-.676-.8C14.434 10.31 13.296 9 11.197 9h0z" />
                    </svg>
                  </button>
                </div>
              </div>
              )}

              {/* City banner */}
              {selectedCity && (
                <div className="rg-banner">
                  <div className="rg-count-badge">
                    <div className={`rg-count-circle ${selectedCity.count < 10 ? 'single-digit' : selectedCity.count < 100 ? 'double-digit' : 'triple-digit'}`}>{selectedCity.count}</div>
                  </div>
                  <div className="rg-city-info">
                    <h2 className="rg-city-name">{selectedCity.city}</h2>
                    <div className="rg-city-meta">
                      <span className="rg-city-country">{selectedCity.country.replace(/^The\s+/i, '')}</span>
                      <span className="rg-city-time">{getLocalTime(selectedCity.lng)}</span>
                    </div>
                  </div>
                </div>
              )}
            </header>

            {/* Content */}
            {!panelCollapsed && (
            <div className="rg-content">

              {/* ─── EXPLORE ─── */}
              {activeTab === "explore" && (
                <>
                  {loading ? (
                    <div className="rg-content-center"><div className="rg-spinner-sm" /></div>
                  ) : selectedCity && stations.length > 0 ? (
                    <>
                      {/* Stations (no header) */}
                      <div className="rg-section">
                        {(showAllStations ? stations : stations.slice(0, 6)).map(s => (
                          <StationRow key={s.stationuuid} station={s} onPlay={() => playFromList(s, stations)} />
                        ))}
                        {!showAllStations && stations.length > 6 && (
                          <button onClick={() => setShowAllStations(true)} className="rg-view-all">
                            <span>View all {stations.length} stations</span>
                            <Chevron />
                          </button>
                        )}
                      </div>

                      {/* Popular in City */}
                      {popularStations.length > 0 && (
                        <div className="rg-section">
                          <div className="rg-section-title">
                            <h3>Popular in {selectedCity.city}</h3>
                          </div>
                          {popularStations.map(s => (
                            <StationRow key={`pop-${s.stationuuid}`} station={s} subtitle={selectedCity.city} onPlay={() => playFromList(s, stations)} />
                          ))}
                        </div>
                      )}

                      {/* Go to Country */}
                      <div className="rg-section">
                        <button onClick={() => goToCountry(selectedCity.countrycode)} className="rg-view-all">
                          <span>Go to {selectedCity.country.replace(/^The\s+/i, '')}</span>
                          <Chevron />
                        </button>
                      </div>
                    </>
                  ) : selectedCity && !loading ? (
                    <p className="rg-empty-text">No stations</p>
                  ) : (
                    <div className="rg-onboarding">
                      <div className="rg-onboarding-icon">
                        <svg width="28" height="28" fill="currentColor" stroke="none" viewBox="0 0 32 32" style={{ color: 'var(--rg-fg-2)' }}>
                          <path fillRule="nonzero" d="M16 4.5c6.351 0 11.5 5.149 11.5 11.5S22.351 27.5 16 27.5 4.5 22.351 4.5 16 9.649 4.5 16 4.5Zm0 9a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" />
                        </svg>
                      </div>
                      <p>Spin the globe and click<br />on the green dots</p>
                    </div>
                  )}

                  {/* Nearby cities */}
                  {selectedCity && !loading && nearbyCities.length > 0 && (
                    <div className="rg-section">
                      <div className="rg-section-title">
                        <h3>Nearby {selectedCity.city}</h3>
                      </div>
                      {nearbyCities.map(c => (
                        <button
                          key={`nb-${c.lat}-${c.lng}-${c.countrycode}`}
                          onClick={() => handleCityClick(c)}
                          className="rg-row-tall"
                        >
                          <span className="rg-row-label" style={{ flex: 1 }}>{c.city}</span>
                          <div className="rg-row-right">
                            <span className="rg-row-meta">{formatDistance(c.distance)}</span>
                            <Chevron />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Cities in country */}
                  {selectedCity && !loading && countryCities.length > 1 && (
                    <div className="rg-section">
                      <div className="rg-section-title">
                        <h3>Cities in {selectedCity.country.replace(/^The\s+/i, '')}</h3>
                      </div>
                      {countryCities.slice(0, 20).map(c => (
                        <button
                          key={`cc-${c.lat}-${c.lng}`}
                          onClick={() => handleCityClick(c)}
                          className="rg-row-tall"
                        >
                          <div className="rg-city-badge">{c.count}</div>
                          <span className="rg-row-label" style={{ flex: 1 }}>{c.city}</span>
                          <div className="rg-row-right">
                            <Chevron />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ─── FAVORITES ─── */}
              {activeTab === "favorites" && (
                <div>
                  <div className="rg-tab-header">
                    <h2 className="rg-tab-title">Favorites</h2>
                  </div>
                  <div>
                    {favorites.length === 0 ? (
                      <p className="rg-empty-text">Click ♡ to add a station</p>
                    ) : (
                      favorites.map(s => (
                        <StationRow key={s.stationuuid} station={s} onPlay={() => playFromList(s, favorites)} />
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ─── BROWSE ─── */}
              {activeTab === "browse" && (
                <div>
                  <div className="rg-tab-header">
                    {browseCountry ? (
                      <div>
                        <button onClick={() => setBrowseCountry(null)} className="rg-breadcrumb">
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 32 32">
                            <polyline points="19 24 11 16 19 8" />
                          </svg>
                          All countries
                        </button>
                        <h2 className="rg-tab-title">{countries.find(c => c.code === browseCountry)?.name ?? browseCountry}</h2>
                      </div>
                    ) : (
                      <h2 className="rg-tab-title">Browse</h2>
                    )}
                  </div>
                  <div className="rg-section">
                    {browseCountry
                      ? browseCities.map(c => (
                          <button key={`br-${c.lat}-${c.lng}`} onClick={() => handleCityClick(c)} className="rg-row-tall">
                            <div className="rg-city-badge">{c.count}</div>
                            <span className="rg-row-label" style={{ flex: 1 }}>{c.city}</span>
                            <div className="rg-row-right">
                              <Chevron />
                            </div>
                          </button>
                        ))
                      : countries.map(c => (
                          <button key={c.code} onClick={() => setBrowseCountry(c.code)} className="rg-row-tall">
                            <span className="rg-row-label" style={{ flex: 1 }}>{c.name}</span>
                            <div className="rg-row-right">
                              <span className="rg-row-meta">{c.count}</span>
                              <Chevron />
                            </div>
                          </button>
                        ))}
                  </div>
                </div>
              )}

              {/* ─── SEARCH ─── */}
              {activeTab === "search" && (
                <div>
                  <div className="rg-tab-header">
                    <div className="rg-search-wrapper">
                      <svg className="rg-search-magnifier" width="16" height="16" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4">
                        <path d="M14.5 23a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zm5.382-2.5L27 27.618" />
                      </svg>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSearch()}
                        placeholder="Search stations..."
                        className="rg-search-input"
                      />
                      {searchQuery && (
                        <button onClick={() => { setSearchQuery(""); setSearchResults([]); }} className="rg-search-clear visible">
                          <svg width="14" height="14" fill="none" stroke="var(--rg-fg-2)" strokeWidth="1.4" viewBox="0 0 32 32">
                            <path d="M11,20.8060592 L20.8060592,11 M20.8060592,20.8060592 L11,11" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    {searchLoading ? (
                      <div className="rg-content-center"><div className="rg-spinner-sm" /></div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map(s => (
                        <StationRow key={s.stationuuid} station={s} onPlay={() => playFromList(s, searchResults)} />
                      ))
                    ) : searchQuery.trim() ? (
                      <p className="rg-empty-text">Nothing found</p>
                    ) : null}
                  </div>
                </div>
              )}

              {/* ─── SETTINGS ─── */}
              {activeTab === "settings" && (
                <div>
                  {settingsPage === null && (
                    <>
                      <div className="rg-tab-header">
                        <h2 className="rg-tab-title">Settings</h2>
                      </div>
                      <div style={{ padding: 'var(--rg-margin)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--rg-margin) * 0.7)', marginBottom: 'calc(var(--rg-margin) * 1.5)' }}>
                          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(var(--rg-primary-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="28" height="28" fill="currentColor" stroke="none" viewBox="0 0 32 32" style={{ color: 'var(--rg-primary)' }}>
                              <path fillRule="nonzero" d="M16 4.5c6.351 0 11.5 5.149 11.5 11.5S22.351 27.5 16 27.5 4.5 22.351 4.5 16 9.649 4.5 16 4.5Zm0 9a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" />
                            </svg>
                          </div>
                          <div>
                            <h3 style={{ fontSize: 'var(--rg-type-2)', lineHeight: 'var(--rg-line-height-tight)' }}>RadioZal</h3>
                            <p style={{ fontSize: 'var(--rg-type-6)', color: 'var(--rg-fg-2)' }}>Internet radio from around the world</p>
                          </div>
                        </div>
                        <h4 style={{ fontSize: 'var(--rg-type-5)', marginBottom: 8, color: 'var(--rg-fg-2)' }}>Information</h4>
                        <div style={{ marginBottom: 'calc(var(--rg-margin) * 1.5)' }}>
                          {([
                            { label: "About", page: "about" as SettingsPage },
                            { label: "Contact", page: "contact" as SettingsPage },
                            { label: "Privacy", page: "privacy" as SettingsPage },
                          ]).map(item => (
                            <button key={item.label} onClick={() => setSettingsPage(item.page)} className="rg-row-tall" style={{ justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 'var(--rg-type-5)' }}>{item.label}</span>
                              <Chevron />
                            </button>
                          ))}
                        </div>
                        <h4 style={{ fontSize: 'var(--rg-type-5)', marginBottom: 8, color: 'var(--rg-fg-2)' }}>Statistics</h4>
                        <div style={{ borderRadius: 'var(--rg-corner-radius)', padding: 'calc(var(--rg-margin) * 0.7)', fontSize: 'var(--rg-type-5)', background: 'var(--rg-bg-3)', marginBottom: 'calc(var(--rg-margin) * 1.5)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ color: 'var(--rg-fg-2)' }}>Cities</span>
                            <span>{cities.length.toLocaleString("en-US")}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--rg-fg-2)' }}>Countries</span>
                            <span>{countries.length}</span>
                          </div>
                        </div>
                        <p style={{ fontSize: 'var(--rg-type-7)', textAlign: 'center', color: 'var(--rg-fg-2)' }}>© {new Date().getFullYear()} RadioZal. All rights reserved.</p>
                      </div>
                    </>
                  )}
                  {settingsPage === "about" && (
                    <>
                      <div className="rg-tab-header">
                        <button onClick={() => setSettingsPage(null)} className="rg-breadcrumb">
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 32 32"><polyline points="19 24 11 16 19 8" /></svg>
                          Settings
                        </button>
                        <h2 className="rg-tab-title">About</h2>
                      </div>
                      <div style={{ padding: 'var(--rg-margin)', fontSize: 'var(--rg-type-5)', lineHeight: 1.6, color: 'var(--rg-fg-2)' }}>
                        <p style={{ marginBottom: 'calc(var(--rg-margin) * 0.7)' }}><strong style={{ color: 'var(--rg-fg)' }}>RadioZal</strong> is a free online service providing access to thousands of radio stations from around the world.</p>
                        <p style={{ marginBottom: 'calc(var(--rg-margin) * 0.7)' }}>Music, news, sports, podcasts - all in one place, without ads or registration.</p>
                        <p>Station data provided by open API <a href="https://www.radio-browser.info/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rg-primary)' }}>Radio Browser</a>.</p>
                      </div>
                    </>
                  )}
                  {settingsPage === "contact" && (
                    <>
                      <div className="rg-tab-header">
                        <button onClick={() => setSettingsPage(null)} className="rg-breadcrumb">
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 32 32"><polyline points="19 24 11 16 19 8" /></svg>
                          Settings
                        </button>
                        <h2 className="rg-tab-title">Contact</h2>
                      </div>
                      <div style={{ padding: 'var(--rg-margin)', fontSize: 'var(--rg-type-5)', lineHeight: 1.6, color: 'var(--rg-fg-2)' }}>
                        <p style={{ marginBottom: 'calc(var(--rg-margin) * 0.7)' }}>We value your feedback. If you have suggestions, comments, or questions, please contact us.</p>
                        <p>Email: <a href="mailto:info@radiozal.ru" style={{ color: 'var(--rg-primary)' }}>info@radiozal.ru</a></p>
                      </div>
                    </>
                  )}
                  {settingsPage === "privacy" && (
                    <>
                      <div className="rg-tab-header">
                        <button onClick={() => setSettingsPage(null)} className="rg-breadcrumb">
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 32 32"><polyline points="19 24 11 16 19 8" /></svg>
                          Settings
                        </button>
                        <h2 className="rg-tab-title">Privacy</h2>
                      </div>
                      <div style={{ padding: 'var(--rg-margin)', fontSize: 'var(--rg-type-5)', lineHeight: 1.6, color: 'var(--rg-fg-2)' }}>
                        <p style={{ marginBottom: 'calc(var(--rg-margin) * 0.7)' }}>RadioZal does not collect personal user data.</p>
                        <p style={{ marginBottom: 'calc(var(--rg-margin) * 0.7)' }}>The service uses IP-based geolocation solely to display nearby radio stations. This data is not stored or shared with third parties.</p>
                        <p>Favorites and listening history are stored only in your browser (localStorage) and are not sent to the server.</p>
                      </div>
                    </>
                  )}
                </div>
              )}

            </div>
            )}

          </article>
        </div>
        {/* end browserContainer */}

        {/* Tab bar — OUTSIDE browserContainer, always visible */}
        <nav className="rg-tabbar">
          <TabBtn active={activeTab === "explore"} onClick={() => setActiveTab("explore")} label="Explore"
            icon={<svg width="22" height="22" fill="currentColor" stroke="none" viewBox="0 0 32 32"><path fillRule="nonzero" d="M16 4.5c6.351 0 11.5 5.149 11.5 11.5S22.351 27.5 16 27.5 4.5 22.351 4.5 16 9.649 4.5 16 4.5Zm0 9a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" /></svg>}
          />
          <TabBtn active={activeTab === "favorites"} onClick={() => setActiveTab("favorites")} label="Favorites"
            icon={<svg width="22" height="22" fill={activeTab === "favorites" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.4" viewBox="0 0 32 32"><path d="M11.198 9C8.85 9 7 10.89 7 13.29c0 3.128 1.92 5.82 9 11.71 7.08-5.89 9-8.582 9-11.71C25 10.89 23.15 9 20.802 9c-2.098 0-3.237 1.273-4.126 2.327l-.676.8-.676-.8C14.434 10.31 13.296 9 11.197 9h0z" /></svg>}
          />
          <TabBtn active={activeTab === "browse"} onClick={() => setActiveTab("browse")} label="Browse"
            icon={<svg width="22" height="22" fill="currentColor" stroke="none" viewBox="0 0 32 32"><path fillRule="nonzero" d="M21 21.2c0 .8-.7 1.5-1.5 1.5S18 22 18 21.2s.7-1.5 1.5-1.5 1.5.7 1.5 1.5M14 21.2c0 .8-.7 1.5-1.5 1.5S11 22 11 21.2s.7-1.5 1.5-1.5 1.5.7 1.5 1.5M23.3 14.4c0 .8-.7 1.5-1.5 1.5s-1.5-.7-1.5-1.5.7-1.5 1.5-1.5 1.5.7 1.5 1.5M11.7 14.4c0 .8-.7 1.5-1.5 1.5s-1.5-.7-1.5-1.5.7-1.5 1.5-1.5 1.5.7 1.5 1.5M17.5 10.3c0 .8-.7 1.5-1.5 1.5s-1.5-.7-1.5-1.5.7-1.5 1.5-1.5 1.5.6 1.5 1.5M17.5 16.1c0 .8-.7 1.5-1.5 1.5s-1.5-.6-1.5-1.5.7-1.5 1.5-1.5 1.5.7 1.5 1.5" /><path d="M16 4.5C9.6 4.5 4.5 9.6 4.5 16S9.6 27.5 16 27.5 27.5 22.4 27.5 16 22.4 4.5 16 4.5M16 6c5.5 0 10 4.5 10 10s-4.5 10-10 10S6 21.5 6 16 10.5 6 16 6" /></svg>}
          />
          <TabBtn active={activeTab === "search"} onClick={() => setActiveTab("search")} label="Search"
            icon={<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 32 32"><path d="M14.5 23a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zm5.382-2.5L27 27.618" /></svg>}
          />
          <TabBtn active={activeTab === "settings"} onClick={() => { setActiveTab("settings"); setSettingsPage(null); }} label="Settings"
            icon={<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 32 32"><path d="M6.556 19.618H26m-19.444-7H26" /></svg>}
          />
        </nav>

        {/* Playbar — always visible */}
        <div className="rg-playbar">
          {/* Row 1: Station title + Favorite */}
          <div className="rg-playbar-row">
            <div className="rg-playbar-title">
              {currentStation ? (
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '1.25rem', color: 'var(--rg-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentStation.name}
                  </p>
                  {nowPlaying ? (
                    <p style={{ fontSize: '0.75rem', color: 'var(--rg-fg-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: -2 }}>{nowPlaying}</p>
                  ) : (
                    <p style={{ fontSize: '0.75rem', color: 'var(--rg-fg-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: -2 }}>
                      {currentStation.city ? `${currentStation.city}, ` : ""}{currentStation.country.replace(/^The\s+/i, '')}
                    </p>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: '1.25rem', color: 'var(--rg-fg-3)' }}>Выберите станцию</p>
              )}
            </div>
            <button
              onClick={() => currentStation && toggle(currentStation)}
              className="rg-playbar-fav"
              style={{
                color: currentStation && isFavorite(currentStation.stationuuid) ? 'var(--rg-error)' : 'var(--rg-fg)',
                opacity: currentStation ? 1 : 0.4,
              }}
            >
              <svg width="18" height="18" fill={currentStation && isFavorite(currentStation.stationuuid) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.4" viewBox="0 0 32 32">
                <path d="M11.198 9C8.85 9 7 10.89 7 13.29c0 3.128 1.92 5.82 9 11.71 7.08-5.89 9-8.582 9-11.71C25 10.89 23.15 9 20.802 9c-2.098 0-3.237 1.273-4.126 2.327l-.676.8-.676-.8C14.434 10.31 13.296 9 11.197 9h0z" />
              </svg>
            </button>
          </div>

          {/* Row 2: Controls + Volume + More */}
          <div className="rg-playbar-row">
            <div className="rg-playbar-controls">
              <button onClick={prev} className="rg-playbar-ctrl">
                <svg width="50" height="50" viewBox="0 0 50 50" fill="currentColor"><path d="M37.66 18.718v12.56a1.003 1.003 0 0 1-1.5.87l-10.52-6.02v5.08c0 .55-.45 1-1 1H24c-.55 0-1-.45-1-1v-12.38c0-.55.45-1 1-1h.64c.55 0 1 .45 1 1v5.04l10.52-6.01c.48-.28 1.09-.11 1.37.37.08.15.13.32.13.49" /></svg>
              </button>
              <button onClick={currentStation ? (isPlaying ? pause : resume) : undefined} className="rg-playbar-ctrl">
                {isPlaying ? (
                  <svg width="50" height="50" viewBox="0 0 50 50" fill="currentColor"><rect width="18" height="18" x="16" y="16" rx="1" /></svg>
                ) : (
                  <svg width="50" height="50" viewBox="0 0 50 50" fill="currentColor"><path d="M35.6613092,25.8454889 L19.533993,36.0311623 C19.0670424,36.3260785 18.4494273,36.186617 18.1545111,35.7196664 C18.0535739,35.5598493 18,35.3746968 18,35.1856734 L18,14.8143266 C18,14.2620418 18.4477153,13.8143266 19,13.8143266 C19.1890234,13.8143266 19.3741758,13.8679005 19.533993,13.9688377 L35.6613092,24.1545111 C36.1282599,24.4494273 36.2677213,25.0670424 35.9728051,25.533993 C35.8934185,25.6596886 35.7870048,25.7661022 35.6613092,25.8454889 Z" /></svg>
                )}
              </button>
              <button onClick={next} className="rg-playbar-ctrl">
                <svg width="50" height="50" viewBox="0 0 50 50" fill="currentColor"><path d="M27.66 18.79v12.38c0 .55-.45 1-1 1h-.64c-.55 0-1-.45-1-1v-5.04L14.5 32.15c-.48.27-1.09.1-1.37-.38-.08-.15-.13-.32-.13-.49V18.72c0-.55.45-1 1-1 .17 0 .35.05.5.14l10.52 6.01v-5.08c0-.55.45-1 1-1h.64c.55 0 1 .45 1 1" /></svg>
              </button>
            </div>
            <div className="rg-playbar-volume">
              <svg className="rg-volume-icon-down" width="16" height="16" viewBox="0 0 32 32" fill="currentColor">
                <polygon points="28 8 21.714 12.645 17 12.645 17 19.355 21.189 19.355 28 24" />
              </svg>
              <div className="rg-volume-track">
                <div className="rg-volume-track-bg" />
                <div className="rg-volume-track-active" style={{ width: `${volume * 100}%` }} />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={e => setVolume(Number(e.target.value))}
                  className="rg-volume-slider"
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 3 }}
                />
              </div>
              <svg className="rg-volume-icon-up" width="16" height="16" viewBox="0 0 32 32" fill="currentColor">
                <path d="M24.3923492,5.30137405 C24.1785189,5.02237829 23.7037764,4.8898803 23.4345267,5.11137694 C23.1657675,5.33237358 23.0205983,5.82336613 23.2339382,6.10236189 C25.4178519,8.94981864 26.5723394,12.3807665 26.5723394,16.0242112 C26.5723394,19.6681558 25.4178519,23.0991037 23.2339382,25.9465605 C23.0205983,26.2255562 23.1657675,26.7165488 23.4345267,26.9375454 C23.5492889,27.031544 23.768514,26.9915446 23.9038744,26.9915446 C24.0872977,26.9915446 24.2697401,26.9080459 24.3923492,26.7475483 C26.7523296,23.669595 28,19.9616514 28,16.0242112 C28,12.087271 26.7523296,8.3793273 24.3923492,5.30137405 M20.9700834,8.2738289 C20.7567435,7.99933307 20.3065228,7.9053345 20.0421775,8.12883111 C19.7793036,8.35182772 19.5757724,8.80632081 19.7891123,9.08031665 C21.3065228,11.031287 22.1417361,13.4922496 22.1417361,16.0087114 C22.1417361,18.5256732 21.3065228,20.9861358 19.7891123,22.9371062 C19.5757724,23.211102 19.7631192,23.6655951 20.0259931,23.8885917 C20.1397744,23.9850903 20.3580186,23.9800903 20.4933791,23.9800903 C20.6723882,23.9800903 20.8543401,23.8975916 20.9700834,23.7390938 C22.6635606,21.565127 23.5963708,18.8186687 23.5963708,16.0087114 C23.5963708,13.1992541 22.6635606,10.4522958 20.9700834,8.2738289 M16.4914174,11.1272856 C16.223639,11.3512822 16.0225601,11.7457762 16.250613,12.0082722 C17.2182442,13.1232552 17.7508583,14.5437337 17.7508583,16.0082114 C17.7508583,17.4731892 17.2182442,18.8936676 16.250613,20.0081507 C16.0225601,20.2706467 16.223639,20.6656407 16.4914174,20.8891373 C16.6110839,20.9896358 16.7582148,21.039135 16.903384,21.039135 C17.0833742,21.039135 17.2618931,20.9641361 17.3879353,20.8196383 C18.5512506,19.4791587 19.1922511,17.7701847 19.1922511,16.0082114 C19.1922511,14.2462382 18.5512506,12.5377641 17.3879353,11.1972845 C17.1603727,10.9347885 16.7587052,10.902289 16.4914174,11.1272856 M12.8916135,8.68382268 L7.23001471,13.0122569 L3,13.0122569 L3,19.5121582 L7.03138794,19.5121582 L12.8916135,23.9930901 C13.1074056,24.1580876 13.2839627,24.068089 13.2839627,23.7930932 L13.2839627,8.88381964 C13.2839627,8.60882381 13.1074056,8.51882518 12.8916135,8.68382268\" />
              </svg>
            </div>
            <button onClick={() => setShowMoreMenu(true)} className="rg-playbar-more" title="More" style={{ opacity: currentStation ? 1 : 0.4 }}>
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 32 32">
                <circle cx="22.5" cy="16.5" r="1.5" /><circle cx="16.5" cy="16.5" r="1.5" /><circle cx="10.5" cy="16.5" r="1.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* end wideUIContainer */}

      {/* ── More Menu Modal ── */}
      {showMoreMenu && (
        <div className="rg-modal-overlay" onClick={() => setShowMoreMenu(false)}>
          <div className="rg-modal-backdrop" />
          <div className="rg-modal" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowMoreMenu(false)}
              style={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'var(--rg-bg-3)', color: 'var(--rg-fg-2)', cursor: 'pointer' }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 32 32"><path d="M11,20.8060592 L20.8060592,11 M20.8060592,20.8060592 L11,11" /></svg>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--rg-margin) var(--rg-margin) calc(var(--rg-margin) * 0.8)' }}>
              <p style={{ fontSize: 15, color: 'var(--rg-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, paddingRight: 32 }}>
                {currentStation?.name || "No station selected"}
              </p>
              {currentStation && (
                <button onClick={() => toggle(currentStation)} style={{ flexShrink: 0, color: isFavorite(currentStation.stationuuid) ? 'var(--rg-error)' : 'var(--rg-fg-3)', cursor: 'pointer' }}>
                  <svg width="20" height="20" fill={isFavorite(currentStation.stationuuid) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.4" viewBox="0 0 32 32">
                    <path d="M11.198 9C8.85 9 7 10.89 7 13.29c0 3.128 1.92 5.82 9 11.71 7.08-5.89 9-8.582 9-11.71C25 10.89 23.15 9 20.802 9c-2.098 0-3.237 1.273-4.126 2.327l-.676.8-.676-.8C14.434 10.31 13.296 9 11.197 9h0z" />
                  </svg>
                </button>
              )}
            </div>
            <div style={{ borderTop: '1px solid var(--rg-fg-4)' }}>
              <button
                onClick={() => { if (currentStation) navigator.clipboard?.writeText(currentStation.url_resolved || currentStation.url); setShowMoreMenu(false); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: 'var(--rg-margin)', fontSize: 'var(--rg-type-5)', color: 'var(--rg-fg)', borderBottom: '1px solid var(--rg-fg-4)', cursor: 'pointer' }}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 32 32" style={{ color: 'var(--rg-fg-2)', flexShrink: 0 }}>
                  <path d="M15.97 16.615V5m-5.267 4.459L15.97 5l5.33 4.459m-1.774 3.173H23.5V26h-15V12.632h3.933" />
                </svg>
                Share station
              </button>
              <button
                onClick={() => { if (currentStation?.url) window.open(currentStation.url, "_blank", "noopener,noreferrer"); setShowMoreMenu(false); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: 'var(--rg-margin)', fontSize: 'var(--rg-type-5)', color: 'var(--rg-fg)', cursor: 'pointer' }}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 32 32" style={{ color: 'var(--rg-fg-2)', flexShrink: 0 }}>
                  <path d="M16.485 15.487L24.987 7m-7.611 0h7.6L25 14.593m-2.694 2.401V24H8V9.675h6.967" />
                </svg>
                Station website
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HUD (right side, bottom-aligned) ── */}
      <div className="rg-hud">
        {/* Group 1: Signal / Location / Lock */}
        <div className="rg-hud-group">
          {/* 1. Balloon Ride (RG balloon/antenna icon - filled) */}
          <button onClick={handleBalloonRide} className="rg-hud-btn" title="Random station">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor" stroke="none">
              <path d="M17.41 17.71c-.49 1.32-1.02 2.73-1.4 4.46H16l-.09-.42c-.37-1.53-.86-2.82-1.31-4.02-1.36-3.61-2.34-6.22 1.35-12.94L16 4.7l.06.09c3.7 6.67 2.72 9.29 1.35 12.92" />
              <path d="M14.46 22.17h-.02c-2.87-4.44-6.34-5.44-6.34-10.34 0-3.76 2.5-6.42 6.15-7.05-3.55 6.82-2.44 9.78-1.05 13.48.44 1.17.91 2.42 1.26 3.91m9.44-10.34c0 4.9-3.33 5.8-6.34 10.34h-.01c.35-1.5.83-2.76 1.27-3.94 1.4-3.72 2.51-6.7-1.06-13.45 3.65.64 6.14 3.29 6.14 7.05m-5.92 11.85-.28 3.09c-.02.26-.24.46-.5.46h-2.43c-.26 0-.48-.2-.5-.46l-.25-3.09h3.96ZM16.01 22.18v.01l-.01-.01z" />
            </svg>
          </button>
          {/* 2. Location (geo-arrow-filled) */}
          <button onClick={handleLocateMe} className="rg-hud-btn" title="My location">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor" stroke="none">
              <path d="M25,6 L15.0325869,26 L13.522,17.477 L5,15.9674131 L25,6 Z" />
            </svg>
          </button>
          {/* 3. Lock Station */}
          <button onClick={handleLockStation} className={`rg-hud-btn ${stationLocked ? 'rg-hud-btn-active' : ''}`} title="Lock station">
            {stationLocked ? (
              <svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor">
                <path d="M16.034 6c2.497 0 4.596 2.045 4.711 4.536l.005.214v4H22a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1h1.25v-4c0-2.592 2.175-4.75 4.784-4.75zm0 1.5c-1.721 0-3.18 1.388-3.279 3.069l-.005.181v4h6.5v-4c0-1.76-1.479-3.25-3.216-3.25z" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor">
                <path d="M16.322 5c1.647 0 3.12.752 4.059 2.098l.136.207-1.27.798c-.65-1.034-1.706-1.603-2.925-1.603-1.79 0-3.457 1.452-3.566 3.08l-.006.17v5H22a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1h1.25v-5c0-2.56 2.424-4.75 5.072-4.75z" />
              </svg>
            )}
          </button>
        </div>
        {/* Group 2: Zoom */}
        <div className="rg-hud-group">
          {/* 4. Zoom in (plus-filled) */}
          <button onClick={() => handleZoom("in")} className="rg-hud-btn" title="Zoom in">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor" stroke="none">
              <path d="m17.25 8-.001 6.764 6.753.011-.004 2.5-6.749-.012L17.25 24h-2.5l-.001-6.74-6.751-.01.004-2.5 6.747.01L14.75 8z" />
            </svg>
          </button>
          {/* 5. Zoom out (minus-filled) */}
          <button onClick={() => handleZoom("out")} className="rg-hud-btn" title="Zoom out">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor" stroke="none">
              <polygon points="7.001 15.25 25.001 15.291 24.999 17.75 6.999 17.709" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Station Row ───────────────────────────────────── */

function StationRow({
  station,
  subtitle,
  onPlay,
}: {
  station: Station;
  subtitle?: string;
  onPlay: () => void;
}) {
  const { station: current, isPlaying, pause } = usePlayer();
  const { isFavorite, toggle } = useFavorites();
  const isActive = current?.stationuuid === station.stationuuid;
  const fav = isFavorite(station.stationuuid);

  return (
    <button
      onClick={() => (isActive && isPlaying ? pause() : onPlay())}
      className="rg-station-row"
    >
      {/* Equalizer when playing, otherwise no icon (like RG) */}
      {isActive && isPlaying && (
        <div className="rg-station-icon">
          <Equalizer />
        </div>
      )}
      <div className="rg-row-label" style={{ flex: 1, color: isActive ? 'var(--rg-primary)' : undefined, flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }}>
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{station.name}</span>
        {subtitle && (
          <span style={{ fontSize: 'var(--rg-type-6)', color: 'var(--rg-fg-2)', marginTop: -2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{subtitle}</span>
        )}
      </div>
      <div
        className={`rg-station-fav${fav ? ' active' : ''}`}
        onClick={(e) => { e.stopPropagation(); toggle(station); }}
      >
        <svg width="16" height="16" fill={fav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.4" viewBox="0 0 32 32">
          <path d="M11.198 9C8.85 9 7 10.89 7 13.29c0 3.128 1.92 5.82 9 11.71 7.08-5.89 9-8.582 9-11.71C25 10.89 23.15 9 20.802 9c-2.098 0-3.237 1.273-4.126 2.327l-.676.8-.676-.8C14.434 10.31 13.296 9 11.197 9h0z" />
        </svg>
      </div>
    </button>
  );
}

/* ── Tab Button ────────────────────────────────────── */

function TabBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="rg-tab-btn"
      style={{ color: active ? 'var(--rg-primary)' : 'var(--rg-fg)' }}
    >
      {icon}
      <span style={{ fontSize: 'var(--rg-type-7)' }}>{label}</span>
    </button>
  );
}
