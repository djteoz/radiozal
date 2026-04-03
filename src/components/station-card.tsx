"use client";

import { useState } from "react";
import type { Station } from "@/lib/api";
import { usePlayer } from "./player-context";
import { useFavorites } from "./favorites-context";
import { RadioIcon } from "./radio-icon";
import { Equalizer } from "./equalizer";

function StationIcon({ favicon }: { favicon: string }) {
  const [failed, setFailed] = useState(false);

  if (!favicon || failed) {
    return (
      <div className="w-12 h-12 rounded-lg bg-stone-100 flex items-center justify-center shrink-0 text-emerald-600">
        <RadioIcon className="w-6 h-6" />
      </div>
    );
  }

  return (
    <img
      src={favicon}
      alt=""
      className="w-12 h-12 rounded-lg object-cover bg-stone-100 shrink-0"
      onError={() => setFailed(true)}
    />
  );
}

export function StationCard({ station }: { station: Station }) {
  const { play, station: current, isPlaying, pause } = usePlayer();
  const { isFavorite, toggle } = useFavorites();
  const isActive = current?.stationuuid === station.stationuuid;
  const liked = isFavorite(station.stationuuid);

  const handleClick = () => {
    if (isActive && isPlaying) {
      pause();
    } else {
      play(station);
    }
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggle(station);
  };

  return (
    <button
      onClick={handleClick}
      className={`group relative flex items-center gap-3 p-3 rounded-xl transition-all w-full text-left ${
        isActive
          ? "bg-emerald-50 border border-emerald-500/30"
          : "bg-white border border-stone-200 hover:border-stone-300 hover:bg-stone-50"
      }`}
    >
      {/* Favicon */}
      <StationIcon favicon={station.favicon} />

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{station.name}</p>
        <p className="text-xs text-stone-400 truncate">
          {station.tags?.split(",").slice(0, 2).join(", ") || station.country}
        </p>
        {station.bitrate > 0 && (
          <p className="text-[10px] text-stone-400">{station.bitrate} kbps</p>
        )}
      </div>

      {/* Favorite */}
      <div
        onClick={handleFavorite}
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors hover:scale-110 ${
          liked ? "text-red-500" : "text-stone-300 hover:text-stone-500"
        }`}
      >
        <svg className="w-4 h-4" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </div>

      {/* Play indicator */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
          isActive && isPlaying
            ? "bg-emerald-500/20"
            : "bg-stone-200 group-hover:bg-stone-300"
        }`}
      >
        {isActive && isPlaying ? (
          <Equalizer />
        ) : (
          <svg className="w-3 h-3 text-stone-500 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        )}
      </div>
    </button>
  );
}
