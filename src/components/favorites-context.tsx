"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { Station } from "@/lib/api";

interface FavoritesState {
  favorites: Station[];
  isFavorite: (id: string) => boolean;
  toggle: (station: Station) => void;
}

const FavoritesContext = createContext<FavoritesState | null>(null);

const STORAGE_KEY = "radiozal-favorites";

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Station[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setFavorites(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    }
  }, [favorites, loaded]);

  const isFavorite = useCallback(
    (id: string) => favorites.some((s) => s.stationuuid === id),
    [favorites]
  );

  const toggle = useCallback((station: Station) => {
    setFavorites((prev) => {
      const exists = prev.some((s) => s.stationuuid === station.stationuuid);
      if (exists) return prev.filter((s) => s.stationuuid !== station.stationuuid);
      return [...prev, station];
    });
  }, []);

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggle }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
