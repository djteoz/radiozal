/**
 * Create Russian locale file for Радио Зал.
 * Takes EN locale as base and translates user-facing strings.
 */
const fs = require("fs");
const path = require("path");

const enPath = path.join(__dirname, "..", "public", "assets", "b", "en-MnKurk0p.js");
const enContent = fs.readFileSync(enPath, "utf8");

// Extract JSON from: const e=JSON.parse('{...}');export{e as messages};
const jsonMatch = enContent.match(/JSON\.parse\('(.+)'\)/);
if (!jsonMatch) { console.error("Cannot parse EN locale"); process.exit(1); }

const messages = JSON.parse(jsonMatch[1]);

// Russian translations map (key → translated array)
const ruTranslations = {
  // Core UI
  "8tjQCz": ["Обзор"],          // Explore
  "X9kySA": ["Избранное"],      // Favorites
  "O2UpM1": ["Каталог"],        // Browse
  "A1taO8": ["Поиск"],          // Search
  "Tz0i8g": ["Настройки"],      // Settings
  "bjT89p": ["Радио Зал"],      // Radio Garden brand

  // Playback
  "+yD+Wu": ["загрузка..."],    // loading...
  "/95KdQ": ["не удалось загрузить аудио"], // failed to load audio
  "64WwqP": ["Загрузка потока"], // Loading stream
  "MmFX21": ["пауза"],         // paused
  "EDUQLA": ["станция не выбрана"], // no station selected
  "77o2eK": ["Нажмите play\nРадио Зал"], // Press play to start
  "YPmzcM": ["Сейчас играет: ", ["title"]], // Now Playing
  "GHR+zM": ["Ошибка воспроизведения: ", ["error"]], // Error while Playing
  "H7dFCv": ["Ошибка воспроизведения: ", ["error"]], // Playback error
  "WzOJay": ["Станция оффлайн"], // Station Offline
  "N7LS3S": ["Активная станция"], // Active Channel

  // Navigation
  "CKyk7Q": ["Назад"],         // Go back
  "AWOSPo": ["Приблизить"],     // Zoom in
  "FjkaiT": ["Отдалить"],      // Zoom out
  "FL4zTI": ["Показать на глобусе"], // Show on Globe
  "Vg6Yy6": ["Перейти к вашему местоположению"], // Go to your location
  "LO9LW8": ["Переход к ближайшему месту"], // Going to nearest place
  "5B/afu": ["Уже в ближайшем месте"], // Already at nearest place
  "RMhMfa": ["Определение местоположения"], // Finding your location

  // Search  
  "5WYZKZ": ["Результаты поиска"], // Search results
  "Ev2r9A": ["Нет результатов"], // No results
  "GlGagq": ["очистить поиск"], // clear search
  "W4Bqu8": ["отменить поиск"], // cancel search
  "3JTlG8": ["Недавние поиски"], // Recent Searches
  "LETtq+": ["Поиск не отвечает"], // Search is not responding

  // Favorites
  "KhBQE5": ["добавить в избранное"], // add to favorites
  "Qh7QmR": ["Удалено из избранного"], // Removed from favorites
  "9tRvfQ": ["Сохраняйте любимые станции, города и плейлисты."], // Save your favorite stations
  "ClQuGQ": ["удалить ", ["title"], " из избранного"], // remove from favorites
  "bG0JKz": ["Удалить страницу ", ["title"], " из избранного"], // Remove page from favorites
  "fYkmR/": ["Произошла ошибка при загрузке избранного. Попробуйте позже."], // problem loading favorites
  "dejGov": ["Нет элементов"], // No items
  "CAyo3g": ["Переместить вверх"], // Move favorite up
  "fs/cQ+": ["Переместить вниз"], // Move favorite down

  // Sharing
  "Z8lGw6": ["Поделиться"],    // Share
  "/0ZIag": ["Поделиться ", ["topic"]], // Share topic
  "PPW9sS": ["Поделиться станцией"], // Share Station
  "PXE6vk": ["Поделиться текущей станцией"], // Share Current Station
  "Xfewt8": ["Открыть диалог отправки станции"], // Open Share Station Dialog
  "41P/gM": ["Отправить по Email"], // Share by Email
  "ZW04Wa": ["Поделиться в Facebook"], // Share on Facebook
  "STJz1y": ["Поделиться в X"],  // Share on X
  "6V3Ea3": ["Скопировано"],    // Copied
  "fma9kX": ["Скопировать ссылку на ", ["topic"]], // Copy link
  "O6hfIZ": ["Скопировать информацию о текущем треке"], // Copy current track

  // Settings
  "AAUoRf": ["Качество глобуса"], // Globe Quality
  "CsekCi": ["Обычное"],       // Normal
  "Psyj/F": ["Очень высокое"], // Very High
  "Dnn2XG": ["Автоматически"], // Automatic
  "LAeu+6": ["Повышенный контраст"], // Increased Contrast
  "Cmfsra": ["Вибрация"],      // Vibration
  "Z5HWHd": ["Вкл"],           // On
  "az8lvo": ["Выкл"],          // Off
  "diFfbv": ["Размер точек глобуса"], // Globe Dots Size
  "ZGZBS4": ["Более чёткие точки"], // Sharper globe dots
  "oRVm8M": ["Тёмная тема"],   // Dark Mode
  "LcET2C": ["Политика конфиденциальности"], // Privacy Policy

  // Country/location
  "8osBf4": ["Текущее местоположение: ", ["city"], ", ", ["country"]], // Current location
  "7Hb/ic": [["radioStation"], " в ", ["location"]], // radioStation in location
  "zObjqY": [["count"], " станций"], // stations count
  "Eh7Dql": ["Великобритания"], // United Kingdom
  "gFYnXk": ["Используется приблизительное местоположение"], // Using generalized location

  // Errors
  "Bustu7": ["Что-то пошло не так"], // Something went wrong
  "Vw8l6h": ["Произошла ошибка"], // An error occurred
  "JeWoCL": ["Произошла ошибка: ", ["errorMessage"]], // An error occurred
  "R1Cupe": ["Извините, при загрузке страницы<br>произошла ошибка."], // Sorry, something went wrong
  "AO3WMO": ["Ошибка загрузки страницы"], // Page Load Error
  "boJlGf": ["Страница не найдена"], // Page Not Found
  "zYP950": ["К сожалению, мы не смогли найти эту страницу."], // Sorry, we were unable to find
  "KDw4GX": ["Попробовать снова"], // Try again
  "U4miaS": ["попробуйте позже."], // please try again later
  "5Fl/Fo": ["нет подключения к интернету"], // internet offline
  "KHaHlh": ["Возможно, проблема с подключением к интернету"], // internet connection problem
  "DNZKE2": ["Геолокация не удалась"], // Geolocation failed
  "F35QL9": ["Время ожидания геолокации истекло"], // Geolocation timed out
  "z+4nb6": ["Разрешение на геолокацию было отклонено"], // Geolocation permission denied

  // Dialogs
  "12ojNU": ["Закрыть диалог"], // Close Dialog
  "7wy7ek": ["Закрыть диалог ", ["label"]], // Close Dialog
  "yz7wBu": ["Закрыть"],       // Close
  "dEgA5A": ["Отмена"],        // Cancel
  "zga9sT": ["ОК"],            // OK
  "1UzENP": ["Нет"],           // No
  "DPfwMq": ["Готово"],        // Done
  "ePK91l": ["Редактировать"], // Edit
  "PaQ3df": ["Включить"],      // Enable
  "cO9+2L": ["Выключить"],     // Disable

  // Station
  "WVwH3w": ["О станции"],     // Station Details
  "LxkWiE": ["Открыть сайт"], // Visit Website
  "5tCp6c": ["Все станции"],   // View all stations
  "AhFHyP": ["Закрепить станцию"], // Lock station
  "Fi1yRn": ["Открепить станцию"], // Unlock station
  "eGi7cP": ["Станция закреплена"], // Station locked
  "Xlfp7U": ["Станция откреплена"], // Station unlocked
  "CyaLvR": ["показать дополнительные опции"], // show more channel options
  "MADjK2": ["перейти к месту станции"], // navigate to station place

  // Balloon Ride
  "+/a6X/": ["Радио на воздушном шаре"], // Balloon Ride Radio
  "QCTmRb": ["На воздушном шаре\nРадио"], // Balloon Ride Radio
  "bquhcU": ["Полетели"],      // Take a ride
  "RxcEOx": ["Выйти из режима воздушного шара"], // Exit Balloon Mode
  "4HSPqD": ["Где я?"],        // Where am I?

  // Equalizer
  "9VwSCe": ["Эквалайзер"],    // Equalizer
  "VPkSCC": ["Открыть эквалайзер"], // Open Equalizer
  "8Tg/JR": ["Свой"],          // Custom
  "/TEOcd": ["Пресеты"],       // Presets
  "ah5vYS": ["Настроить частоту ", ["frequencyInHz"], " Гц"], // Adjust Frequency
  "cbvOF2": ["Выбрать пресет ", ["title"]], // Select preset

  // Sleep Timer
  "UwHb5n": ["Таймер сна"],    // Sleep Timer
  "N73GxA": [["minuteCount"], " минут"], // minutes

  // Premium (keep but translate)
  "RY5kDp": ["Премиум"],       // Premium  
  "MfbUBg": ["Без визуальной рекламы"], // No Visual Ads

  // Copyright
  "cmZt3f": ["© ", ["0"], " Радио Зал. Все права защищены"], // copyright

  // App promotion
  "b9EmAf": ["Скачайте наше бесплатное приложение для Android или iPhone."], // Get our free app
  "aUNhKl": ["Скачайте приложение для Android!"], // Get our free Android app
  "EE/vEj": ["Скачайте приложение для iPhone!"], // Get our free iPhone app
  "5G3AMh": ["Скачайте приложение для iPad!"], // Get our free iPad app
  "PDz1ug": ["Скачайте приложение для Android."], // Get our free Android app full
  "ESi8Og": ["Скачайте приложение для iPhone."], // Get our free iPhone app full
  "NGJn1n": ["Скачайте приложение для iPad."], // Get our free iPad app full

  // Brand-specific
  "i9duqd": ["Запустить Радио Зал"], // Start Radio Garden
  "CHBacb": ["Перейти на Радио Зал"], // Go to Radio Garden
  "nuPtVh": ["Поделиться Радио Зал"], // Share Radio Garden
  "WWJ4OJ": ["Попробуйте Радио Зал!"], // Check out Radio Garden
  "OPDN+1": ["Нравится Радио Зал?"], // Do you love Radio Garden?
  "Cb0BjN": ["Перезагрузить Радио Зал"], // Reload Radio Garden
  "cMAU9/": ["Слушайте радио со всего мира, вращая глобус."], // Explore live radio

  // Misc
  "HRha/x": ["Основная навигация"], // Main navigation
  "SfpklK": ["Поверните телефон"], // Please rotate your phone
  "+HaSJC": ["достигнут верх списка"], // reached top of list  
  "Are3R6": ["достигнут конец списка"], // reached bottom of list
  "/e327r": ["Загрузка..."],    // Planting seeds...
  "gukqfD": ["Смотреть все"],  // See all
  "6synpr": ["предупреждение"], // warning
  "QoPev7": ["Убедитесь, что браузер обновлён..."], // browser up to date

  // Language change
  "VY+eAk": ["Вы уверены, что хотите сменить язык на ", ["language"], "?"], // language change confirm
  "UDgq4Z": [["endonym"], " (Предпросмотр)"], // language preview

  // List/Favorites accessibility
  "1xfm4T": ["Показать элементы на странице ", ["ariaPageIndex"], " из ", ["pageCount"]],
  "FoeAWb": ["Закрыть панель ", ["ariaName"]],

  // Cookies
  "4032l+": ["Мы используем файлы cookie для различных целей, включая персонализированный маркетинг. Используя наш сервис, вы соглашаетесь с использованием cookie, как описано в нашей <0>Политике конфиденциальности</0>"],

  // Time/station details
  "H1qT2f": ["<p>Возможно, у станции ", ["stationTitle"], " есть проблемы.</p><p>Её поток был нестабилен последние ", ["dayCount"], " дней.</p>"],
  "5mm6nP": ["Слушайте ", ["title"], " из ", ["place"], " на Радио Зал:"],
  "HzZ4V6": ["Слушайте ", ["title"], " на Радио Зал:"],
  "n1qksf": ["Попробуйте ", ["title"], " на Радио Зал:"],
  "UsmrUn": ["Поделиться ", ["topic"], " в Facebook"],
};

// Apply translations
for (const [key, value] of Object.entries(ruTranslations)) {
  messages[key] = value;
}

// Build the RU locale file
const jsonStr = JSON.stringify(messages).replace(/'/g, "\\'");
const ruContent = `const e=JSON.parse('${jsonStr}');export{e as messages};\n`;

const ruPath = path.join(__dirname, "..", "public", "assets", "b", "ru-RadioZal.js");
fs.writeFileSync(ruPath, ruContent, "utf8");

console.log(`Russian locale created: ru-RadioZal.js`);
console.log(`Total keys: ${Object.keys(messages).length}`);
console.log(`Translated: ${Object.keys(ruTranslations).length}`);
console.log(`Remaining in English: ${Object.keys(messages).length - Object.keys(ruTranslations).length}`);
