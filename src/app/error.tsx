"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-20 pb-28 text-center">
      <span className="text-6xl block mb-6">⚠️</span>
      <h1 className="text-3xl font-bold mb-4">Что-то пошло не так</h1>
      <p className="text-stone-400 text-lg mb-8">
        Произошла ошибка при загрузке страницы. Попробуйте обновить.
      </p>
      <button
        onClick={reset}
        className="inline-flex px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-lg transition-colors shadow-sm"
      >
        Попробовать снова
      </button>
    </div>
  );
}
