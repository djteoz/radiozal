# Радио Зал — radiozal.ru

Агрегатор интернет-радиостанций с интерактивным 3D-глобусом в стиле [Radio Garden](https://radio.garden).

Вращайте глобус, выбирайте город и слушайте радио со всего мира.

![Радио Зал](public/logo.png)

## Стек

- **Next.js 16** (App Router)
- **TypeScript 5** (strict)
- **MapLibre GL v5** — 3D-глобус (projection: globe, MapTiler satellite tiles)
- **SQLite** (better-sqlite3) — база станций
- **Atlas Grotesk** — шрифт (как в Radio Garden)
- **Lingui** — i18n (16 языков, включая русский)

## Статистика базы

| Метрика | Значение |
|---------|----------|
| Всего станций | 43 960 |
| Проверенных (online) | 7 585 |
| Городов | 542 |
| Стран | 182 |

## Быстрый старт

```bash
# Установка зависимостей
npm install

# Инициализация БД (если нет data/radio.db)
npm run db:setup

# Dev-сервер
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

### Переменные окружения

Создайте `.env.local`:

```env
NEXT_PUBLIC_MAPTILER_KEY=your_maptiler_api_key
```

## Архитектура

### Frontend
Radio Garden-совместимый фронтенд (JS-бандлы, CSS, шрифты) в `public/assets/b/` и `public/fonts/`. Middleware перенаправляет все страничные запросы на `rg.html`.

### Backend API
11+ эндпоинтов в формате Radio Garden API:

| Эндпоинт | Описание |
|----------|----------|
| `/api/ara/content/places-core-columnar` | Города для глобуса (координаты + размер) |
| `/api/ara/content/places-details-columnar` | Детали городов (названия) |
| `/api/ara/content/page/{placeId}` | Страница города (станции + ближайшие) |
| `/api/ara/content/channel/{channelId}` | Информация о станции |
| `/api/ara/content/listen/{channelId}/channel.mp3` | Redirect на поток |
| `/api/ara/content/search` | Поиск станций |
| `/api/ara/content/browse` | Каталог стран |
| `/api/ara/content/settings/*` | Настройки, About, Contact, Privacy |
| `/api/geo` | Геолокация по IP (ip-api.com) |
| `/tiles/...` | Прокси тайлов MapTiler |

### Данные
- SQLite: `data/radio.db`
- Источники: RadioBrowser API, FMSTREAM, StreamURL
- Группировка по городам: `city + countrycode`
- ID мест: 8-char base64 hash от `city:countrycode`
- ID каналов: первые 8 символов `stationuuid`

## Команды

```bash
npm run dev          # Dev-сервер (localhost:3000)
npm run build        # Production build
npm run db:init      # Инициализация схемы БД
npm run db:crawl     # Краулинг RadioBrowser API
npm run db:check     # Health-check станций
npm run db:setup     # init + crawl + check
```

## Структура проекта

```
src/
├── app/
│   ├── api/ara/content/   # RG-совместимые API эндпоинты
│   ├── api/geo/           # Геолокация по IP
│   ├── api/search/        # Поиск (Elasticsearch формат)
│   ├── tiles/             # Прокси тайлов MapTiler
│   └── rg-page/           # Серверный рендер rg.html
├── lib/
│   ├── rg-compat.ts       # RG-совместимый слой данных
│   └── db.ts              # SQLite операции
├── middleware.ts           # Перенаправление на rg.html
└── scripts/               # Краулеры, health-check, DB утилиты
public/
├── rg.html                # Главная HTML-страница
├── assets/b/              # JS/CSS бандлы (модифицированные)
├── fonts/                 # Atlas Grotesk Web
├── logo.png               # Логотип
└── favicon.png            # Фавикон
```

## TODO (следующие этапы)

- [ ] Админ-панель для модерации станций
- [ ] Форма подачи станций (Settings > Submit)
- [ ] Курируемый каталог (ручное добавление вместо парсинга)
- [ ] Миграция на PostgreSQL
- [ ] Деплой на VPS (Timeweb Cloud, Ubuntu 24.04)
- [ ] Docker + Nginx + HTTPS (Let's Encrypt)
- [ ] Замена иностранных соцсетей в Share на российские (VK, Telegram)

## Домен

**radiozal.ru** (reg.ru)

## Лицензия

Приватный проект.
