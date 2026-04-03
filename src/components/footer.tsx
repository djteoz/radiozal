"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const FOOTER_COUNTRIES = [
  { code: "RU", label: "Россия" },
  { code: "US", label: "США" },
  { code: "GB", label: "Великобритания" },
  { code: "DE", label: "Германия" },
  { code: "FR", label: "Франция" },
  { code: "UA", label: "Украина" },
];

const FOOTER_GENRES = [
  { tag: "pop", label: "Поп" },
  { tag: "rock", label: "Рок" },
  { tag: "jazz", label: "Джаз" },
  { tag: "electronic", label: "Электроника" },
  { tag: "classical", label: "Классика" },
  { tag: "news", label: "Новости" },
];

export function Footer() {
  const pathname = usePathname();

  if (pathname === "/") return null;

  return (
    <footer className="bg-stone-50 border-t border-stone-200 pb-24">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <span className="text-2xl">📻</span>
              <span className="text-lg font-bold text-emerald-600">
                РадиоЗал
              </span>
            </Link>
            <p className="text-sm text-stone-400 leading-relaxed">
              Тысячи радиостанций со всего мира. Бесплатно и без регистрации.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-sm font-semibold text-stone-700 mb-3">
              Навигация
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-sm text-stone-400 hover:text-emerald-600 transition-colors"
                >
                  Главная
                </Link>
              </li>
              <li>
                <Link
                  href="/favorites"
                  className="text-sm text-stone-400 hover:text-emerald-600 transition-colors"
                >
                  Избранное
                </Link>
              </li>
              <li>
                <Link
                  href="/countries"
                  className="text-sm text-stone-400 hover:text-emerald-600 transition-colors"
                >
                  Страны
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-sm text-stone-400 hover:text-emerald-600 transition-colors"
                >
                  О сайте
                </Link>
              </li>
            </ul>
          </div>

          {/* Countries */}
          <div>
            <h3 className="text-sm font-semibold text-stone-700 mb-3">
              Страны
            </h3>
            <ul className="space-y-2">
              {FOOTER_COUNTRIES.map((c) => (
                <li key={c.code}>
                  <Link
                    href={`/country/${c.code}`}
                    className="text-sm text-stone-400 hover:text-emerald-600 transition-colors"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Genres */}
          <div>
            <h3 className="text-sm font-semibold text-stone-700 mb-3">
              Жанры
            </h3>
            <ul className="space-y-2">
              {FOOTER_GENRES.map((g) => (
                <li key={g.tag}>
                  <Link
                    href={`/genre/${encodeURIComponent(g.tag)}`}
                    className="text-sm text-stone-400 hover:text-emerald-600 transition-colors"
                  >
                    {g.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-stone-200 text-center text-xs text-stone-400">
          © {new Date().getFullYear()} РадиоЗал. Данные:{" "}
          <a
            href="https://www.radio-browser.info/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-stone-500 hover:text-emerald-600 transition-colors"
          >
            Radio Browser API
          </a>
        </div>
      </div>
    </footer>
  );
}
