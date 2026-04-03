/**
 * Find locale system configuration in index.js
 */
const fs = require("fs");
const f = fs.readFileSync("public/assets/b/index-DM4_1W1y.js", "utf8");

// Find locale file mapping (lazy imports)
// Look for patterns like "en" appearing near other locale codes
const locales = ["ar", "da", "de", "en", "es", "fr", "id", "it", "ja", "nl", "no", "pt", "sv"];

// Search for the locale-to-module mapping
let idx = 0;
while ((idx = f.indexOf('"en"', idx)) !== -1) {
  const ctx = f.substring(Math.max(0, idx - 200), idx + 300);
  // Check if this context contains multiple locale codes (likely the mapping)
  const foundLocales = locales.filter(l => ctx.includes('"' + l + '"'));
  if (foundLocales.length >= 5) {
    console.log("=== LOCALE MAP at", idx, "===");
    console.log(ctx);
    console.log("Found locales:", foundLocales);
    console.log("");
  }
  idx++;
  if (idx > 310000) break;
}

// Also find __vite__mapDeps which has locale file references
const viteIdx = f.indexOf("__vite__mapDeps");
if (viteIdx !== -1) {
  const chunk = f.substring(viteIdx, viteIdx + 2000);
  console.log("=== VITE MAP DEPS ===");
  console.log(chunk.substring(0, 1500));
}
