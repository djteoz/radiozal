const fs = require("fs");
let content = fs.readFileSync("public/assets/b/AppPromotion-BFvbYj_w.js", "utf8");

// Remove the app store buttons section from the L() component
// Replace the buttons jsxs with just closing the container
const old = `,s.jsxs("div",{className:t(a.buttons,!d&&a.modSingle),children:[j?s.jsx("div",{children:s.jsx($,{})}):null,h&&s.jsx("div",{children:s.jsx(Z,{})})]})`;
const replacement = ``;

if (content.includes(old)) {
  content = content.replace(old, replacement);
  fs.writeFileSync("public/assets/b/AppPromotion-BFvbYj_w.js", content, "utf8");
  console.log("Removed app store buttons from AppPromotion");
} else {
  console.log("Could not find buttons block! Searching...");
  const idx = content.indexOf("a.buttons");
  if (idx >= 0) {
    console.log("Context:", content.substring(idx - 100, idx + 200));
  }
}
