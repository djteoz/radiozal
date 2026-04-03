const fs = require("fs");
let html = fs.readFileSync("public/rg.html", "utf8");

// Update apple-touch-icon to use properly sized file
html = html.replace(
  /rel="apple-touch-icon" href="\/favicon\.png"/g,
  'rel="apple-touch-icon" href="/apple-touch-icon.png"'
);
html = html.replace(
  /rel="apple-touch-icon" sizes="152x152" href="\/favicon\.png"/g,
  'rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon.png"'
);
html = html.replace(
  /rel="apple-touch-icon" sizes="180x180" href="\/favicon\.png"/g,
  'rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"'
);

// Update startup images too
html = html.replace(
  /rel="apple-touch-startup-image"([^>]*)href="\/favicon\.png"/g,
  'rel="apple-touch-startup-image"$1href="/apple-touch-icon.png"'
);

// Update OG image to use our logo
html = html.replace(
  /content="https:\/\/radiozal\.ru\/public\/icons\/rg-facebook-1\.jpg"/g,
  'content="https://radiozal.ru/logo.png"'
);
html = html.replace(
  /content="https:\/\/radiozal\.ru\/public\/icons\/rg-twitter-1\.jpg"/g,
  'content="https://radiozal.ru/logo.png"'
);

fs.writeFileSync("public/rg.html", html, "utf8");
console.log("Updated apple-touch-icon and OG image references");
