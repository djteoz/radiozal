const fs = require("fs");
let f = fs.readFileSync("public/rg.html", "utf8");

// Check lang
const lang = f.match(/html[^>]*lang="([^"]+)"/);
console.log("lang:", lang ? lang[1] : "not found");

// Check description
const desc = f.match(/name="description" content="([^"]+)"/);
console.log("desc:", desc ? desc[1] : "not found");

// Update lang to "ru"
if (lang && lang[1] !== "ru") {
  f = f.replace(`lang="${lang[1]}"`, 'lang="ru"');
  console.log("Updated lang to ru");
}

// Update description to Russian
if (desc) {
  f = f.replace(
    `name="description" content="${desc[1]}"`,
    'name="description" content="Радио Зал — агрегатор интернет-радиостанций со всего мира. Слушайте радио, вращая глобус."'
  );
  console.log("Updated description to Russian");
}

fs.writeFileSync("public/rg.html", f, "utf8");
console.log("Done");
