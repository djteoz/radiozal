import { readFileSync } from "fs";
import { join } from "path";

const html = readFileSync(join(process.cwd(), "public", "rg.html"), "utf8");

export async function GET() {
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
