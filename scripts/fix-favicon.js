const fs = require("fs");
let f = fs.readFileSync("public/rg.html", "utf8");

// Replace external favicon with local SVG
f = f.replace(/href="https:\/\/radiozal\.ru\/icons\/favicon\.png"/g, 'href="/favicon.svg"');

// Replace apple-touch-icon URLs with local favicon
f = f.replace(/href="https:\/\/radiozal\.ru\/public\/icons\/ios\/[^"]+"/g, 'href="/favicon.svg"');

// Replace OG image URLs (keep as-is for now, will need proper OG image later)
f = f.replace(/content="https:\/\/radiozal\.ru\/images\/[^"]*"/g, 'content="/favicon.svg"');

fs.writeFileSync("public/rg.html", f, "utf8");
console.log("Done updating favicon paths in rg.html");
