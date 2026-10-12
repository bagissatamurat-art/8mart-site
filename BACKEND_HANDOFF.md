# 8mart — передача бэкенду

Фронт сайта (этот репозиторий) и приложения (`bagissatamurat-art/8mart`, Flutter) готовы на моках. Документ — для бэкенд-разработчика и его ИИ-агента: что фронт ждёт от API, где сейчас мок или временный адаптер и как их заменить, не трогая экраны.

**Граница:** фронт показывает данные и считает только предварительно (итоги корзины, отправления, статус «открыто/закрыто»). Источник правды — бэкенд: цены, наличие, тарифы, зоны, итоги заказа, бонусы, статусы.

---

## 1. Как устроен слой данных

- **Единственный шов — `lib/api.ts`.** Каждая функция — один эндпоинт, её JSDoc содержит метод и путь (`/** GET /products?… */`). Экраны не делают `fetch` сами.
- **Формы ответов — `lib/types.ts`.** Мок в `lib/mock.ts` уже в этой форме. Чтобы подключить бэкенд, замените тело функции на `fetch(\`${API_URL}/…\`)` и верните тот же тип.
- **Ошибки — `ApiError(status, message)`.** Экраны различают 404 (страница «не найдено») и 409 (корзина изменилась). Остальное показывают как сбой.
- **Задержка мока** (`reply()`, 250 мс в браузере, 0 на сервере) нужна только чтобы были видны скелетоны. С настоящим API её убрать.

В приложении то же самое: контракт — в `README.md` (таблица «API-контракт»), модели — `lib/domain/models.dart`, мок — `lib/data/mock_data.dart`. Формы совпадают с сайтом.

---

## 2. Эндпоинты

Типы — из `lib/types.ts` сайта. **Мок** — данные из `lib/mock.ts`. **Адаптер** — временный прокси к публичному API 8mart.kz или к DaData (см. раздел 3).

### Каталог

| Функция | Запрос | Ответ | Сейчас |
|---|---|---|---|
| `getCategories` | `GET /categories` | `Category[]` (с `sub[]`) | мок |
| `getProducts` | `GET /products?category&sub&q&sort&page&min&max&sale&inStock&<attr>` | `{items: Product[], total}`, страница 8 (`PAGE_SIZE`) | мок |
| `getFacets` | `GET /products/facets?category&sub` | `{key, title, items: [value, count][]}[]` | мок |
| `getProduct` | `GET /products/{id}` | `ProductDetail` (+ `description`, `specs`, `images`, `conditions`); нет — 404 | мок |
| `getAllProductIds` | `GET /products/ids` | `string[]` — для статической сборки и sitemap | мок |
| `getProductsByIds` | `GET /products?ids=…` | `Product[]` — избранное | мок |
| `getGroup` | `GET /products?group=…` | `Product[]` — переключатель фасовок | мок |
| `searchSuggest` | `GET /search/suggest?q` | `{categories, products, total}` | мок |
| `getStories` | `GET /stories` | `Story[]` | адаптер (видео 8mart.kz) + мок |
| `getBanners` | `GET /banners` | `Banner[]` | мок |

Цветы — один товар с `variants[]` (S/M/L: свой `id`, цена, фото). Ключ позиции в корзине — `id` варианта. Цены — самая частая цена по филиалам (`scripts/import-flowers.mjs`). Если цены в филиалах разные, бэкенд должен отдавать цену выбранного филиала.

### Корзина и доставка

| Функция | Запрос | Ответ | Сейчас |
|---|---|---|---|
| `validateCart` | `POST /cart/validate {cart, method, together, …}` | `{lines: [{id, qty, soldOut, price}], plan}` — сервер пересчитывает цены, наличие и отправления | мок |
| `getUpsell` | `GET /cart/upsell?ids=…` | `Product[]` — «Не забыть» (открытка, шары) | мок |
| `getCities` | `GET /cities` | `City[]` | мок (5 городов из филиалов) |
| `getPickupPoints` | `GET /pickup-points?city` | `PickupPoint[]` (+ `isOpen`, `acceptingOrders`, `brand`, `kaspiIntegrated`, `hours?`) | адаптер `/api/branches` |
| `geoSuggest` | `GET /geo/suggest?q&city` | `GeoSuggestion[]` (`hasHouse`, `lat/lng`) | адаптер DaData |
| `geoReverse` | `GET /geo/reverse?lat&lng` | `{address, city, hasHouse}` | адаптер DaData |
| `quoteDelivery` | `GET /delivery/quote?lat&lng` | `{status:'ok', quote:{fee, eta, branchId, branchName, zone, kaspiIntegrated}}` / `{status:'outside'}` / `{status:'unavailable'}` | адаптер зон 8mart.kz |
| `getDeliverySlots` | `GET /delivery/slots?kind=courier\|cargo` | `SlotDay[]`: `{id: 'YYYY-MM-DD', slots: [{id, label, sub?}]}`; `id` слота — `asap` или `YYYY-MM-DD\|09:00–12:00` | мок (`lib/domain/slots.ts`) |
| `checkPromo` | `POST /promo/check {code, goodsTotal}` | `{ok, pct}` / `{error: 'notFound'\|'expired'\|'minSum', minSum?}` | мок |

**Правила отправлений** (`lib/domain/shipments.ts`, повторить на бэкенде):
- товары `delivery: 'cargo'` везёт грузовой на следующий день, тариф по весу; остальное везёт курьер сегодня;
- в доставке смешанная корзина всегда едет двумя доставками;
- в самовывозе можно выбрать «в два приёма» или «всё завтра со склада»;
- бесплатная доставка от порога действует только для курьера;
- подъём на этаж — `liftFee × шт × (этаж − 1)`.

### Вход

| Функция | Запрос | Ответ |
|---|---|---|
| `authCode` | `POST /auth/code {phone, channel: 'whatsapp'}` | `{ok}` |
| `authVerify` | `POST /auth/verify {phone, code}` | `{accessToken, refreshToken, user: {name?}}` |
| `authTg` | `POST /auth/tg` | `{token}` → ссылка `t.me/<bot>?start=<token>` |
| `authTgStatus` | `GET /auth/tg/{token}` (поллинг каждые 2 с) | `{status: 'pending'\|'ok', phone?, tokens?}` |

Шага «имя» после входа нет: имя по желанию в профиле (`PATCH /me`). Сейчас всё в моке, код — `1234`.

### Заказы

| Функция | Запрос | Ответ |
|---|---|---|
| `createOrder` | `POST /orders` — тело `OrderDraft` | `{id, payUrl?}`; `payUrl` — ссылка Kaspi или страница платёжного шлюза |
| `getOrders` | `GET /orders` | `Order[]` |
| `getOrder` | `GET /orders/{id}` | `Order` — своя шкала статусов у каждого отправления |
| `cancelOrder` | `POST /orders/{id}/cancel` | `{refund: {amount, to}, bonusReturned}` — пока ни одно отправление не передано в доставку |

**Поля `OrderDraft`, о которых легко забыть:**
- `recipient.phone` — телефон получателя;
- `leaveAtDoor`;
- `kaspiPhone` — номер для счёта в Kaspi, только если филиал не `kaspiIntegrated`;
- `courierSlot` и `cargoSlot` — id слотов;
- `lift` и `floor`;
- `promo` и `useBonus`;
- `payment: 'kaspi' | 'card'` и `cardId`.

Итог заказа сервер считает сам, суммы с фронта не доверять.

### Кабинет

| Функция | Запрос | Ответ |
|---|---|---|
| `getMe` / `updateMe` | `GET /me` / `PATCH /me {name}` | `User` |
| `changePhone` / `verifyPhone` | `POST /me/phone {phone}` → `POST /me/phone/verify {phone, code}` | `User` |
| `deleteMe` | `DELETE /me` | `{ok}` |
| `getAddresses` / `createAddress` / `updateAddress` / `deleteAddress` | `GET/POST/PUT/DELETE /me/addresses[/{id}]` | `Address` |
| `getCards` / `deleteCard` | `GET /me/cards`, `DELETE /me/cards/{id}` | `Card[]` — только маска и токен шлюза |
| `getUserPromos` | `GET /me/promos` | `UserPromo[]` |
| `getBonus` | `GET /me/bonus` | `{balance, maxPart, history[]}` — 1 бонус = 1 тг, не сгорают |
| `getFavorites` / `putFavorites` | `GET/PUT /favorites` | `string[]`; у гостя избранное хранится в localStorage и при входе объединяется с серверным |

Только в приложении есть ещё эндпоинты:
- `POST /devices {fcmToken, platform}` — push-уведомления;
- `PUT /me/notifications`;
- `GET /app/config` — минимальная версия приложения и ссылки на документы.

---

## 3. Временные адаптеры — заменить

| Где | Что делает | Чем заменить |
|---|---|---|
| `app/api/branches/route.ts` (+ `lib/branches.ts`, `lib/branches.snapshot.json`) | Филиалы из `dukenfy-api.8mart.kz/api/v1/public/branches`, кэш 60 с; если API недоступен, отдаёт снимок | `GET /pickup-points?city` |
| `app/api/delivery/quote/route.ts` (+ `lib/delivery.ts`) | Зоны из `…/public/branches/resolve-delivery?lat&lng`, кэш 5 мин | `GET /delivery/quote?lat&lng` |
| `lib/stories.ts` | Сторис из `…/public/stories`, кэш 5 мин | `GET /stories` |
| `app/api/geo/*` (+ `geo.server.ts`) | DaData suggest и geolocate; ключ только на сервере | `GET /geo/suggest`, `GET /geo/reverse` |
| `scripts/import-flowers.mjs` → `lib/flowers.ts`, `scripts/import-branches.mjs` | Выгружают каталог цветов и филиалы в мок | не нужны, когда будет `/products` |

В приложении:
- `lib/data/delivery_repository.dart`, `story_repository.dart`, `geo_repository.dart` — те же адаптеры;
- `tool/import_site_data.dart` — генератор мока.

---

## 4. Состояние в браузере (localStorage)

| Ключ | Что хранит | Синхронизировать с сервером |
|---|---|---|
| `8mart.cart` | позиции `{key: qty}`, `together`, промокод | да, через `POST /cart/validate` перед оформлением |
| `8mart.method` | способ получения, город, адрес, координаты, точка, `quote` (зона) | нет, но при оформлении сервер проверяет зону сам |
| `8mart.auth` | пользователь и `accessToken` (мок) | в проде токен в httpOnly cookie, refresh на сервере |
| `8mart.favorites` | id избранного у гостя | при входе объединить с `GET /favorites` |
| `8mart.storiesSeen`, `8mart.recentSearches`, `8mart.methodAutoShown` | интерфейс | нет |

---

## 5. Оплата

- **Kaspi Pay.** Если в филиале Kaspi подключён автоматически (`kaspiIntegrated`), `createOrder` возвращает `payUrl`, и фронт переходит по нему. Если нет, в заказе есть `kaspiPhone`, и бэкенд выставляет счёт на этот номер.
- **Карта.** Сохранённые карты — это токены шлюза, фронт видит только маску. Новая карта — переход на страницу шлюза по `payUrl`. Возврат: на сайте `/order/{id}`, в приложении `8mart.kz/pay/return?order=`.

---

## 6. Переменные окружения (сайт)

| Переменная | Где | Зачем |
|---|---|---|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | браузер | карта (публичный `pk.*`, ограничить доменами) |
| `MAPBOX_TOKEN` | сервер | обратный геокодинг Mapbox, запасной вариант |
| `DADATA_API_KEY`, `DADATA_SECRET` | сервер | подсказки адресов |
| `NEXT_PUBLIC_SITE_URL` | сборка | canonical, sitemap, Open Graph |
| `NEXT_PUBLIC_BASE_PATH` | сборка | если сайт открывается не с корня домена |

Образец — `.env.example`. Ключи в репозиторий не коммитить.

---

## 7. Открытые вопросы (к бизнесу и бэкенду)

1. **Порог бесплатной доставки.** Сейчас 20 000 тг — это мок, в API зон доставки порога нет. Есть ли он вообще?
2. **Зоны доставки.** Покрывают только часть Астаны. Так и задумано?
3. **Тарифы грузового.** Сейчас 3 000 тг до 300 кг, 5 000 до 1 т, 7 000 до 1,5 т — мок. Что свыше 1,5 т?
4. **Слоты доставки и часы работы филиалов.** В API их нет; в моке интервалы 09–21 на 3 дня.
5. **Цены по филиалам.** Сейчас они одинаковые. Если станут разными, кто выбирает филиал для цены: город, адрес или зона?
6. **Kaspi.** Партнёрский API или ссылка/QR? Какой URL возврата?
7. **Платёжный шлюз для карт** и токенизация.
8. **Бонусы.** Правила начисления и `maxPart` (30 %) — мок.
9. **Документы.** Политика конфиденциальности и оферта — нужны ссылки, без них приложение не опубликовать в сторах.
