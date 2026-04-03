import { getBrowsePage } from "@/lib/rg-compat";

export async function GET() {
  const data = getBrowsePage();
  return Response.json(data);
}
