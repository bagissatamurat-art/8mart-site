// Техническое SEO: адрес сайта, канонические ссылки, микроразметка schema.org.
import { BRAND, DELIVERY } from './config';
import type { Category, City, PickupPoint, Product, Review } from './types';

/** Боевой адрес сайта (основное зеркало — www). NEXT_PUBLIC_SITE_URL переопределяет его для стендов. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.8mart.kz').replace(/\/$/, '');
export const SITE_NAME = BRAND.name;
/** Города с филиалами — для заголовков и описаний (страница каждого города — /dostavka-cvetov/<город>). */
export const CITIES_IN = 'в Астане, Актобе, Кокшетау, Костанае и Уральске';
/** «в Астане» — для заголовков страниц городов (/dostavka-cvetov/<id>). Новый город — добавить сюда. */
export const CITY_IN: Record<string, string> = {
  astana: 'в Астане', aktobe: 'в Актобе', kokshetau: 'в Кокшетау', kostanay: 'в Костанае', uralsk: 'в Уральске',
};
export const cityPath = (id: string) => `/dostavka-cvetov/${id}`;

/** Заголовок и вступление раздела каталога. «Гортензии» одним словом поисковик путает с саженцами и горшечными растениями,
 *  поэтому заголовок — «Букеты с гортензиями». Только проверяемые факты: без сроков, цен и обещаний, которых нет в каталоге. */
export const CATEGORY_SEO: Record<string, { h1: string; intro: string }> = {
  tsvety: { h1: 'Букеты цветов', intro: 'Букеты из роз, гортензий и хризантем. У каждого букета три размера — S, M и L, состав размера указан в карточке. Собираем в день заказа, к букету — открытка и подкормка в подарок.' },
  rozy: { h1: 'Букеты из роз', intro: 'Букеты из роз — микс, кустовые и пионовидные розы Мандала, отдельно и вместе с гортензией и хризантемой. Размеры S, M и L: сколько роз в каждом — в карточке букета.' },
  gortenzii: { h1: 'Букеты с гортензиями', intro: 'Срезанная гортензия в букетах — с кустовыми розами и хризантемами. Пышный объём при небольшом числе цветов. Размеры S, M и L, состав каждого — в карточке.' },
  hrizantemy: { h1: 'Букеты с хризантемами', intro: 'Букеты из хризантем — отдельно и вместе с розами Мандала и кустовыми розами. Хризантемы долго стоят в вазе. Размеры S, M и L, состав каждого — в карточке.' },
};
export const SITE_DESCRIPTION = `Букеты из роз, гортензий и хризантем с доставкой за 30–70 минут и самовывозом из 7 магазинов ${CITIES_IN}. Размеры S, M, L — соберём сегодня.`;

/** Заголовок h1 главной (визуально скрыт: в макете 01 заголовка нет). */
export const HOME_H1 = `8mart — доставка цветов и букетов за 30–70 минут ${CITIES_IN}`;

/** Общее для openGraph всех страниц: страница, задающая свой openGraph, иначе потеряла бы siteName и locale. */
export const OG_BASE = { type: 'website' as const, locale: 'ru_KZ', siteName: BRAND.name };
export const OG_IMAGE = { url: '/assets/banner-flowers.jpg', width: 1600, height: 800, alt: '8mart — цветы и букеты' };
/** Служебные страницы: не индексировать, но ссылки с них учитывать. robots.txt их не закрывает — иначе робот не увидит noindex. */
export const NOINDEX = { index: false, follow: true } as const;

export const abs = (path: string) => (/^https?:/.test(path) ? path : SITE_URL + path);

/** Адрес категории каталога (канонический — без сортировки и фильтров). */
export { catalogPathOf as catalogPath } from '@/components/catalog/catalogUrl';

type Crumb = { name: string; path: string };
/** FAQPage — те же вопросы, что в блоке «Вопросы и ответы» (lib/faq.ts). */
export const faqLd = (items: [string, string][]) => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
});

export const breadcrumbsLd = (items: Crumb[]) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.path) })),
});

const ORG_ID = () => SITE_URL + '/#org';

export const organizationLd = () => ({
  '@context': 'https://schema.org', '@type': 'Organization', '@id': ORG_ID(), name: SITE_NAME, url: SITE_URL, logo: abs('/assets/logo.svg'),
  email: BRAND.email, telephone: BRAND.phoneRaw,
  sameAs: [`https://instagram.com/${BRAND.instagram}`, `https://www.tiktok.com/@${BRAND.tiktok}`],
});

export const websiteLd = () => ({
  '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: SITE_URL, inLanguage: 'ru-KZ',
  potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
});

/** Филиалы — Florist (адрес, координаты, телефон), часть Organization. Графика в API нет — часы не указываем. */
export const storesLd = (points: PickupPoint[], cities: City[]) => points.map(p => ({
  '@context': 'https://schema.org', '@type': 'Florist', '@id': `${SITE_URL}/#store-${p.id}`,
  name: `${p.brand ?? '8MART'}, ${p.name}`, telephone: BRAND.phoneRaw, url: SITE_URL, image: abs('/assets/logo.svg'),
  address: { '@type': 'PostalAddress', streetAddress: p.name, addressLocality: cities.find(c => c.id === p.city)?.name ?? p.city, addressCountry: 'KZ' },
  geo: { '@type': 'GeoCoordinates', latitude: p.lat, longitude: p.lng },
  parentOrganization: { '@id': ORG_ID() },
}));

/** Доставка по Казахстану (курьер): от DELIVERY.fee, сегодня. Точная стоимость — по зоне адреса. */
const shippingLd = () => ({
  '@type': 'OfferShippingDetails',
  shippingRate: { '@type': 'MonetaryAmount', value: DELIVERY.fee, currency: 'KZT' },
  shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'KZ' },
  deliveryTime: { '@type': 'ShippingDeliveryTime',
    handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 0, unitCode: 'DAY' },
    transitTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' } },
});

/** Подпись бэкенда, когда имени покупателя нет или аккаунт удалён (services/reviews.ts): для разметки это не имя автора. */
const ANONYMOUS_AUTHOR = 'Покупатель';

/** Отзывы в разметке — только опубликованные и только когда они есть (правило Google: отсутствующие отзывы не размечать).
 *  aggregateRating — средняя по всем опубликованным (p.rating); review — отзывы первой страницы, у которых есть имя автора. */
function reviewsLd(p: Pick<Product, 'rating'>, reviews: Review[]) {
  if (!p.rating || p.rating.count < 1) return {};
  const named = reviews.filter(r => r.author && r.author !== ANONYMOUS_AUTHOR);
  return {
    aggregateRating: { '@type': 'AggregateRating', ratingValue: p.rating.avg, ratingCount: p.rating.count, bestRating: 5, worstRating: 1 },
    ...(named.length ? {
      review: named.map(r => ({
        '@type': 'Review', author: { '@type': 'Person', name: r.author }, datePublished: r.createdAt,
        reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
        ...(r.text ? { reviewBody: r.text } : {}),
      })),
    } : {}),
  };
}

/** Product + Offer (цена в тенге; у цветов — AggregateOffer по размерам). Бренд — только у букетов 8mart (свои).
 *  reviews — опубликованные отзывы, которые есть в HTML страницы (первая страница). */
export function productLd(p: Product & { description?: string; images?: string[]; soldOut?: boolean }, category?: Category, reviews: Review[] = []) {
  const prices = p.variants?.map(v => v.price) ?? (p.price != null ? [p.price] : []);
  const url = abs(`/product/${p.id}`);
  const availability = p.soldOut ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock';
  const offer = !prices.length ? undefined : p.variants
    ? { '@type': 'AggregateOffer', priceCurrency: 'KZT', lowPrice: Math.min(...prices), highPrice: Math.max(...prices), offerCount: prices.length, availability, url,
        // Цена каждого размера отдельно: поиск и ИИ-ответы берут «M — 22 600 тг» из разметки, а не из вёрстки.
        offers: p.variants!.map(v => ({ '@type': 'Offer', sku: v.id, name: `${p.name}, ${v.size}`, priceCurrency: 'KZT', price: v.price, availability, url, shippingDetails: shippingLd() })) }
    : { '@type': 'Offer', priceCurrency: 'KZT', price: prices[0], availability, url, shippingDetails: shippingLd() };
  const imgs = (p.images?.length ? p.images : p.img ? [p.img] : []).map(abs);
  return {
    '@context': 'https://schema.org', '@type': 'Product', sku: p.id, name: p.name,
    ...(p.description ? { description: p.description.replace(/\n/g, ' ') } : {}),
    ...(imgs.length ? { image: imgs } : {}),
    ...(category ? { category: category.name } : {}),
    ...(p.delivery === 'flowers' ? { brand: { '@type': 'Brand', name: SITE_NAME } } : {}),
    ...(offer ? { offers: offer } : {}),
    ...reviewsLd(p, reviews),
  };
}
