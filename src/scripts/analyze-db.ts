import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "data", "radio.db"));

const total = (db.prepare("SELECT COUNT(*) as c FROM stations WHERE countrycode = 'RU'").get() as any).c;
console.log("RU total:", total);

const bySource = db.prepare("SELECT source, COUNT(*) as c FROM stations WHERE countrycode = 'RU' GROUP BY source").all() as any[];
console.log("\nBy source:");
bySource.forEach((r: any) => console.log(`  ${r.source}: ${r.c}`));

const dupes = db.prepare(`
  SELECT name, COUNT(*) as c FROM stations
  WHERE countrycode = 'RU'
  GROUP BY LOWER(TRIM(name)) HAVING c > 1
  ORDER BY c DESC LIMIT 20
`).all() as any[];
console.log("\nTop RU duplicates:");
dupes.forEach((d: any) => console.log(`  "${d.name}" x${d.c}`));

const globalDupes = db.prepare(`
  SELECT name, COUNT(*) as c FROM stations
  GROUP BY LOWER(TRIM(name)) HAVING c > 1
  ORDER BY c DESC LIMIT 15
`).all() as any[];
console.log("\nTop GLOBAL duplicates:");
globalDupes.forEach((d: any) => console.log(`  "${d.name}" x${d.c}`));

const ep = db.prepare(`
  SELECT name, url, source, countrycode FROM stations
  WHERE LOWER(name) LIKE '%европа%плюс%' OR LOWER(name) LIKE '%europa plus%'
  ORDER BY name
`).all() as any[];
console.log(`\nEuropa Plus entries: ${ep.length}`);
ep.forEach((e: any) => console.log(`  [${e.countrycode}] ${e.name} | ${e.source} | ${e.url.substring(0, 70)}`));

const allTotal = (db.prepare("SELECT COUNT(*) as c FROM stations").get() as any).c;
const allVisible = (db.prepare("SELECT COUNT(*) as c FROM stations WHERE countrycode NOT IN ('UA')").get() as any).c;
console.log(`\nTotal in DB: ${allTotal}, Visible: ${allVisible}`);

db.close();
