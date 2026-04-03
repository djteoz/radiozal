const f = require("fs").readFileSync("public/assets/b/index-DM4_1W1y.js", "utf8");
const idx = f.indexOf("ru-RadioZal");
console.log("Import found at:", idx);
console.log("Context:", f.substring(idx - 40, idx + 60));

const arrIdx = f.indexOf('"sv","ru"');
console.log("\nArray found at:", arrIdx);
if (arrIdx > 0) console.log("Context:", f.substring(arrIdx - 20, arrIdx + 30));
