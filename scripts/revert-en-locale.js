/**
 * Revert incorrect Russian strings in EN locale back to English.
 * Keep "Радио Зал" brand name (that's correct), but revert translated UI strings.
 */
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "public", "assets", "b", "en-MnKurk0p.js");
let content = fs.readFileSync(filePath, "utf8");

const reverts = [
  ["Все права защищены", "All rights reserved"],
  ["Нажмите play для начала\\nРадио Зал", "Press play to start\\nРадио Зал"],
  ["Запустить Радио Зал", "Start Радио Зал"],
  ["Перейти на Радио Зал", "Go to Радио Зал"],
  ["Поделиться Радио Зал", "Share Радио Зал"],
  ["Попробуйте Радио Зал!", "Check out Радио Зал!"],
  ["Нравится Радио Зал?", "Do you love Радио Зал?"],
  ["Перезагрузить Радио Зал", "Reload Радио Зал"],
];

let count = 0;
for (const [russian, english] of reverts) {
  if (content.includes(russian)) {
    content = content.replace(russian, english);
    count++;
    console.log(`  Reverted: "${russian}" → "${english}"`);
  } else {
    console.log(`  Not found: "${russian}"`);
  }
}

fs.writeFileSync(filePath, content, "utf8");
console.log(`\nReverted ${count} strings in EN locale`);
