import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Страница не найдена",
};

export default function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-20 pb-28 text-center">
      <span className="text-6xl block mb-6">📻</span>
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-stone-400 text-lg mb-8">
        Страница не найдена. Возможно, она была перемещена или удалена.
      </p>
      <Link
        href="/"
        className="inline-flex px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-lg transition-colors shadow-sm"
      >
        На главную
      </Link>
    </div>
  );
}
