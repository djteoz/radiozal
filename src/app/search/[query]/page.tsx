import { searchStations } from "@/lib/api";
import { StationGrid } from "@/components/station-grid";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ query: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { query } = await params;
  const decoded = decodeURIComponent(query);
  return {
    title: `${decoded} — Поиск радиостанций`,
    description: `Результаты поиска по запросу "${decoded}". Слушайте онлайн бесплатно.`,
    openGraph: {
      title: `${decoded} — Поиск радиостанций | РадиоЗал`,
      description: `Результаты поиска: "${decoded}".`,
    },
  };
}

export default async function SearchPage({ params }: Props) {
  const { query } = await params;
  const decoded = decodeURIComponent(query);
  const stations = await searchStations(decoded);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-28">
      <h1 className="text-2xl font-bold mb-6">
        Поиск: <span className="text-emerald-600">{decoded}</span>
      </h1>
      <StationGrid stations={stations} showSort />
    </div>
  );
}
