import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PlayerProvider } from "@/components/player-context";
import { FavoritesProvider } from "@/components/favorites-context";
import { HistoryProvider } from "@/components/history-context";
import { Player } from "@/components/player";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

import { JsonLd } from "@/components/json-ld";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const SITE_URL = process.env.SITE_URL || "https://radiozal.ru";

export const metadata: Metadata = {
  title: {
    default: "Радио Онлайн — Слушать радиостанции бесплатно",
    template: "%s | РадиоЗал",
  },
  description:
    "Слушайте тысячи радиостанций онлайн бесплатно. Музыка, новости, спорт — всё в одном месте.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "РадиоЗал",
    title: "Радио Онлайн — Слушать радиостанции бесплатно",
    description:
      "Слушайте тысячи радиостанций онлайн бесплатно.",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${inter.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://de1.api.radio-browser.info" />
        <link rel="dns-prefetch" href="https://de1.api.radio-browser.info" />
      </head>
      <body className="min-h-full flex flex-col bg-[#F0EDE5] text-stone-900">
        <JsonLd type="website" />
        <HistoryProvider>
        <FavoritesProvider>
          <PlayerProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <Player />
          </PlayerProvider>
        </FavoritesProvider>
        </HistoryProvider>
      </body>
    </html>
  );
}
