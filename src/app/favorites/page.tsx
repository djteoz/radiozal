"use client";

import { useFavorites } from "@/components/favorites-context";
import { StationGrid } from "@/components/station-grid";

export default function FavoritesPage() {
  const { favorites } = useFavorites();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-28">
      <h1 className="text-2xl font-bold mb-6">
        <span className="text-emerald-600">♥</span> Избранное
      </h1>
      {favorites.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <span className="text-5xl block mb-4">♥</span>
          <p className="text-lg mb-2">Пока пусто</p>
          <p className="text-sm">
            Нажмите на сердечко у станции, чтобы добавить её в избранное
          </p>
        </div>
      ) : (
        <StationGrid stations={favorites} />
      )}
    </div>
  );
}
