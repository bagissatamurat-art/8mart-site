// 8mart — мок данных. Формы объектов = контракт API (README → «API-контракт»). Доступ — только через lib/api.ts.
// Цветы (основной товар) — настоящий каталог 8mart.kz: lib/flowers.ts, генерирует scripts/import-flowers.mjs
// (размеры S/M/L — варианты одного букета, цены филиала в Астане, состав по размерам).
// Стройматериалы, инструменты, дом, подарки — прототип из design_handoff_8mart_site/site/data.js (цены, бонусы, вес — МОК).
import { BONUS_RULES, DELIVERY, PROMO } from './config';
import { groupDigits } from './domain/format';
import { BASE_PATH as A } from './basePath';
import { bonusFor, cartItem } from './domain/catalog';
import { orderTotals } from './domain/order';
import { FLOWERS } from './flowers';
import { SNAPSHOT_CITIES, SNAPSHOT_POINTS } from './branches';
import type {
  Address, Banner, Bonus, Card, Category, City, Order, PickupPoint, Product, Story, User, UserPromo,
} from './types';

// Города и точки самовывоза — настоящие филиалы 8mart.kz (lib/branches.ts; снимок — scripts/import-branches.mjs).
// В браузере getPickupPoints берёт живые статусы через /api/branches; снимок — запасной вариант.
export const CITIES: City[] = SNAPSHOT_CITIES;
export const PICKUP_POINTS: PickupPoint[] = SNAPSHOT_POINTS;

export const CATEGORIES: Category[] = [
  { slug: 'tsvety', name: 'Цветы', img: `${A}/assets/cat-flowers.png`, sub: [ { slug: 'gortenzii', name: 'Гортензии' }, { slug: 'rozy', name: 'Розы' }, { slug: 'hrizantemy', name: 'Хризантемы' } ] },
  { slug: 'stroymaterialy', name: 'Стройматериалы', img: `${A}/assets/cat-build.png`, sub: [
    { slug: 'sukhie-smesi', name: 'Сухие смеси' }, { slug: 'kirpich-i-bloki', name: 'Кирпич и блоки' }, { slug: 'gipsokarton', name: 'Гипсокартон' },
    { slug: 'kraski', name: 'Краски' }, { slug: 'uteplitel', name: 'Утеплитель' }, { slug: 'plitka', name: 'Плитка' }, { slug: 'germetiki', name: 'Герметики и пена' } ] },
  { slug: 'instrumenty', name: 'Инструменты', img: `${A}/assets/cat-tools.png`, sub: [ { slug: 'ruchnoy', name: 'Ручной инструмент' }, { slug: 'elektro', name: 'Электроинструмент' }, { slug: 'krepezh', name: 'Крепёж' } ] },
  { slug: 'dlya-doma', name: 'Для дома', img: `${A}/assets/cat-home.png`, sub: [ { slug: 'hoztovary', name: 'Хозтовары' }, { slug: 'svet', name: 'Освещение' }, { slug: 'santehnika', name: 'Сантехника' } ] },
  { slug: 'podarki', name: 'Подарки', img: `${A}/assets/cat-goods.png`, sub: [ { slug: 'upakovka', name: 'Упаковка' }, { slug: 'otkrytki', name: 'Открытки' }, { slug: 'shary', name: 'Шары' } ] },
];

/** Цветы — из каталога 8mart.kz (lib/flowers.ts, scripts/import-flowers.mjs); основной товар — первыми. Стройка — прототип. */
export const PRODUCTS: Product[] = [
  ...FLOWERS,
  {id: "b1", name: "Цемент М400, 50 кг", weight: "50 кг", price: 2890, oldPrice: 3290, badge: "Товар дня", cat: "sukhie-smesi", img: `${A}/assets/b-cement.png`, bonus: 87, pack: "50 кг", delivery: "cargo", group: "m400", weightKg: 50},
  {id: "b8", name: "Цемент М500 Д0, 50 кг", weight: "50 кг", price: 3190, cat: "sukhie-smesi", img: `${A}/assets/b-cement.png`, bonus: 64, pack: "50 кг", delivery: "cargo", weightKg: 50},
  {id: "b9", name: "Цемент М400, 25 кг", weight: "25 кг", price: 1590, oldPrice: 1790, cat: "sukhie-smesi", img: `${A}/assets/b-cement.png`, pack: "25 кг", delivery: "express", group: "m400", weightKg: 25},
  {id: "b10", name: "Цементно-песчаная смесь М150, 25 кг", weight: "25 кг", price: 1290, cat: "sukhie-smesi", img: `${A}/assets/b-glue.png`, pack: "25 кг", delivery: "express", weightKg: 25},
  {id: "b11", name: "Штукатурка гипсовая, 30 кг", weight: "30 кг", price: 2890, cat: "sukhie-smesi", img: `${A}/assets/b-glue.png`, bonus: 58, pack: "30 кг", delivery: "cargo", weightKg: 30},
  {id: "b12", name: "Краска фасадная белая, 10 л", weight: "10 л", price: 14900, cat: "kraski", img: `${A}/assets/b-paint.png`, bonus: 450, pack: "10 л", delivery: "express", colors: ["Белый","Светло-серый"], colorNote: "Колеровка бесплатно, 15 минут", weightKg: 14},
  {id: "b2", name: "Кирпич керамический рядовой М150", weight: "1 шт", price: 145, cat: "kirpich-i-bloki", img: `${A}/assets/b-brick.png`, pack: "1 шт", delivery: "cargo", weightKg: 2.5},
  {id: "b3", name: "Гипсокартон стеновой 12,5 мм, 2500×1200", weight: "1 лист", price: 3490, oldPrice: 3890, cat: "gipsokarton", img: `${A}/assets/b-drywall.png`, bonus: 70, pack: "1 лист", delivery: "cargo", weightKg: 25},
  {id: "b4", name: "Краска интерьерная белая, 10 л", weight: "10 л", price: 12900, oldPrice: 14500, badge: "Хит", cat: "kraski", img: `${A}/assets/b-paint.png`, bonus: 390, pack: "10 л", delivery: "express", colors: ["Белый","Слоновая кость","Светло-серый","Бежевый"], colorNote: "Колеровка бесплатно, 15 минут", weightKg: 14},
  {id: "b5", name: "Утеплитель минеральная вата, 50 мм, рулон", weight: "12 м²", price: 8400, cat: "uteplitel", img: `${A}/assets/b-wool.png`, bonus: 250, pack: "12 м²", delivery: "cargo", conditions: {tag: "Габаритный товар", delivery: {note: "Рулоны объёмные — до 10 шт помещаются в легковую машину, больше — грузовой"}}, weightKg: 10},
  {id: "b6", name: "Клей для плитки, 25 кг", weight: "25 кг", price: 2190, oldPrice: 2490, cat: "sukhie-smesi", img: `${A}/assets/b-glue.png`, bonus: 45, pack: "25 кг", delivery: "express", weightKg: 25},
  {id: "b7", name: "Плитка керамогранит серый 60×60", weight: "1,44 м²", price: 9990, cat: "plitka", img: `${A}/assets/b-tile.png`, pack: "1,44 м²", delivery: "cargo", weightKg: 32},
  {id: "t1", name: "Молоток слесарный 500 г", weight: "1 шт", price: 3490, cat: "ruchnoy", img: `${A}/assets/p-t1.png`, pack: "1 шт", delivery: "express", weightKg: 1},
  {id: "t2", name: "Набор отвёрток, 6 шт", weight: "6 шт", price: 4990, oldPrice: 5890, cat: "ruchnoy", img: `${A}/assets/p-t2.png`, pack: "6 шт", delivery: "express", weightKg: 1},
  {id: "t3", name: "Рулетка 5 м", weight: "1 шт", price: 1890, cat: "ruchnoy", img: `${A}/assets/p-t3.png`, pack: "1 шт", delivery: "express", weightKg: 1},
  {id: "t4", name: "Дрель-шуруповёрт аккумуляторная 18 В", weight: "1 шт", price: 32900, oldPrice: 36900, cat: "elektro", img: `${A}/assets/p-t4.png`, pack: "1 шт", delivery: "express", weightKg: 1},
  {id: "t5", name: "Перфоратор 800 Вт", weight: "1 шт", price: 44900, cat: "elektro", img: `${A}/assets/p-t5.png`, pack: "1 шт", delivery: "express", weightKg: 1},
  {id: "t6", name: "Саморезы по дереву 3,5×35, 200 шт", weight: "200 шт", price: 1290, cat: "krepezh", img: `${A}/assets/p-t6.png`, pack: "200 шт", delivery: "express", weightKg: 1},
  {id: "t7", name: "Дюбель-гвоздь 6×40, 100 шт", weight: "100 шт", price: 1590, cat: "krepezh", img: `${A}/assets/p-t7.png`, pack: "100 шт", delivery: "express", weightKg: 1},
  {id: "h1", name: "Мешки для строительного мусора, 10 шт", weight: "10 шт", price: 1490, cat: "hoztovary", img: `${A}/assets/p-h1.png`, pack: "10 шт", delivery: "express", weightKg: 1},
  {id: "h2", name: "Ведро строительное 12 л", weight: "12 л", price: 990, cat: "hoztovary", img: `${A}/assets/p-h2.png`, pack: "12 л", delivery: "express", weightKg: 1},
  {id: "h3", name: "Лампа светодиодная E27, 12 Вт", weight: "1 шт", price: 690, cat: "svet", img: `${A}/assets/p-h3.png`, pack: "1 шт", delivery: "express", weightKg: 1},
  {id: "h4", name: "Удлинитель 5 м, 4 розетки", weight: "1 шт", price: 3990, cat: "svet", img: `${A}/assets/p-h4.png`, pack: "1 шт", delivery: "express", weightKg: 1},
  {id: "h5", name: "Смеситель для раковины", weight: "1 шт", price: 12900, oldPrice: 14900, cat: "santehnika", img: `${A}/assets/p-h5.png`, pack: "1 шт", delivery: "express", weightKg: 1},
  {id: "g1", name: "Подарочная коробка крафт", weight: "1 шт", price: 1990, cat: "upakovka", img: `${A}/assets/p-g1.png`, pack: "1 шт", delivery: "express", weightKg: 1},
  {id: "g2", name: "Лента атласная, 5 м", weight: "5 м", price: 590, cat: "upakovka", img: `${A}/assets/p-g2.png`, pack: "5 м", delivery: "express", weightKg: 1},
  {id: "g3", name: "Открытка «С днём рождения»", weight: "1 шт", price: 490, cat: "otkrytki", img: `${A}/assets/p-g3.png`, pack: "1 шт", delivery: "express", weightKg: 1},
  {id: "g4", name: "Шар фольгированный «Сердце»", weight: "1 шт", price: 1490, cat: "shary", img: `${A}/assets/p-g4.png`, pack: "1 шт", delivery: "express", weightKg: 1},
  {id: "g5", name: "Набор латексных шаров, 10 шт", weight: "10 шт", price: 2490, cat: "shary", img: `${A}/assets/p-g5.png`, pack: "10 шт", delivery: "express", weightKg: 1},
];

// ── Карточка товара (GET /products/{id}): описание и характеристики. МОК ──
const CEMENT_DESC = 'Портландцемент М400 Д20 — универсальный цемент для большинства строительных работ: приготовления бетона и кладочных растворов, заливки фундаментов, стяжки пола и штукатурки.\nДобавка 20% минеральных компонентов повышает водостойкость и снижает риск появления трещин. Подходит для работы при температуре от +5 °C.\nДля бетона М200 смешивайте 1 часть цемента, 2,8 части песка и 4,8 части щебня. Готовый раствор используйте в течение 2 часов. Храните мешки в сухом помещении на поддоне, не дольше 60 дней с даты производства.';
export const PRODUCT_DETAILS: Record<string, { description: string; specs: [string, string][] }> = {
  b1: { description: CEMENT_DESC, specs: [['Марка', 'М400 Д20'], ['Фасовка', '50 кг'], ['Тип', 'Портландцемент ЦЕМ II/А-Ш 32,5Н'], ['Прочность на сжатие', '40 МПа'], ['Расход на 1 м³ бетона М200', '≈ 290 кг'], ['Время схватывания', 'от 2 часов'], ['Температура применения', 'от +5 до +30 °C'], ['Морозостойкость', 'F100'], ['Водонепроницаемость', 'W6'], ['Срок хранения', '60 дней'], ['Упаковка', 'Бумажный мешок'], ['Производитель', 'Standart Cement'], ['Страна', 'Казахстан'], ['Мешков на поддоне', '40 шт']] },
  b9: { description: CEMENT_DESC, specs: [['Марка', 'М400 Д20'], ['Фасовка', '25 кг'], ['Тип', 'Портландцемент ЦЕМ II/А-Ш 32,5Н'], ['Прочность на сжатие', '40 МПа'], ['Время схватывания', 'от 2 часов'], ['Температура применения', 'от +5 до +30 °C'], ['Морозостойкость', 'F100'], ['Срок хранения', '60 дней'], ['Производитель', 'Standart Cement'], ['Страна', 'Казахстан']] },
  b4: { description: 'Матовая интерьерная краска для стен и потолков в жилых помещениях. Скрывает мелкие неровности, не имеет резкого запаха, выдерживает влажную уборку.\nНаносится валиком, кистью или краскопультом в 2 слоя, второй — через 2 часа. 10 литров хватает на 60–70 м² в один слой.\nБазовый цвет — белый. Колеруем в любой оттенок из каталога бесплатно, прямо в магазине.', specs: [['Объём', '10 л'], ['Тип', 'Водно-дисперсионная, акриловая'], ['Степень блеска', 'Глубокоматовая'], ['Расход', '140–160 мл/м² на слой'], ['Высыхание между слоями', '2 часа'], ['Стойкость к мытью', '2 класс'], ['Помещения', 'Жилые, сухие'], ['Колеровка', 'Да, бесплатно'], ['Производитель', 'Alina Paint'], ['Страна', 'Казахстан']] },
  t4: { description: 'Компактная аккумуляторная дрель-шуруповёрт для сборки мебели, монтажа и сверления дерева и металла. 21 режим момента, 2 скорости, подсветка рабочей зоны.\nВ комплекте 2 аккумулятора 2 А·ч, зарядное устройство и кейс. Зарядка — 60 минут.', specs: [['Напряжение', '18 В'], ['Аккумулятор', 'Li-Ion, 2 А·ч × 2'], ['Крутящий момент', '45 Н·м'], ['Скорость', '0–400 / 0–1500 об/мин'], ['Патрон', 'Быстрозажимной, до 13 мм'], ['Вес', '1,4 кг'], ['Гарантия', '12 месяцев']] },
};
export const FLOWER_DESC = 'Букет собираем в день заказа из свежих цветов. Состав может немного отличаться от фото — сохраним стиль и цветовую гамму.\nК каждому букету бесплатно прикладываем открытку и подкормку для цветов.';
export const DEFAULT_DESC = 'Описание товара появится позже. Уточните детали у поддержки в WhatsApp.';

// ── Сторисы и баннер (GET /stories, GET /banners). МОК, текст накладывается вёрсткой ──
// Сторисы — про цветы (основной товар): фото и цены «от …» берутся из каталога (lib/flowers.ts), не прописаны руками.
const bouquet = (id: string) => FLOWERS.find(f => f.id === id) ?? FLOWERS[0];
/** Слайд-букет: фото, «от N тг · размеры S, M, L», кнопка — на страницу букета (там выбирают размер). */
const bouquetSlide = (id: string): Story['slides'][number] => {
  const f = bouquet(id);
  return { img: f.img!, title: f.name, text: `от ${groupDigits(f.price ?? 0)} тг · размеры ${(f.sizes ?? []).join(', ')}`, cta: { label: 'Выбрать размер', href: `/product/${f.id}` } };
};
export const STORIES: Story[] = [
  { id: 's-bouquets', title: 'Букеты', cover: `${A}/assets/st-flowers.jpg`, slides: [
    { img: `${A}/assets/st-flowers.jpg`, title: `Букет за ${DELIVERY.etaMin}–${DELIVERY.etaMax} минут`, text: 'Розы, гортензии и хризантемы — соберём сегодня и привезём', cta: { label: 'Выбрать букет', href: '/catalog?cat=tsvety' } } ] },
  { id: 's-roses', title: 'Розы', cover: bouquet('f1').img!, slides: [bouquetSlide('f1'), bouquetSlide('f6'), bouquetSlide('f3')] },
  { id: 's-hydrangeas', title: 'Гортензии', cover: bouquet('f4').img!, slides: [bouquetSlide('f4'), bouquetSlide('f7')] },
  { id: 's-chrysanthemums', title: 'Хризантемы', cover: bouquet('f8').img!, slides: [bouquetSlide('f8'), bouquetSlide('f10')] },
  { id: 's-promo', title: 'Промокод', cover: `${A}/assets/st-gifts.jpg`, slides: [
    { img: `${A}/assets/st-gifts.jpg`, title: `−${PROMO.pct}% по коду ${PROMO.code}`, text: `На заказ от ${groupDigits(PROMO.minSum)} тг. Введите код в корзине`, cta: { label: 'Скопировать код', copy: PROMO.code } } ] },
  { id: 's-delivery', title: 'Доставка', cover: `${A}/assets/st-delivery.jpg`, slides: [
    { img: `${A}/assets/st-delivery.jpg`, title: `Бесплатно от ${groupDigits(DELIVERY.freeFrom)} тг`, text: `Привезём букет за ${DELIVERY.etaMin}–${DELIVERY.etaMax} минут. Иначе ${groupDigits(DELIVERY.fee)} тг`, cta: { label: 'Выбрать букет', href: '/catalog?cat=tsvety' } } ] },
];
export const BANNERS: Banner[] = [
  { img: `${A}/assets/banner-flowers.jpg`, title: `Букеты за ${DELIVERY.etaMin}–${DELIVERY.etaMax} минут`, text: 'Розы, гортензии и хризантемы — соберём сегодня и привезём',
    textShort: 'Привезём сегодня', cta: 'Выбрать букет', href: '/catalog?cat=tsvety' },
];

// ── Личный кабинет (GET /me/*, /orders) ──
export const USER: User = { id: 'u1', name: 'Айгерим', phone: '+7 (700) 133-90-71', since: 'март 2025' };
// Заказы: итоги (goods, discount, fees, spend, total) и бонусы считаются по составу тем же orderTotals(), что в корзине и оформлении.
type RawOrder = Omit<Order, 'bonus' | 'total' | 'goods' | 'discount' | 'fees'>;
const ORDERS_RAW: RawOrder[] = [
  { id: '8M-10482', date: '26 сентября, 14:05', method: 'delivery', status: 'onway', address: 'Астана, Кабанбай батыра, 11', eta: '15:20–15:35', payment: 'kaspi', promo: 'MART10', promoPct: 10,
    items: [{ id: 'b1', qty: 2 }, { id: 'b6', qty: 1 }, { id: 'b4', qty: 1 }],
    shipments: [
      { kind: 'courier', status: 'onway', eta: '15:20–15:35', times: ['14:05', '14:07', '14:32'], courier: { name: 'Ерлан, Hyundai Accent · 123 ABC 01', phone: '+77001112233' } },
      { kind: 'cargo', status: 'assembling', eta: '27 сентября, 9:00–13:00', times: ['14:05', '27 сент., 08:10'] }] },
  { id: '8M-10311', date: '12 сентября, 10:42', method: 'pickup', status: 'done', address: 'пр. Мангилик Ел, 55', payment: 'card', items: [{ id: 'b3', qty: 6 }, { id: 'b11', qty: 2 }],
    shipments: [{ kind: 'cargo', status: 'done', times: ['10:42', '13 сент., 08:00', '13 сент., 09:00', '13 сент., 11:40'] }] },
  { id: '8M-10107', date: '28 августа, 18:10', method: 'delivery', status: 'done', address: 'Астана, Кабанбай батыра, 11', payment: 'kaspi', spend: 500, items: [{ id: 'b12', qty: 1 }, { id: 'b5', qty: 3 }, { id: 'b2', qty: 200 }, { id: 'b9', qty: 4 }],
    shipments: [{ kind: 'courier', status: 'done', times: ['18:10', '18:12', '18:40', '19:22'] }, { kind: 'cargo', status: 'done', times: ['18:10', '29 авг., 08:10', '29 авг., 10:20', '29 авг., 11:05'] }] },
  { id: '8M-09984', date: '14 августа, 12:30', method: 'delivery', status: 'cancelled', address: 'Астана, ул. Сарайшык, 5', payment: 'card', items: [{ id: 'b8', qty: 10 }],
    shipments: [{ kind: 'cargo', status: 'cancelled', times: ['12:30', '12:41'] }] },
];
/** Итоги заказа по составу — как посчитал бы бэкенд. */
export function withTotals(o: RawOrder): Order {
  const lines = o.items.map(i => ({ p: cartItem(i.id, PRODUCTS)!, qty: i.qty })).filter(l => l.p);
  const t = orderTotals({ lines, plan: { method: o.method, together: o.shipments.length === 1 }, promoPct: o.promoPct ?? 0 });
  const spend = o.spend ?? 0;
  return { ...o, recipient: o.recipient ?? { name: USER.name, phone: USER.phone }, goods: t.goods, discount: t.discount,
    fees: t.fees.map(f => ({ label: f.label, amount: f.amount })), spend, total: t.total - spend, bonus: bonusFor(lines) };
}
export const ORDERS: Order[] = ORDERS_RAW.map(withTotals);
const orderById = (id: string) => ORDERS.find(o => o.id === id)!;
// Наличие в филиале (мок): эти позиции /cart/validate вернёт как распроданные.
export const SOLD_OUT_IN_BRANCH: string[] = ['b3'];

export const ADDRESSES: Address[] = [
  { id: 'a1', title: 'Дом', street: 'Кабанбай батыра, 11', city: 'Астана', entrance: '2', floor: '7', flat: '48', isDefault: true },
  { id: 'a2', title: 'Объект', street: 'ул. Сарайшык, 5', city: 'Астана', entrance: '', floor: '', flat: '', isDefault: false },
];
// Карты сохраняет платёжный шлюз при оплате; фронт получает только маску
export const CARDS: Card[] = [ { id: 'c1', brand: 'Visa', last4: '4821', exp: '09/28', isDefault: true }, { id: 'c2', brand: 'Mastercard', last4: '1097', exp: '03/27', isDefault: false } ];
export const FAVORITES: string[] = ['f1', 'f4', 'f8', 'b4', 'b1', 'b3'];
export const USER_PROMOS: UserPromo[] = [
  { code: 'MART10', title: '−10% на заказ', cond: 'от 15 000 тг', until: 'до 31 октября', status: 'active' },
  { code: 'FREEDEL', title: 'Бесплатная доставка', cond: 'на любой заказ', until: 'до 15 октября', status: 'active' },
  { code: 'SPRING', title: '−15% на краски', cond: 'от 10 000 тг', until: 'истёк 31 мая', status: 'expired' },
];
// Бонусы: начисления — bonusFor() по составу заказа, баланс — сумма истории. Списание — МОК.
const BONUS_HISTORY: Bonus['history'] = [
  { id: 'h1', title: 'Начислено за заказ №8M-10311', date: '12 сентября', amount: orderById('8M-10311').bonus },
  { id: 'h2', title: 'Списано в заказе №8M-10107', date: '28 августа', amount: -500 },
  { id: 'h3', title: 'Начислено за заказ №8M-10107', date: '28 августа', amount: orderById('8M-10107').bonus },
];
export const BONUS: Bonus = { balance: BONUS_HISTORY.reduce((sum, h) => sum + h.amount, 0), maxPart: BONUS_RULES.maxPart, history: BONUS_HISTORY };
