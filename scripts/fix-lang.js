const fs = require("fs");
let f = fs.readFileSync("public/rg.html", "utf8");
f = f.replace('lang="ru"', 'lang="en"');
fs.writeFileSync("public/rg.html", f, "utf8");
console.log("lang restored to en");
