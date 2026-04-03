/**
 * Replace "Radio Garden" branding with "Радио Зал" across frontend JS files.
 */
const fs = require("fs");
const path = require("path");

const assetsDir = path.join(__dirname, "..", "public", "assets", "b");

const replacements = [
  // Generic "Radio Garden" → "Радио Зал"
  [/Radio Garden BV/g, "Радио Зал"],
  [/Radio Garden Premium/g, "Радио Зал Premium"],
  [/Radio Garden/g, "Радио Зал"],
  // radio.garden domain in share URLs
  [/radio\.garden/g, "radiozal.ru"],
];

const files = ["index-DM4_1W1y.js", "en-MnKurk0p.js"];

for (const file of files) {
  const filePath = path.join(assetsDir, file);
  let content = fs.readFileSync(filePath, "utf8");
  let count = 0;

  for (const [pattern, replacement] of replacements) {
    const matches = content.match(pattern);
    if (matches) {
      count += matches.length;
      content = content.replace(pattern, replacement);
    }
  }

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`${file}: ${count} replacements`);
}

// Also update rg.html title
const htmlPath = path.join(__dirname, "..", "public", "rg.html");
let html = fs.readFileSync(htmlPath, "utf8");
html = html.replace(/<title>Radio Garden<\/title>/g, "<title>Радио Зал</title>");
html = html.replace(/Radio Garden/g, "Радио Зал");
html = html.replace(/radio\.garden/g, "radiozal.ru");
fs.writeFileSync(htmlPath, html, "utf8");
console.log("rg.html: updated");
