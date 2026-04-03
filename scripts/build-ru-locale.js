/**
 * Create Russian locale from parsed EN messages.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

// Load EN messages from parsed JSON
const messages = JSON.parse(fs.readFileSync(path.join(__dirname, "_en-messages.json"), "utf8"));

// Russian translations
const ru = {
  "8tjQCz": ["Обзор"],
  "X9kySA": ["Избранное"],
  "O2UpM1": ["Каталог"],
  "A1taO8": ["Поиск"],
  "Tz0i8g": ["Настройки"],
  "bjT89p": ["Радио Зал"],
  "+yD+Wu": ["загрузка..."],
  "/95KdQ": ["не удалось загрузить аудио"],
  "64WwqP": ["Загрузка потока"],
  "MmFX21": ["пауза"],
  "EDUQLA": ["станция не выбрана"],
  "77o2eK": ["Нажмите play\nРадио Зал"],
  "YPmzcM": ["Сейчас играет: ", ["title"]],
  "GHR+zM": ["Ошибка воспроизведения: ", ["error"]],
  "H7dFCv": ["Ошибка воспроизведения: ", ["error"]],
  "WzOJay": ["Станция оффлайн"],
  "N7LS3S": ["Активная станция"],
  "vJoBfO": ["Загрузка из ", ["streamUrl"]],
  "nZeI8k": ["станция не отвечает…"],
  "p0knve": ["станция недоступна"],
  "CKyk7Q": ["Назад"],
  "iH8pgl": ["Назад"],
  "AWOSPo": ["Приблизить"],
  "FjkaiT": ["Отдалить"],
  "FL4zTI": ["Показать на глобусе"],
  "Vg6Yy6": ["Перейти к вашему местоположению"],
  "LO9LW8": ["Переход к ближайшему месту"],
  "5B/afu": ["Уже в ближайшем месте"],
  "RMhMfa": ["Определение местоположения"],
  "l3xSd5": ["Управление глобусом"],
  "wNJqSv": ["интерактивный глобус"],
  "5WYZKZ": ["Результаты поиска"],
  "Ev2r9A": ["Нет результатов"],
  "GlGagq": ["очистить поиск"],
  "W4Bqu8": ["отменить поиск"],
  "3JTlG8": ["Недавние запросы"],
  "LETtq+": ["Поиск не отвечает"],
  "kULvVM": ["Страна, Город, Станция"],
  "xCJdfg": ["Очистить"],
  "KhBQE5": ["добавить в избранное"],
  "Qh7QmR": ["Удалено из избранного"],
  "pL78ec": ["Добавлено в избранное"],
  "9tRvfQ": ["Сохраняйте любимые станции, города и плейлисты."],
  "ClQuGQ": ["удалить ", ["title"], " из избранного"],
  "bG0JKz": ["Удалить страницу ", ["title"], " из избранного"],
  "fYkmR/": ["Произошла ошибка при загрузке избранного. Попробуйте позже."],
  "dejGov": ["Нет элементов"],
  "CAyo3g": ["Переместить вверх"],
  "fs/cQ+": ["Переместить вниз"],
  "tz6vp7": ["добавить ", ["title"], " в избранное"],
  "ye7CS9": ["Добавить страницу ", ["title"], " в избранное"],
  "x6K/wF": ["удалить из избранного"],
  "uDbQPV": ["Удалить из избранного"],
  "uig09Q": ["Нажмите на значок сердца, чтобы добавить станцию в избранное."],
  "Z8lGw6": ["Поделиться"],
  "/0ZIag": ["Поделиться ", ["topic"]],
  "PPW9sS": ["Поделиться станцией"],
  "PXE6vk": ["Поделиться текущей станцией"],
  "Xfewt8": ["Открыть диалог отправки"],
  "41P/gM": ["Отправить по Email"],
  "ZW04Wa": ["Поделиться в Facebook"],
  "STJz1y": ["Поделиться в X"],
  "oed5fg": ["Поделиться в Bluesky"],
  "ohAMU6": ["Поделиться ", ["topic"], " в Bluesky"],
  "6V3Ea3": ["Скопировано"],
  "tLpbaV": ["Ссылка скопирована"],
  "fma9kX": ["Скопировать ссылку на ", ["topic"]],
  "y1eoq1": ["Скопировать ссылку"],
  "O6hfIZ": ["Скопировать информацию о треке"],
  "UsmrUn": ["Поделиться ", ["topic"], " в Facebook"],
  "vWrMaY": ["Поделиться ", ["topic"], " в X"],
  "x2hytj": ["Поделиться ", ["topic"], " по Email"],
  "tR+vn2": ["Поделиться страницей ", ["pageTitle"]],
  "xMiTSp": ["Поделиться <em>", ["topic"], "</em>"],
  "AAUoRf": ["Качество глобуса"],
  "CsekCi": ["Обычное"],
  "Psyj/F": ["Очень высокое"],
  "yx/fMc": ["Высокое"],
  "Dnn2XG": ["Автоматически"],
  "LAeu+6": ["Повышенный контраст"],
  "Cmfsra": ["Вибрация"],
  "Z5HWHd": ["Вкл"],
  "az8lvo": ["Выкл"],
  "diFfbv": ["Размер точек глобуса"],
  "ZGZBS4": ["Более чёткие точки"],
  "hiR5Rg": ["Более чёткие точки и карта"],
  "oRVm8M": ["Тёмная тема"],
  "LcET2C": ["Политика конфиденциальности"],
  "vXIe7J": ["Язык"],
  "srRMnJ": ["Настроить"],
  "wk8ENz": ["Карта"],
  "qK8WhF": ["Максимальная производительность"],
  "k7rCa/": ["Большой"],
  "vp6Yr4": ["Очень большой"],
  "BiqKcm": ["Повышенный контраст делает интерфейс более читабельным, особенно для людей с ослабленным зрением."],
  "eaz3ey": ["Примечание: Увеличение качества может привести к менее плавному отображению на некоторых устройствах."],
  "vbP3Ux": ["Конфиденциальность и cookie"],
  "xpgWxT": ["Настройки конфиденциальности"],
  "8osBf4": ["Текущее местоположение: ", ["city"], ", ", ["country"]],
  "7Hb/ic": [["radioStation"], " в ", ["location"]],
  "zObjqY": [["count"], " станций"],
  "Eh7Dql": ["Великобритания"],
  "gFYnXk": ["Используется приблизительное местоположение"],
  "x1MQK0": ["Местное время ", ["time"]],
  "Bustu7": ["Что-то пошло не так"],
  "Vw8l6h": ["Произошла ошибка"],
  "JeWoCL": ["Произошла ошибка: ", ["errorMessage"]],
  "R1Cupe": ["Извините, при загрузке страницы<br>произошла ошибка."],
  "AO3WMO": ["Ошибка загрузки страницы"],
  "boJlGf": ["Страница не найдена"],
  "zYP950": ["К сожалению, мы не смогли найти эту страницу."],
  "KDw4GX": ["Попробовать снова"],
  "qJb6G2": ["Попробовать снова"],
  "U4miaS": ["попробуйте позже."],
  "5Fl/Fo": ["нет подключения к интернету"],
  "KHaHlh": ["Возможно, проблема с подключением к интернету"],
  "wszIzz": ["Похоже, вы не подключены к интернету."],
  "DNZKE2": ["Геолокация не удалась"],
  "F35QL9": ["Время ожидания геолокации истекло"],
  "z+4nb6": ["Разрешение на геолокацию отклонено"],
  "pi45ps": ["Данные о местоположении недоступны"],
  "lKqu6H": ["Извините, при загрузке страницы произошла ошибка."],
  "j7eM1l": ["Произошла ошибка при загрузке"],
  "12ojNU": ["Закрыть"],
  "7wy7ek": ["Закрыть диалог ", ["label"]],
  "yz7wBu": ["Закрыть"],
  "dEgA5A": ["Отмена"],
  "zga9sT": ["ОК"],
  "1UzENP": ["Нет"],
  "l75CjT": ["Да"],
  "DPfwMq": ["Готово"],
  "ePK91l": ["Редактировать"],
  "PaQ3df": ["Включить"],
  "cO9+2L": ["Выключить"],
  "WVwH3w": ["О станции"],
  "LxkWiE": ["Открыть сайт"],
  "qw8+7j": ["Открыть сайт"],
  "5tCp6c": ["Все станции"],
  "AhFHyP": ["Закрепить станцию"],
  "Fi1yRn": ["Открепить станцию"],
  "eGi7cP": ["Станция закреплена"],
  "Xlfp7U": ["Станция откреплена"],
  "CyaLvR": ["дополнительные опции"],
  "MADjK2": ["перейти к месту станции"],
  "kIIt+Z": ["Закрыть информацию о станции"],
  "gukqfD": ["Смотреть все"],
  "4XocXl": ["Смотреть плейлист"],
  "wsmnpD": ["Смотреть плейлист: ", ["title"]],
  "+/a6X/": ["Радио на воздушном шаре"],
  "QCTmRb": ["На воздушном\nшаре"],
  "bquhcU": ["Полетели"],
  "RxcEOx": ["Выйти из режима полёта"],
  "4HSPqD": ["Где я?"],
  "9VwSCe": ["Эквалайзер"],
  "VPkSCC": ["Открыть эквалайзер"],
  "jvic8s": ["Настройки эквалайзера"],
  "8Tg/JR": ["Свой"],
  "/TEOcd": ["Пресеты"],
  "ah5vYS": ["Настроить частоту ", ["frequencyInHz"], " Гц"],
  "cbvOF2": ["Выбрать пресет ", ["title"]],
  "fzhnwE": ["Нажмите на иконку для настройки эквалайзера."],
  "UwHb5n": ["Таймер сна"],
  "N73GxA": [["minuteCount"], " минут"],
  "vp5vfW": ["1 час"],
  "xDXoov": ["открыть таймер сна"],
  "sGZpbL": ["Нажмите на иконку для запуска таймера сна."],
  "vRayGs": ["Плеер"],
  "jO6kqu": ["Громкость"],
  "RY5kDp": ["Премиум"],
  "MfbUBg": ["Без визуальной рекламы"],
  "MOhMTg": ["Радио Зал <em>Премиум</em>"],
  "TWZgxv": ["Радио Зал<br><em>Премиум</em>"],
  "gfSqu8": ["Радио Зал Премиум"],
  "9Vt/AY": ["Доступно с<br>Радио Зал <em>Премиум</em>"],
  "cmZt3f": ["© ", ["0"], " Радио Зал. Все права защищены"],
  "b9EmAf": ["Скачайте наше бесплатное приложение для Android или iPhone."],
  "aUNhKl": ["Скачайте приложение для Android!"],
  "EE/vEj": ["Скачайте приложение для iPhone!"],
  "5G3AMh": ["Скачайте приложение для iPad!"],
  "PDz1ug": ["Скачайте приложение для Android."],
  "ESi8Og": ["Скачайте приложение для iPhone."],
  "NGJn1n": ["Скачайте приложение для iPad."],
  "W5Sb7+": ["Скачайте приложение для сохранения избранного."],
  "3GnasI": ["Радио Зал в Google Play"],
  "mZqsh5": ["Радио Зал в App Store"],
  "i9duqd": ["Запустить Радио Зал"],
  "CHBacb": ["Перейти на Радио Зал"],
  "nuPtVh": ["Поделиться Радио Зал"],
  "WWJ4OJ": ["Попробуйте Радио Зал!"],
  "OPDN+1": ["Нравится Радио Зал?"],
  "Cb0BjN": ["Перезагрузить Радио Зал"],
  "cMAU9/": ["Слушайте радио со всего мира, вращая глобус."],
  "+OdHWw": ["Полёт на воздушном шаре с Радио Зал. Слушайте, смотрите и угадайте, где вы!"],
  "5mm6nP": ["Слушайте ", ["title"], " из ", ["place"], " на Радио Зал:"],
  "HzZ4V6": ["Слушайте ", ["title"], " на Радио Зал:"],
  "n1qksf": ["Попробуйте ", ["title"], " на Радио Зал:"],
  "hGS8+a": ["Радио Зал успешно обновлён и больше не показывает рекламу."],
  "HRha/x": ["Основная навигация"],
  "SfpklK": ["Поверните телефон"],
  "+HaSJC": ["достигнут верх списка"],
  "Are3R6": ["достигнут конец списка"],
  "/e327r": ["Загрузка..."],
  "6synpr": ["предупреждение"],
  "QoPev7": ["Убедитесь, что ваш браузер обновлён..."],
  "iA3pmt": ["Убедитесь, что ваша система обновлена..."],
  "isRobC": ["Новое"],
  "prSAF+": ["Подробнее…"],
  "yQE2r9": ["Загрузка"],
  "ydzS9x": ["Выход"],
  "v6T67v": ["Хотите получить полный опыт?"],
  "9BpMGI": ["Приложение заблокировано"],
  "VY+eAk": ["Вы уверены, что хотите сменить язык на ", ["language"], "?"],
  "UDgq4Z": [["endonym"], " (Предпросмотр)"],
  "5wR3xE": ["соответствует системным настройкам"],
  "1xfm4T": ["Показать элементы на странице ", ["ariaPageIndex"], " из ", ["pageCount"]],
  "FoeAWb": ["Закрыть панель ", ["ariaName"]],
  "rObZOT": ["Открыть панель ", ["ariaName"]],
  "GvI02x": ["перемещено вниз"],
  "HXOUjg": ["перемещено вверх"],
  "ZTEy91": ["стрелка"],
  "4032l+": ["Мы используем cookie. Продолжая использовать сервис, вы соглашаетесь с нашей <0>Политикой конфиденциальности</0>"],
  "H1qT2f": ["<p>Возможны проблемы с воспроизведением ", ["stationTitle"], ".</p><p>Поток был нестабилен последние ", ["dayCount"], " дней.</p>"],
  "jOFNe7": ["Плейлист от ", ["authorName"]],
  "oSO7+q": ["Плейлисты от ", ["authorName"]],
  "+rWme5": ["Ваша подписка"],
  "CyN0x0": ["Отменить подписку"],
  "L9IOec": ["Управление подпиской"],
  "NCRVpI": ["Покупки"],
  "BK16OD": ["Восстановить покупки"],
  "DorN4t": ["Открыть магазин"],
  "Wkdy65": ["Уже приобретено?"],
  "gqh64K": ["Получить"],
  "CjVpnl": ["Спасибо за подписку!"],
  "CNgt0W": ["Выберите тариф <em>Премиум</em>"],
  "JvodDk": ["Станции за пределами Великобритании недоступны"],
};

// Apply translations to a copy of EN messages
for (const [key, value] of Object.entries(ru)) {
  if (key in messages) {
    messages[key] = value;
  }
}

// Now we need to create the JS file in the same format as EN.
// The tricky part: JSON.stringify + embed in JS single-quoted string.
// We'll use a different approach: write the file using template that eval's correctly.
const jsonStr = JSON.stringify(messages);

// For embedding in a JS single-quoted string:
// 1. Escape backslashes first (\ → \\)
// 2. Escape single quotes (' → \')
// But JSON already has backslash-escaped content (like \\n in the HTML strings).
// So we need to be careful.

// Actually, the simplest approach: same format as other locale files.
// They use JSON.stringify embedded in single quotes.
// The original file was built by Vite which handles this correctly.
// Let's replicate it by double-escaping.

// In the original: JSON.parse('{"key":["value with \\"quotes\\" and \\n"]}')
// The single-quoted JS string contains the JSON with internal escaped chars.

const escapedForJs = jsonStr
  .replace(/\\/g, "\\\\")  // \ → \\
  .replace(/'/g, "\\'");    // ' → \'

const ruFileContent = `const e=JSON.parse('${escapedForJs}');export{e as messages};\n`;

// Verify by evaluating
try {
  const testSandbox = { result: null, JSON };
  vm.runInNewContext(`result = JSON.parse('${escapedForJs}')`, testSandbox);
  console.log("Verification passed:", Object.keys(testSandbox.result).length, "keys");
} catch (err) {
  console.error("Verification FAILED:", err.message);
  process.exit(1);
}

const outPath = path.join(__dirname, "..", "public", "assets", "b", "ru-RadioZal.js");
fs.writeFileSync(outPath, ruFileContent, "utf8");
console.log("Created:", outPath);
console.log("Translated:", Object.keys(ru).length, "keys");
console.log("File size:", Buffer.byteLength(ruFileContent), "bytes");
