# РадиоЗал — Project Instructions

## О проекте

РадиоЗал (radiozal.ru) — агрегатор интернет-радиостанций с 3D-глобусом. Клон Radio Garden с собственным бэкендом.
~44 000 станций в SQLite, ~7 585 прошли проверку доступности. 542 города, 182 страны.

## Подход

Используется **настоящий фронтенд Radio Garden** (JS-бандлы, CSS, шрифты) + **собственный бэкенд** с RG-совместимым API. НЕ пишем свой фронтенд - только бэкенд и API.

## Стек

- **Next.js 16.2** (App Router)
- **TypeScript 5** (`strict: true`)
- **SQLite** через `better-sqlite3`
- **MapLibre GL v5** — 3D-глобус (projection: globe, MapTiler satellite tiles)
- **Atlas Grotesk Web** — шрифт (из Radio Garden)
- **Lingui** — i18n (16 языков, включая русский)
- **sharp** — обработка изображений (иконки)

## Языки и локализация

- Интерфейс на **английском** по умолчанию (Automatic = English)
- Русский язык добавлен в список ручного выбора (НЕ в автоопределение)
- В `index-DM4_1W1y.js`: `ah` массив содержит "ru", но `ca()` фильтрует его из автоопределения
- Сортировка языков: `Intl.Collator("en")` — русский после латинских названий
- Пользователь общается **только на русском**
- Скрытые страны: `HIDDEN_COUNTRIES = ["UA"]` (в `src/lib/db.ts`)

## Структура проекта

```
src/
├── app/
│   ├── rg-page/route.ts         # Серверный рендер public/rg.html
│   ├── api/
│   │   ├── ara/content/
│   │   │   ├── version/route.ts
│   │   │   ├── places-core-columnar/route.ts    # Города для глобуса
│   │   │   ├── places-details-columnar/route.ts # Детали городов
│   │   │   ├── page/[placeId]/route.ts          # Страница города
│   │   │   ├── channel/[channelId]/route.ts     # Инфо о станции
│   │   │   ├── place-v2/[placeId]/route.ts      # Place v2
│   │   │   ├── listen/[channelId]/channel.mp3/route.ts  # Redirect на поток
│   │   │   ├── favorites/v2/route.ts            # Избранное
│   │   │   ├── search/route.ts                  # Поиск
│   │   │   ├── browse/route.ts                  # Каталог стран
│   │   │   ├── browse/[countryId]/route.ts      # Города страны
│   │   │   └── settings/
│   │   │       ├── index/route.ts               # Главная настроек
│   │   │       ├── radiozal/route.ts            # О проекте
│   │   │       ├── submit/route.ts              # Подача станции
│   │   │       ├── contact/route.ts             # Контакты
│   │   │       └── privacy-policy/route.ts      # Политика
│   │   ├── geo/route.ts            # Геолокация по IP (ip-api.com)
│   │   └── search/route.ts         # Elasticsearch-формат поиска
│   └── tiles/[...path]/route.ts    # Прокси тайлов MapTiler
├── lib/
│   ├── rg-compat.ts    # RG-совместимый слой данных (~760 строк)
│   ├── db.ts           # SQLite операции
│   ├── api.ts          # Station интерфейс (legacy, для старых компонентов)
│   └── curated.ts      # Курированные данные
├── middleware.ts        # Все страничные запросы → /rg-page
└── scripts/             # Краулеры, health-check, DB утилиты

public/
├── rg.html              # Главная HTML (модифицированная из Radio Garden)
├── assets/b/
│   ├── index-DM4_1W1y.js     # Главный бандл RG (модифицирован)
│   ├── modules-pJ8nSJVc.js   # React + библиотеки
│   ├── viewer-dMPE7Wem.js    # Viewer
│   ├── maplibre-gl-ChG2Cs0l.js  # MapLibre GL
│   ├── ru-RadioZal.js        # Русская локаль
│   ├── en-MnKurk0p.js        # Английская локаль (брендинг)
│   ├── AppPromotion-BFvbYj_w.js  # Промо (кнопки магазинов убраны)
│   ├── AppPromotion-CAhtu2O5.css # CSS промо (иконка: logo.png, белый фон)
│   └── [15 locale files, lazy chunks, CSS]
├── fonts/               # Atlas Grotesk Web (woff2/woff)
├── logo.png             # Полный логотип (глобус + наушники + текст)
├── favicon.png          # 64x64 (полный логотип)
├── app-icon.png         # 120x120 (полный логотип)
└── apple-touch-icon.png # 180x180
```

## Ключевые модификации в RG-бандлах

### index-DM4_1W1y.js
- Тайлы: `Jf="/tiles"` (было rg-tiles.b-cdn.net)
- Base URL: `rh=function(e){return"/"+e}` (было radio.garden)
- Брендинг: 47 замен "Radio Garden" → "Радио Зал"
- Локали: `ah` массив включает "ru", импорт `ru-RadioZal.js`
- Автоопределение: `ca()` вызывается с фильтром `ah.filter(l=>l!=="ru")` — русский НЕ определяется автоматически
- Сортировка языков: `Intl.Collator("en")` вместо `Intl.Collator(void 0)`

### AppPromotion-BFvbYj_w.js
- Компонент L: показывает иконку + "Радио Зал" БЕЗ текста про приложение
- Кнопки магазинов: рендер отключен

### AppPromotion-CAhtu2O5.css
- `._appIcon_1fyod_24`: background-image: url(/logo.png), background-color: #fff, background-size: 80%

## RG-совместимый API (src/lib/rg-compat.ts)

Ключевые функции:
- `getPlacesCoreColumnar()` — координаты + boost для глобуса
- `getPlacesDetailsColumnar()` — названия городов
- `getPlacePage(placeId)` — станции города + ближайшие города
- `getChannelInfo(channelId)` — информация о станции
- `searchStations(query)` — поиск
- `getBrowsePage()` — список стран
- `getSettings()` — настройки (4 секции: Радио Зал, Submit, Contact, Privacy)
- `resolveFavorites(ids)` — избранное

### ID-генерация
- Place ID: 8-char base64 от hash(`city:countrycode`)
- Channel ID: первые 8 символов `stationuuid`
- Группировка: `city + countrycode` (не координатная сетка)

## Middleware (src/middleware.ts)

Перехватывает ВСЕ запросы кроме `/api`, `/assets`, `/fonts`, `/tiles`, `/_next`, статических файлов. Делает `NextResponse.rewrite()` на `/rg-page`.

## Переменные окружения (.env.local)

```
NEXT_PUBLIC_MAPTILER_KEY=ваш_ключ_maptiler
```

## Команды

```bash
npm run dev          # Dev-сервер (localhost:3000)
npm run build        # Production build
npm run db:init      # Инициализация схемы БД
npm run db:crawl     # Краулинг RadioBrowser API
npm run db:check     # Health-check станций
npm run db:setup     # init + crawl + check
```

## Геолокация

- По IP через `/api/geo` (ip-api.com, без ключа, 45 req/min)
- Фоллбэк: Москва (55.75, 37.62)
- Никакого `navigator.geolocation`

## Генерация иконок (scripts/resize-icons.js)

- Источник: `public/logo.png` (полный логотип, НЕ обрезать)
- Trim белых полей → fit в квадрат с прозрачным фоном
- Размеры: 32, 64, 120, 180, 192

## Домен и деплой

- **Домен**: radiozal.ru (reg.ru)
- **VPS**: Timeweb Cloud, Москва (пока не оплачен)
- **БД**: SQLite файл `data/radio.db`

## TODO (следующие этапы)

- [ ] Админ-панель для модерации станций (/admin с авторизацией)
- [ ] Форма подачи станций (Settings > Submit — сейчас просто текст с email)
- [ ] Курируемый каталог (ручное добавление, НЕ парсинг. Radio Garden тоже не парсит)
- [ ] Миграция на PostgreSQL
- [ ] Деплой: Docker + Nginx + HTTPS (Let's Encrypt)
- [ ] Замена иностранных соцсетей в Share на VK, Telegram, OK

## Технические предупреждения

- Исходные файлы используют CRLF (`\r\n`)
- При правке JS-бандлов скриптами Node.js: использовать отдельные .js файлы (PowerShell ломает экранирование)
- `replace_string_in_file` работает с кириллицей если контекст точный
- RG фронтенд кэширует язык в IndexedDB — при проблемах с языком очистить: `indexedDB.databases().then(dbs => dbs.forEach(db => indexedDB.deleteDatabase(db.name)))`
