import { getStationsByCountry } from "@/lib/api";
import { StationGrid } from "@/components/station-grid";
import { JsonLd } from "@/components/json-ld";
import type { Metadata } from "next";

const COUNTRY_NAMES: Record<string, string> = {
  RU: "Россия",
  US: "США",
  GB: "Великобритания",
  DE: "Германия",
  FR: "Франция",
  UA: "Украина",
  BY: "Беларусь",
  KZ: "Казахстан",
  PL: "Польша",
  IT: "Италия",
  ES: "Испания",
  BR: "Бразилия",
  JP: "Япония",
  KR: "Южная Корея",
  CN: "Китай",
  IN: "Индия",
  TR: "Турция",
  CA: "Канада",
  AU: "Австралия",
  NL: "Нидерланды",
  SE: "Швеция",
  NO: "Норвегия",
  FI: "Финляндия",
  AT: "Австрия",
  CH: "Швейцария",
  CZ: "Чехия",
  PT: "Португалия",
  GR: "Греция",
  MX: "Мексика",
  AR: "Аргентина",
};

interface Props {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const name = COUNTRY_NAMES[code.toUpperCase()] || code;
  return {
    title: `${name} — Радиостанции онлайн`,
    description: `Слушайте радиостанции из страны ${name} онлайн бесплатно.`,
    openGraph: {
      title: `${name} — Радиостанции онлайн | РадиоЗал`,
      description: `Слушайте лучшие радиостанции из страны ${name}.`,
    },
  };
}

export default async function CountryPage({ params }: Props) {
  const { code } = await params;
  const name = COUNTRY_NAMES[code.toUpperCase()] || code;
  const stations = await getStationsByCountry(code.toUpperCase(), 50);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-28">
      <JsonLd
        type="breadcrumb"
        breadcrumbs={[
          { name: "Главная", url: "/" },
          { name: "Страны", url: "/countries" },
          { name, url: `/country/${code.toUpperCase()}` },
        ]}
      />
      <h1 className="text-2xl font-bold mb-6">
        Станции: <span className="text-emerald-600">{name}</span>
      </h1>
      <StationGrid stations={stations} showSort />
    </div>
  );
}
