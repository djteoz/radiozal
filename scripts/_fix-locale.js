const fs = require("fs");
const f = "public/assets/b/index-DM4_1W1y.js";
let c = fs.readFileSync(f, "utf8");

const old1 = 'system:ca(Zt,navigator.languages)';
const new1 = 'system:ca({locales:ah.filter(function(l){return l!=="ru"}),draftLocales:ch},navigator.languages)';

const old2 = 'e.locale.setSystem(ca(Zt,navigator.languages))';
const new2 = 'e.locale.setSystem(ca({locales:ah.filter(function(l){return l!=="ru"}),draftLocales:ch},navigator.languages))';

console.log("old1 found:", c.includes(old1));
console.log("old2 found:", c.includes(old2));

c = c.replace(old1, new1);
c = c.replace(old2, new2);

fs.writeFileSync(f, c);
console.log("Written.");

const v = fs.readFileSync(f, "utf8");
console.log("new1 present:", v.includes(new1));
console.log("new2 present:", v.includes(new2));
console.log('ru still in ah:', v.includes('"sv","ru"]'));
