"use client";

import { useState, useMemo } from "react";
import type { Station } from "@/lib/api";
import { StationCard } from "./station-card";

type SortKey = "default" | "name" | "votes" | "bitrate";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "default", label: "По умолчанию" },
  { value: "votes", label: "По популярности" },
  { value: "name", label: "По алфавиту" },
  { value: "bitrate", label: "По качеству" },
];

function sortStations(stations: Station[], key: SortKey): Station[] {
  if (key === "default") return stations;
  return [...stations].sort((a, b) => {
    switch (key) {
      case "name":
        return a.name.localeCompare(b.name, "ru");
      case "votes":
        return b.votes - a.votes;
      case "bitrate":
        return b.bitrate - a.bitrate;
      default:
        return 0;
    }
  });
}

export function StationGrid({
  stations,
  showSort = false,
}: {
  stations: Station[];
  showSort?: boolean;
}) {
  const [sort, setSort] = useState<SortKey>("default");
  const sorted = useMemo(() => sortStations(stations, sort), [stations, sort]);

  if (stations.length === 0) {
    return (
      <div className="text-center py-16 text-stone-400">
        <p className="text-lg">Станции не найдены</p>
      </div>
    );
  }

  return (
    <div>
      {showSort && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-stone-400">Сортировка:</span>
          <div className="flex flex-wrap gap-1">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSort(opt.value)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  sort === opt.value
                    ? "border-emerald-500 text-emerald-600 bg-emerald-50"
                    : "border-stone-300 text-stone-500 hover:border-stone-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sorted.map((station) => (
          <StationCard key={station.stationuuid} station={station} />
        ))}
      </div>
    </div>
  );
}
