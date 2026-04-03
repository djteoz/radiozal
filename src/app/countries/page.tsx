import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Страны — Радиостанции по странам | RadioFM",
  description:
    "Выберите страну и слушайте местные радиостанции онлайн бесплатно.",
};

const COUNTRIES = [
  { code: "RU", label: "Россия", flag: "🇷🇺" },
  { code: "US", label: "США", flag: "🇺🇸" },
  { code: "GB", label: "Великобритания", flag: "🇬🇧" },
  { code: "DE", label: "Германия", flag: "🇩🇪" },
  { code: "FR", label: "Франция", flag: "🇫🇷" },
  { code: "BY", label: "Беларусь", flag: "🇧🇾" },
  { code: "KZ", label: "Казахстан", flag: "🇰🇿" },
  { code: "PL", label: "Польша", flag: "🇵🇱" },
  { code: "IT", label: "Италия", flag: "🇮🇹" },
  { code: "ES", label: "Испания", flag: "🇪🇸" },
  { code: "BR", label: "Бразилия", flag: "🇧🇷" },
  { code: "JP", label: "Япония", flag: "🇯🇵" },
  { code: "KR", label: "Южная Корея", flag: "🇰🇷" },
  { code: "CN", label: "Китай", flag: "🇨🇳" },
  { code: "IN", label: "Индия", flag: "🇮🇳" },
  { code: "TR", label: "Турция", flag: "🇹🇷" },
  { code: "CA", label: "Канада", flag: "🇨🇦" },
  { code: "AU", label: "Австралия", flag: "🇦🇺" },
  { code: "NL", label: "Нидерланды", flag: "🇳🇱" },
  { code: "SE", label: "Швеция", flag: "🇸🇪" },
  { code: "NO", label: "Норвегия", flag: "🇳🇴" },
  { code: "FI", label: "Финляндия", flag: "🇫🇮" },
  { code: "AT", label: "Австрия", flag: "🇦🇹" },
  { code: "CH", label: "Швейцария", flag: "🇨🇭" },
  { code: "CZ", label: "Чехия", flag: "🇨🇿" },
  { code: "PT", label: "Португалия", flag: "🇵🇹" },
  { code: "GR", label: "Греция", flag: "🇬🇷" },
  { code: "MX", label: "Мексика", flag: "🇲🇽" },
  { code: "AR", label: "Аргентина", flag: "🇦🇷" },
];

export default function CountriesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-28">
      <h1 className="text-2xl font-bold mb-6">
        🌍 Радиостанции по <span className="text-emerald-600">странам</span>
      </h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {COUNTRIES.map((c) => (
          <Link
            key={c.code}
            href={`/country/${c.code}`}
            className="flex items-center gap-3 p-4 rounded-xl bg-white border border-stone-200 hover:border-emerald-500/50 hover:bg-stone-50 transition-all group"
          >
            <span className="text-2xl">{c.flag}</span>
            <span className="text-sm font-medium group-hover:text-emerald-600 transition-colors">
              {c.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
