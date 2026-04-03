import type { MetadataRoute } from "next";

const SITE_URL = process.env.SITE_URL || "https://radiozal.ru";

const COUNTRIES = [
  "RU", "US", "GB", "DE", "FR", "UA", "BY", "KZ", "PL", "IT",
  "ES", "BR", "JP", "KR", "CN", "IN", "TR", "CA", "AU", "NL",
  "SE", "NO", "FI", "AT", "CH", "CZ", "PT", "GR", "MX", "AR",
];

const GENRES = [
  "pop", "rock", "jazz", "classical", "electronic",
  "hip hop", "news", "sport", "chill", "metal",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/countries`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/favorites`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.3 },
  ];

  const countryPages: MetadataRoute.Sitemap = COUNTRIES.map((code) => ({
    url: `${SITE_URL}/country/${code}`,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const genrePages: MetadataRoute.Sitemap = GENRES.map((tag) => ({
    url: `${SITE_URL}/genre/${encodeURIComponent(tag)}`,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [...staticPages, ...countryPages, ...genrePages];
}
