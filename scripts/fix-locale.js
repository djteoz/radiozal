/**
 * Additional locale fixes for Russian branding.
 */
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "public", "assets", "b", "en-MnKurk0p.js");
let content = fs.readFileSync(filePath, "utf8");

// Fix copyright: "All rights reserved" → "Все права защищены"
content = content.replace("All rights reserved", "Все права защищены");

// Fix "Press play to start\nRadio Garden" → already replaced Radio Garden,
// but let's also make the whole string Russian
content = content.replace(
  'Press play to start\\nРадио Зал',
  'Нажмите play для начала\\nРадио Зал'
);

// "Start Radio Garden" → "Запустить Радио Зал"
content = content.replace('Start Радио Зал', 'Запустить Радио Зал');

// "Go to Radio Garden" → "Перейти на Радио Зал"
content = content.replace('Go to Радио Зал', 'Перейти на Радио Зал');

// "Share Radio Garden" → "Поделиться Радио Зал"
content = content.replace('Share Радио Зал', 'Поделиться Радио Зал');

// "Check out Radio Garden!" → "Попробуйте Радио Зал!"
content = content.replace('Check out Радио Зал!', 'Попробуйте Радио Зал!');

// "Do you love Radio Garden?" → "Нравится Радио Зал?"
content = content.replace('Do you love Радио Зал?', 'Нравится Радио Зал?');

// "Reload Radio Garden" → "Перезагрузить Радио Зал"
content = content.replace('Reload Радио Зал', 'Перезагрузить Радио Зал');

fs.writeFileSync(filePath, content, "utf8");
console.log("Locale fixes applied");
