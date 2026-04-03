const fs = require("fs");
let f = fs.readFileSync("public/rg.html", "utf8");

// Replace favicon reference
f = f.replace(/href="\/favicon\.svg"/g, 'href="/favicon.png"');

// Also update any remaining external icon references
f = f.replace(/href="https:\/\/radiozal\.ru\/icons\/[^"]*"/g, 'href="/favicon.png"');

fs.writeFileSync("public/rg.html", f, "utf8");
console.log("Updated favicon to /favicon.png");
