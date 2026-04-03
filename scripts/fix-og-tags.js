const fs = require("fs");
let f = fs.readFileSync("public/rg.html", "utf8");

const tags = ["og:title", "og:description", "og:site_name", "twitter:title", "twitter:description"];
for (const tag of tags) {
  let re = new RegExp('property="' + tag + '" content="([^"]+)"');
  let m = f.match(re);
  if (!m) {
    re = new RegExp('name="' + tag + '" content="([^"]+)"');
    m = f.match(re);
  }
  console.log(tag + ":", m ? m[1] : "NOT FOUND");
}

// Update OG tags to Russian
const ogReplacements = [
  [/property="og:title" content="[^"]+"/g, 'property="og:title" content="Радио Зал — Слушайте радио со всего мира"'],
  [/property="og:description" content="[^"]+"/g, 'property="og:description" content="Агрегатор интернет-радиостанций. Слушайте радио, вращая глобус."'],
  [/property="og:site_name" content="[^"]+"/g, 'property="og:site_name" content="Радио Зал"'],
  [/name="twitter:title" content="[^"]+"/g, 'name="twitter:title" content="Радио Зал — Слушайте радио со всего мира"'],
  [/name="twitter:description" content="[^"]+"/g, 'name="twitter:description" content="Агрегатор интернет-радиостанций. Слушайте радио, вращая глобус."'],
];

for (const [pattern, replacement] of ogReplacements) {
  f = f.replace(pattern, replacement);
}

fs.writeFileSync("public/rg.html", f, "utf8");
console.log("OG tags updated");
