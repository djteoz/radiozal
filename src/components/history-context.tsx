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

interface HistoryState {
  history: Station[];
  addToHistory: (station: Station) => void;
}

const HistoryContext = createContext<HistoryState | null>(null);

const STORAGE_KEY = "radiozal-history";
const MAX_HISTORY = 20;

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<Station[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
  }, [history, loaded]);

  const addToHistory = useCallback((station: Station) => {
    setHistory((prev) => {
      const without = prev.filter(
        (s) => s.stationuuid !== station.stationuuid
      );
      return [station, ...without].slice(0, MAX_HISTORY);
    });
  }, []);

  return (
    <HistoryContext.Provider value={{ history, addToHistory }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error("useHistory must be used within HistoryProvider");
  return ctx;
}
