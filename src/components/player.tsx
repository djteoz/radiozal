"use client";

import { usePathname } from "next/navigation";
import { usePlayer } from "./player-context";
import { RadioIcon } from "./radio-icon";

export function Player() {
  const pathname = usePathname();
  const { station, isPlaying, volume, nowPlaying, pause, resume, setVolume } = usePlayer();

  if (!station || pathname === "/") return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-stone-200 px-3 sm:px-4 py-2 sm:py-3 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-4">
        {/* Station info */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {station.favicon ? (
            <img
              src={station.favicon}
              alt=""
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover bg-stone-100 shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-stone-100 flex items-center justify-center shrink-0 text-emerald-600">
              <RadioIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-medium truncate">{station.name}</p>
            {nowPlaying ? (
              <p className="text-[10px] sm:text-xs text-emerald-600 truncate">
                ♪ {nowPlaying}
              </p>
            ) : (
              <p className="text-[10px] sm:text-xs text-stone-400 truncate">
                {station.tags?.split(",").slice(0, 3).join(", ") || station.country}
              </p>
            )}
          </div>
        </div>

        {/* Play/Pause */}
        <button
          onClick={isPlaying ? pause : resume}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center transition-colors shrink-0"
        >
          {isPlaying ? (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>

        {/* Volume */}
        <div className="hidden sm:flex items-center gap-2 w-32">
          <svg className="w-4 h-4 text-stone-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3z" />
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="rg-volume-slider"
            style={{ background: `linear-gradient(to right, #00c864 0%, #00c864 ${volume * 100}%, #7F7F7F ${volume * 100}%, #7F7F7F 100%)` }}
          />
        </div>
      </div>
    </div>
  );
}
