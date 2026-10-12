# 8mart — сайт

Интернет-магазин 8mart (цветы, подарки, товары для дома с доставкой и самовывозом). Фронт готов и работает на моках; бэкенд подключается через одну точку — `lib/api.ts`.

- Прод (превью): https://8mart-site.vercel.app — деплой на Vercel при пуше в `main`.
- Приложение (Flutter): https://github.com/bagissatamurat-art/8mart — тот же API-контракт.

## Запуск

```bash
npm install
cp .env.example .env.local   # ключи вписать в .env.local, не в репозиторий
npm run dev                  # http://localhost:3000
```

Без `.env.local` сайт тоже работает: всё на моке, нет только подсказок адресов (DaData) и карты (Mapbox).

| Скрипт | Что делает |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | vitest — домен, сторы, переключатель API, паритет с прототипом |
| `npm run import:catalog` | временно: выгрузить цветы и филиалы 8mart.kz в мок (+ `import:blur`) |

Перед коммитом: `npm run typecheck && npm test && npm run build`.

## Стек

Next.js 16 (App Router, Turbopack), React 19, TypeScript, CSS Modules, Zustand, vitest. Шрифт Onest локально (`public/fonts`).

## Структура

```
app/                     страницы (App Router) и route handlers
  api/                   TEMP-ADAPTER: прокси к 8mart.kz и DaData — заменятся бэкендом
  kit/                   витрина компонентов (/kit)
components/              Mart* — UI-кит; site/, checkout/, account/ … — блоки экранов
lib/
  api.ts                 ЕДИНСТВЕННАЯ точка доступа к данным (мок или API)
  http.ts                apiFetch, ApiError, переключатель мок / API
  types.ts               формы ответов API — контракт
  mock.ts                мок в форме контракта
  config.ts              тарифы, пороги, лимиты — одно место
  copy.ts                тексты интерфейса
  domain/                чистая логика: отправления, итоги, слоты, форматирование
  store/                 Zustand: корзина, способ получения, вход, избранное (localStorage)
  seo.ts                 метаданные, микроразметка
proxy.ts                 мобильная вёрстка товара по User-Agent
design_handoff_8mart_site/  дизайн-пакет: правила, токены, HTML-макеты
```

## Подключение бэкенда

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.8mart.kz/v1
NEXT_PUBLIC_API_MOCK=getOrders,getBonus   # что ещё не готово на бэкенде — остаётся на моке
```

Пути, формы ответов, временные адаптеры, localStorage, оплата и открытые вопросы — в **[BACKEND_HANDOFF.md](BACKEND_HANDOFF.md)**.

## Документы

| Файл | Для чего |
|---|---|
| [BACKEND_HANDOFF.md](BACKEND_HANDOFF.md) | контракт API и план подключения бэкенда |
| [AGENTS.md](AGENTS.md) | правила для ИИ-агента, который будет соединять фронт и бэк |
| [design_handoff_8mart_site/DESIGN_RULES.md](design_handoff_8mart_site/DESIGN_RULES.md) | продуктовые правила — не менять без согласования |
| [design_handoff_8mart_site/COMPONENTS.md](design_handoff_8mart_site/COMPONENTS.md), `tokens.css` | компоненты, размеры, цвета |
| [DESIGN_NOTES.md](DESIGN_NOTES.md) | где реализация расходится с макетом и почему |
| [CLAUDE.md](CLAUDE.md) | правила вёрстки для Claude Code |
