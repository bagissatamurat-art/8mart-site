// Формы объектов = контракт API (design_handoff_8mart_site/README.md → «API-контракт»).

export type DeliveryKind = 'express' | 'cargo' | 'flowers';
export type Method = 'delivery' | 'pickup';
export type ShipmentKind = 'courier' | 'cargo';

export interface Variant { id: string; size: string; price: number; img?: string }

/** Видео товара — вертикальный ролик, уже обработанный сервером. src — со звуком (H.264 + AAC, до 720×1280),
 *  preview — беззвучные первые 6 с для миниатюры, poster — первый кадр. duration — секунды. */
export interface ProductVideo { src: string; preview: string; poster: string; width: number; height: number; duration: number }

export interface DeliveryInfo { when: string; price: string; note: string }
export interface PickupInfo { when: string; where: string; note: string }
export interface DeliveryType { tag: string; delivery: DeliveryInfo; pickup: PickupInfo }
export interface ProductConditions { tag?: string; delivery?: Partial<DeliveryInfo>; pickup?: Partial<PickupInfo> }

export interface Product {
  id: string;
  name: string;
  weight: string;
  pack?: string;
  price: number | null;
  oldPrice?: number;
  badge?: string;
  cat: string;
  img?: string;
  images?: string[];
  bonus?: number;
  delivery?: DeliveryKind;
  weightKg: number;
  group?: string;
  variants?: Variant[];
  sizes?: string[];
  colors?: string[];
  colorNote?: string;
  conditions?: ProductConditions;
  /** Видео товара (GET /products, /products/{id}); нет — null (в моке поля нет). Миниатюра поверх галереи и плеер на весь экран. */
  video?: ProductVideo | null;
  /** Средняя оценка и число опубликованных отзывов (любой ответ каталога). Нет отзывов — поля нет: ни звёзд, ни кнопки «Отзывы». */
  rating?: ReviewSummary;
}

// ── Отзывы о товарах (04.11): оставляет только покупатель, получивший товар; на сайте — только опубликованные ──

/** test — среди отзывов есть тестовые (проверка сайта): в разметку поисковиков не отдаём. */
export interface ReviewSummary { avg: number; count: number; test?: true }
/** Фото отзыва: src — большое (просмотр), thumb — миниатюра 320, blur — размытое превью, пока грузится. */
export interface ReviewPhoto { src: string; thumb: string; blur?: string; width: number; height: number }
/** Ответ магазина под отзывом; date — «3 ноября» (с годом, если не этот). */
export interface ReviewReply { text: string; date: string }
/** Опубликованный отзыв. author — «Айгерим К.» или «Покупатель» (телефона нет никогда); text пустой — только оценка. */
export interface Review {
  id: string; author: string; rating: number; text: string; photos: ReviewPhoto[];
  date: string; createdAt: string;
  /** Какой размер купили: «M», «S, L». */
  variant?: string;
  reply?: ReviewReply;
  /** Тестовый отзыв (проверка сайта): автор «Тестовый отзыв», в разметку поисковиков не идёт. */
  test?: true;
}
/** GET /products/{id}/reviews?page — страница отзывов (с текстом и фото выше); ещё есть, пока загружено меньше rating.count. */
export interface ProductReviews { rating: ReviewSummary | null; items: Review[] }
export type ReviewStatus = 'pending' | 'published' | 'rejected';
/** Свой отзыв покупателя: на проверке, опубликован или нет (с причиной). */
export interface MyReview {
  id: string; rating: number; text: string; photos: ReviewPhoto[]; status: ReviewStatus; date: string;
  rejectReason?: string; reply?: ReviewReply;
}
/** Полученный товар заказа (Order.reviews): review = null — ещё не оценён. */
export interface OrderReviewItem { product: string; name: string; img?: string; delivery?: DeliveryKind; review: MyReview | null }
/** POST /orders/{id}/reviews — форма отзыва (multipart). photos — уже уменьшенные на телефоне. */
export interface ReviewDraft { product: string; rating: number; text: string; photos: Blob[] }

/** GET /products/{id} */
export interface ProductDetail extends Product {
  description: string;
  specs: [string, string][];
  images: string[];
}

/** Позиция корзины, развёрнутая из ключа `<id>` или `<variantId>|<цвет>` (cartItem). */
export interface CartProduct extends Product { variant?: string; color?: string }

export interface Category { slug: string; name: string; img: string; sub: { slug: string; name: string }[] }
export interface City { id: string; name: string; lat: number; lng: number }
export interface PickupPoint {
  id: string; city: string;
  /** Адрес для списка: «пр. Абылай хана, 32». */
  name: string;
  /** График («Ежедневно 09:00–22:00») — если известен; статус «Открыто до …» считается по нему. */
  hours?: string;
  lat: number; lng: number; acceptsCargo?: boolean;
  /** Живой статус филиала из API: открыт сейчас / принимает заказы. */
  isOpen?: boolean; acceptingOrders?: boolean;
  /** Вывеска, если не 8MART (например, ROMANTIC). */
  brand?: string;
  /** Kaspi Pay подключён автоматически (иначе — счёт в Kaspi). */
  kaspiIntegrated?: boolean;
}

export interface StoryCta { label: string; href?: string; copy?: string }
export interface StorySlide {
  img: string; title: string; text: string; cta?: StoryCta;
  /** Видео (сторис 8mart.kz) — img тогда его обложка; title/text пустые: текст уже в видео. */
  video?: string;
  /** Длительность видео, с (из API) — пока видео не загрузилось. */
  duration?: number;
}
export interface Story {
  id: string; title: string; cover: string; slides: StorySlide[];
  /** Товар сторис (GET /stories): в просмотре снизу — блок товара с «В корзину», избранным и «Поделиться». */
  product?: Product;
}
export interface Banner { img: string; title: string; text: string; /** Подпись на mobile (в макете короче) */ textShort?: string; cta: string; href: string }

export type OrderStatus = 'accepted' | 'assembling' | 'onway' | 'ready' | 'done' | 'cancelled';
export interface OrderShipment {
  kind: ShipmentKind; status: OrderStatus; eta?: string;
  // ── Сверх README (нужно статусной странице 03): ──
  /** Время этапов по порядку шкалы (Принят, Собираем, В пути / Готов, Доставлен / Выдан). */
  times?: string[];
  /** Курьер / водитель, когда отправление в пути. */
  courier?: { name: string; phone: string };
  /** Самовывоз: до какого срока храним, когда готово к выдаче. */
  until?: string;
}
/** Позиция заказа. name, price, img, delivery — снимок на момент заказа (бэкенд); в моке их нет — берём из каталога. */
export interface OrderItem { id: string; qty: number; name?: string; price?: number; img?: string; delivery?: Product['delivery'] }
export interface Order {
  id: string; date: string; method: Method; status: OrderStatus; address: string; eta?: string;
  payment: 'kaspi' | 'card'; promo?: string; items: OrderItem[];
  shipments: OrderShipment[]; total: number; bonus: number;
  // ── Сверх README (итоги и получатель на статусной странице 03): ──
  recipient?: { name: string; phone: string };
  /** Курьер оставит у двери. */
  leaveAtDoor?: boolean;
  /** Счёт Kaspi выставлен на этот номер. */
  kaspiPhone?: string;
  goods?: number; discount?: number; promoPct?: number;
  /** Строки стоимости по отправлениям + подъём на этаж. */
  fees?: { label: string; amount: number }[];
  /** Списано бонусов. */
  spend?: number;
  // ── Оплата (бэкенд): пока unpaid — ждём оплату до payUntil; Kaspi счётом — invoiceIssued, когда оператор выставил счёт. ──
  payState?: 'unpaid' | 'paid' | 'refunded';
  payUntil?: string | null;
  invoiceIssued?: boolean;
  /** Счёт ещё не выставлен — к какому времени выставим (ночью — после открытия филиала). */
  invoiceBy?: string | null;
  /** Полученные товары (их отправление выполнено) и свои отзывы о них — блок «Оцените букет». Нет поля — оценивать нечего. */
  reviews?: OrderReviewItem[];
}

/** POST /orders — тело запроса. */
export interface OrderDraft {
  cart: Record<string, number>; method: Method; city: string; address: string; pickupPointId: string | null;
  /** Точка адреса доставки: по ней сервер выбирает зону, филиал и тариф. */
  lat?: number; lng?: number;
  entrance?: string; floor?: string; flat?: string; comment?: string;
  /** Получатель: телефон — из профиля (можно поменять), имя — из профиля, может быть пустым. */
  recipient: { name: string; phone: string };
  /** Доставка: курьер оставит у двери. */
  leaveAtDoor?: boolean;
  /** Kaspi Pay счётом: номер, на который выставить счёт в Kaspi. */
  kaspiPhone?: string;
  /** Слоты — id из GET /delivery/slots: 'asap' или «YYYY-MM-DD|09:00–12:00». */
  together: boolean; courierSlot: string; cargoSlot: string; lift: boolean;
  /** Курьер по зоне адреса (мок; в проде сервер считает сам по координатам). */
  courierFee?: number; courierEta?: number;
  promo?: string; useBonus: boolean; payment: 'kaspi' | 'card'; cardId?: string | null;
}

export interface User { id: string; name: string; phone: string; since: string }
export interface Address { id: string; title: string; street: string; city: string; entrance: string; floor: string; flat: string; isDefault: boolean }
export interface Card { id: string; brand: string; last4: string; exp: string; isDefault: boolean }
export interface UserPromo { code: string; title: string; cond: string; until: string; status: 'active' | 'used' | 'expired' }
export interface BonusHistoryItem { id: string; title: string; date: string; amount: number }
export interface Bonus { balance: number; maxPart: number; history: BonusHistoryItem[] }

export type PromoError = 'notFound' | 'expired' | 'minSum';
export type PromoCheck = { ok: true; pct: number } | { ok?: false; error: PromoError; minSum?: number };

export type SortId = 'popular' | 'cheap' | 'expensive' | 'sale' | 'bonus';
export interface ProductQuery {
  category?: string; sub?: string; q?: string; sort?: SortId; page?: number;
  min?: number; max?: number; sale?: boolean; inStock?: boolean;
  /** Фильтры по атрибутам (CAT_FILTERS): ключ — key группы (packs, colors), значения — attr товара */
  attrs?: Record<string, string[]>;
}
