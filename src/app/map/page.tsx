import type { Metadata } from "next";
import { RadioMap } from "@/components/radio-map";

export const metadata: Metadata = {
  title: "Карта радиостанций",
  description: "Интерактивная карта радиостанций мира. Выберите город и слушайте местные станции.",
};

export default function MapPage() {
  return (
    <div className="fixed inset-0 top-[57px] bottom-[80px]">
      <RadioMap />
    </div>
  );
}
