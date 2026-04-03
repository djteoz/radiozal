import { getSearchLandingPage } from "@/lib/rg-compat";

export async function GET() {
  const data = getSearchLandingPage();
  return Response.json(data);
}
