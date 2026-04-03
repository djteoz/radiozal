"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { SearchBar } from "./search-bar";
import { RadioIcon } from "./radio-icon";

const NAV_LINKS = [
  { href: "/", label: "Топ" },
  { href: "/map", label: "🌍 Карта" },
  { href: "/countries", label: "Страны" },
  { href: "/genre/pop", label: "Жанры" },
  { href: "/favorites", label: "♥ Избранное" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  if (pathname === "/") return null;

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <RadioIcon className="w-6 h-6 text-emerald-600" />
          <span className="text-lg font-bold text-emerald-600 hidden sm:inline">
            РадиоЗал
          </span>
        </Link>

        <SearchBar />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-4 shrink-0">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Burger button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden flex flex-col gap-1.5 p-2 shrink-0"
          aria-label="Меню"
        >
          <span
            className={`block w-5 h-0.5 bg-stone-500 transition-transform ${
              menuOpen ? "rotate-45 translate-y-2" : ""
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-stone-500 transition-opacity ${
              menuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-stone-500 transition-transform ${
              menuOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="md:hidden border-t border-stone-200 bg-white/95 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="py-2 px-3 text-sm text-stone-600 hover:text-emerald-600 hover:bg-stone-100 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
