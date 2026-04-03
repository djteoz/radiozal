const fs = require("fs");
const f = "public/assets/b/index-DM4_1W1y.js";
let c = fs.readFileSync(f, "utf8");

const old1 = 'new Intl.Collator(void 0,{sensitivity:"base"})';
const new1 = 'new Intl.Collator("en",{sensitivity:"base"})';

console.log("found:", c.includes(old1));

c = c.replace(old1, new1);

fs.writeFileSync(f, c);
console.log("Written.");

const v = fs.readFileSync(f, "utf8");
console.log("new present:", v.includes(new1));
