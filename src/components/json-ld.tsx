const SITE_URL = process.env.SITE_URL || "https://radiozal.ru";

interface JsonLdProps {
  type: "website" | "breadcrumb";
  name?: string;
  description?: string;
  breadcrumbs?: { name: string; url: string }[];
}

export function JsonLd({ type, name, description, breadcrumbs }: JsonLdProps) {
  let data: Record<string, unknown>;

  if (type === "website") {
    data = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: name || "РадиоЗал",
      url: SITE_URL,
      description:
        description ||
        "Слушайте тысячи радиостанций онлайн бесплатно.",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/search/{search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    };
  } else {
    data = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: (breadcrumbs || []).map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
      })),
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
