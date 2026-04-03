import { getPlacesByCountry, getCountriesWithPlaces } from "@/lib/rg-compat";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ countryId: string }> }
) {
  const { countryId } = await params;

  // Find the country info by browsing all countries
  const countries = getCountriesWithPlaces();
  const country = countries.find((c) => c.id === countryId);
  if (!country) {
    return Response.json({ error: "Country not found" }, { status: 404 });
  }

  const items = getPlacesByCountry(country.code);

  return Response.json({
    apiVersion: 0,
    version: "a1b2c3d",
    data: {
      type: "page",
      title: country.title,
      url: `/browse/${country.code.toLowerCase()}/${country.id}`,
      content: [
        {
          type: "list",
          title: `Cities in ${country.title}`,
          itemsType: "default",
          items,
        },
      ],
    },
  });
}
