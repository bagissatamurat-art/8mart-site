// Техническое SEO: адрес сайта, канонические ссылки, микроразметка schema.org.
import { BRAND, DELIVERY } from './config';
import type { Category, City, PickupPoint, Product } from './types';

/** Боевой адрес сайта. Задаётся NEXT_PUBLIC_SITE_URL (на Vercel — домен проекта); по умолчанию — Vercel-домен. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://8mart-site.vercel.app').replace(/\/$/, '');
export const SITE_NAME = BRAND.name;
export const SITE_DESCRIPTION = 'Букеты из роз, гортензий и хризантем с доставкой по Астане за 30–70 минут и самовывозом. Размеры S, M, L — соберём сегодня. Также стройматериалы и товары для дома.';

/** Заголовок h1 главной (визуально скрыт: в макете 01 заголовка нет). */
export const HOME_H1 = '8mart — цветы и букеты с доставкой по Астане за 30–70 минут';

/** Общее для openGraph всех страниц: страница, задающая свой openGraph, иначе потеряла бы siteName и locale. */
export const OG_BASE = { type: 'website' as const, locale: 'ru_KZ', siteName: BRAND.name };
export const OG_IMAGE = { url: '/assets/banner-flowers.jpg', width: 1600, height: 800, alt: '8mart — цветы и букеты' };
/** Служебные страницы: не индексировать, но ссылки с них учитывать. robots.txt их не закрывает — иначе робот не увидит noindex. */
export const NOINDEX = { index: false, follow: true } as const;

export const abs = (path: string) => (/^https?:/.test(path) ? path : SITE_URL + path);

/** Адрес категории каталога (канонический — без сортировки и фильтров). */
export const catalogPath = (cat?: string | null, sub?: string | null) =>
  !cat ? '/catalog' : sub ? `/catalog?cat=${cat}&sub=${sub}` : `/catalog?cat=${cat}`;

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

/** Product + Offer (цена в тенге; у цветов — AggregateOffer по размерам). Бренд — только у букетов 8mart (свои). */
export function productLd(p: Product & { description?: string; images?: string[]; soldOut?: boolean }, category?: Category) {
  const prices = p.variants?.map(v => v.price) ?? (p.price != null ? [p.price] : []);
  const url = abs(`/product/${p.id}`);
  const availability = p.soldOut ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock';
  const offer = !prices.length ? undefined : p.variants
    ? { '@type': 'AggregateOffer', priceCurrency: 'KZT', lowPrice: Math.min(...prices), highPrice: Math.max(...prices), offerCount: prices.length, availability, url, shippingDetails: shippingLd() }
    : { '@type': 'Offer', priceCurrency: 'KZT', price: prices[0], availability, url, shippingDetails: shippingLd() };
  const imgs = (p.images?.length ? p.images : p.img ? [p.img] : []).map(abs);
  return {
    '@context': 'https://schema.org', '@type': 'Product', sku: p.id, name: p.name,
    ...(p.description ? { description: p.description.replace(/\n/g, ' ') } : {}),
    ...(imgs.length ? { image: imgs } : {}),
    ...(category ? { category: category.name } : {}),
    ...(p.delivery === 'flowers' ? { brand: { '@type': 'Brand', name: SITE_NAME } } : {}),
    ...(offer ? { offers: offer } : {}),
  };
}
