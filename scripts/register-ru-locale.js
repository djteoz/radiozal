/**
 * Register Russian locale in index.js
 */
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "public", "assets", "b", "index-DM4_1W1y.js");
let content = fs.readFileSync(filePath, "utf8");

// 1. Add ru import to the locale map
// Before: "./locale/sv.json":()=>ue(()=>import("./sv-2Ve1FZrW.js"),[])})
// After:  "./locale/sv.json":()=>ue(()=>import("./sv-2Ve1FZrW.js"),[]),"./locale/ru.json":()=>ue(()=>import("./ru-RadioZal.js"),[])})
const svImport = '"./locale/sv.json":()=>ue(()=>import("./sv-2Ve1FZrW.js"),[])})';
const svImportWithRu = '"./locale/sv.json":()=>ue(()=>import("./sv-2Ve1FZrW.js"),[]),"./locale/ru.json":()=>ue(()=>import("./ru-RadioZal.js"),[])})';

if (content.includes(svImport)) {
  content = content.replace(svImport, svImportWithRu);
  console.log("1. Added ru import to locale map");
} else {
  console.error("1. FAILED: Could not find sv import pattern");
}

// 2. Add "ru" to locale array
// Before: "pt","pt-BR","sv"]
// After:  "pt","pt-BR","sv","ru"]
const localeArray = '"pt","pt-BR","sv"]';
const localeArrayWithRu = '"pt","pt-BR","sv","ru"]';

if (content.includes(localeArray)) {
  content = content.replace(localeArray, localeArrayWithRu);
  console.log("2. Added 'ru' to locale array");
} else {
  console.error("2. FAILED: Could not find locale array");
}

fs.writeFileSync(filePath, content, "utf8");
console.log("Done!");
