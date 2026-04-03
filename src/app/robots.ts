import type { MetadataRoute } from "next";

const SITE_URL = process.env.SITE_URL || "https://radiozal.ru";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
