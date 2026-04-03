"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { Station } from "@/lib/api";
import { useHistory } from "./history-context";

interface PlayerState {
  station: Station | null;
  isPlaying: boolean;
  volume: number;
  nowPlaying: string | null;
  playlist: Station[];
  play: (station: Station) => void;
  pause: () => void;
  resume: () => void;
  setVolume: (v: number) => void;
  setPlaylist: (stations: Station[]) => void;
  next: () => void;
  prev: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const PlayerContext = createContext<PlayerState | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [station, setStation] = useState<Station | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [nowPlaying, setNowPlaying] = useState<string | null>(null);
  const [playlist, setPlaylistState] = useState<Station[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playlistRef = useRef<Station[]>([]);
  const stationRef = useRef<Station | null>(null);
  const { addToHistory } = useHistory();

  // Keep refs in sync for stable next/prev callbacks
  useEffect(() => { playlistRef.current = playlist; }, [playlist]);
  useEffect(() => { stationRef.current = station; }, [station]);

  const play = useCallback(
    (s: Station) => {
      setStation(s);
      setIsPlaying(true);
      setNowPlaying(null);
      addToHistory(s);
      if (audioRef.current) {
        audioRef.current.src = s.url_resolved || s.url;
        audioRef.current.volume = volume;
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    },
    [volume, addToHistory]
  );

  const pause = useCallback(() => {
    setIsPlaying(false);
    audioRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    setIsPlaying(true);
    audioRef.current?.play().catch(() => setIsPlaying(false));
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const setPlaylist = useCallback((stations: Station[]) => {
    setPlaylistState(stations);
  }, []);

  const next = useCallback(() => {
    const list = playlistRef.current;
    const cur = stationRef.current;
    if (!list.length || !cur) return;
    const idx = list.findIndex((s) => s.stationuuid === cur.stationuuid);
    const nextIdx = (idx + 1) % list.length;
    play(list[nextIdx]);
  }, [play]);

  const prev = useCallback(() => {
    const list = playlistRef.current;
    const cur = stationRef.current;
    if (!list.length || !cur) return;
    const idx = list.findIndex((s) => s.stationuuid === cur.stationuuid);
    const prevIdx = (idx - 1 + list.length) % list.length;
    play(list[prevIdx]);
  }, [play]);

  // Poll ICY metadata every 15s while playing
  useEffect(() => {
    if (!station || !isPlaying) {
      return;
    }

    const streamUrl = station.url_resolved || station.url;
    let cancelled = false;

    const fetchMeta = async () => {
      try {
        const res = await fetch(
          `/api/now-playing?url=${encodeURIComponent(streamUrl)}`
        );
        if (cancelled) return;
        const data = await res.json();
        if (!cancelled && data.title) {
          setNowPlaying(data.title);
        }
      } catch {
        // ignore
      }
    };

    fetchMeta();
    const interval = setInterval(fetchMeta, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [station, isPlaying]);

  return (
    <PlayerContext.Provider
      value={{ station, isPlaying, volume, nowPlaying, playlist, play, pause, resume, setVolume, setPlaylist, next, prev, audioRef }}
    >
      <audio ref={audioRef} />
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
