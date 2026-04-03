"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Station } from "@/lib/api";
import { usePlayer } from "./player-context";
import { useFavorites } from "./favorites-context";
import { Equalizer } from "./equalizer";

interface CityMarker {
  city: string;
  countrycode: string;
  country: string;
  lat: number;
  lng: number;
  count: number;
}

export function RadioMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  const [cities, setCities] = useState<CityMarker[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityMarker | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  // Load cities
  useEffect(() => {
    fetch("/api/map")
      .then(r => r.json())
      .then(data => setCities(data))
      .catch(() => {});
  }, []);

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    let cancelled = false;

    import("leaflet").then(L => {
      if (cancelled || !mapRef.current) return;

      // Fix default icon paths
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "",
        iconUrl: "",
        shadowUrl: "",
      });

      const map = L.map(mapRef.current, {
        center: [55.75, 37.62], // Moscow
        zoom: 4,
        minZoom: 2,
        maxZoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      // Dark map tiles (CartoDB dark)
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 19 }
      ).addTo(map);

      // Labels layer on top
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 19, pane: "overlayPane" }
      ).addTo(map);

      // Zoom control bottom-right
      L.control.zoom({ position: "bottomright" }).addTo(map);

      mapInstance.current = map;
    });

    return () => { cancelled = true; };
  }, []);

  // Render city markers
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || cities.length === 0) return;

    import("leaflet").then(L => {
      // Clear old markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      for (const city of cities) {
        const radius = Math.max(3, Math.min(12, Math.log2(city.count + 1) * 2.5));

        const marker = L.circleMarker([city.lat, city.lng], {
          radius,
          color: "rgba(52, 211, 153, 0.8)",
          fillColor: "#34d399",
          fillOpacity: 0.6,
          weight: 1,
        }).addTo(map);

        marker.on("click", () => {
          handleCityClick(city);
          map.flyTo([city.lat, city.lng], Math.max(map.getZoom(), 8), {
            duration: 0.8,
          });
        });

        marker.on("mouseover", () => {
          marker.setStyle({ fillOpacity: 1, radius: radius + 2 });
          marker.bindTooltip(
            `<b>${city.city}</b><br>${city.count} станций`,
            { className: "map-tooltip", direction: "top" }
          ).openTooltip();
        });

        marker.on("mouseout", () => {
          marker.setStyle({ fillOpacity: 0.6, radius });
          marker.closeTooltip();
        });

        markersRef.current.push(marker);
      }
    });
  }, [cities]);

  const handleCityClick = useCallback(async (city: CityMarker) => {
    setSelectedCity(city);
    setPanelOpen(true);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/map/stations?city=${encodeURIComponent(city.city)}&cc=${city.countrycode}&lat=${city.lat}&lng=${city.lng}`
      );
      const data = await res.json();
      setStations(data.stations || []);
    } catch {
      setStations([]);
    }
    setLoading(false);
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <style>{`
        .map-tooltip {
          background: rgba(24, 24, 27, 0.95) !important;
          border: 1px solid rgb(63, 63, 70) !important;
          color: white !important;
          border-radius: 8px !important;
          padding: 6px 10px !important;
          font-size: 13px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
        }
        .map-tooltip .leaflet-tooltip-tip {
          border-top-color: rgba(24, 24, 27, 0.95) !important;
        }
        .leaflet-control-zoom a {
          background: rgba(24, 24, 27, 0.9) !important;
          color: white !important;
          border-color: rgb(63, 63, 70) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(39, 39, 42, 0.95) !important;
        }
      `}</style>

      {/* Map container */}
      <div ref={mapRef} className="absolute inset-0 z-0" />

      {/* City panel (slide from left like Radio Garden) */}
      <div
        className={`absolute top-0 left-0 h-full z-10 transition-transform duration-300 ease-out ${
          panelOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: "min(380px, 85vw)" }}
      >
        <div className="h-full bg-[#F0EDE5]/[0.97] backdrop-blur-md border-r border-stone-200 shadow-xl text-stone-900 flex flex-col">
          {/* Panel header */}
          {selectedCity && (
            <div className="p-4 border-b border-stone-200 flex items-center gap-3">
              <button
                onClick={() => setPanelOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center hover:bg-stone-300 transition-colors shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="min-w-0">
                <h2 className="text-lg font-bold truncate">{selectedCity.city}</h2>
                <p className="text-xs text-stone-500">
                  {selectedCity.country} · {stations.length} станций
                </p>
              </div>
            </div>
          )}

          {/* Station list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {stations.map(station => (
                  <CityStationItem key={station.stationuuid} station={station} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats overlay */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        {!panelOpen && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-stone-200 shadow-sm">
            <span className="text-sm text-stone-600">
              🌍 {cities.length} городов на карте
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function CityStationItem({ station }: { station: Station }) {
  const { play, station: current, isPlaying, pause } = usePlayer();
  const { isFavorite, toggle } = useFavorites();
  const isActive = current?.stationuuid === station.stationuuid;
  const liked = isFavorite(station.stationuuid);

  const handleClick = () => {
    if (isActive && isPlaying) pause();
    else play(station);
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
        isActive
          ? "bg-emerald-50 border border-emerald-500/30"
          : "hover:bg-stone-100 border border-transparent"
      }`}
    >
      {/* Play/eq indicator */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        isActive && isPlaying ? "bg-emerald-500/20" : "bg-stone-200"
      }`}>
        {isActive && isPlaying ? (
          <Equalizer />
        ) : (
          <svg className="w-3 h-3 text-stone-500 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        )}
      </div>

      {/* Name + info */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{station.name}</p>
        <p className="text-xs text-stone-400 truncate">
          {station.tags?.split(",").slice(0, 2).join(", ") || station.country}
        </p>
      </div>

      {/* Favorite */}
      <div
        onClick={(e) => { e.stopPropagation(); toggle(station); }}
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
          liked ? "text-red-500" : "text-stone-300 hover:text-stone-500"
        }`}
      >
        <svg className="w-3.5 h-3.5" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </div>
    </button>
  );
}
