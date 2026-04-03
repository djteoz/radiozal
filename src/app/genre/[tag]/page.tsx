import { getStationsByTag } from "@/lib/api";
import { StationGrid } from "@/components/station-grid";
import { JsonLd } from "@/components/json-ld";
import type { Metadata } from "next";

const TAG_LABELS: Record<string, string> = {
  pop: "Поп",
  rock: "Рок",
  jazz: "Джаз",
  classical: "Классика",
  electronic: "Электроника",
  "hip hop": "Хип-хоп",
  news: "Новости",
  sport: "Спорт",
  chill: "Чилл",
  metal: "Метал",
};

interface Props {
  params: Promise<{ tag: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const label = TAG_LABELS[decoded] || decoded;
  return {
    title: `${label} — Радиостанции онлайн`,
    description: `Слушайте лучшие ${label.toLowerCase()} радиостанции онлайн бесплатно.`,
    openGraph: {
      title: `${label} — Радиостанции онлайн | РадиоЗал`,
      description: `Лучшие ${label.toLowerCase()} радиостанции онлайн.`,
    },
  };
}

export default async function GenrePage({ params }: Props) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const label = TAG_LABELS[decoded] || decoded;
  const stations = await getStationsByTag(decoded, 50);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-28">
      <JsonLd
        type="breadcrumb"
        breadcrumbs={[
          { name: "Главная", url: "/" },
          { name: "Жанры", url: "/" },
          { name: label, url: `/genre/${encodeURIComponent(decoded)}` },
        ]}
      />
      <h1 className="text-2xl font-bold mb-6">
        Жанр: <span className="text-emerald-600">{label}</span>
      </h1>
      <StationGrid stations={stations} showSort />
    </div>
  );
}
