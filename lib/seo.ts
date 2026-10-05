// Техническое SEO: адрес сайта, канонические ссылки, микроразметка schema.org.
import { BRAND } from './config';
import type { Category, Product } from './types';

/** Боевой адрес сайта. Задаётся NEXT_PUBLIC_SITE_URL (на Vercel — домен проекта); по умолчанию — Vercel-домен. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://8mart-site.vercel.app').replace(/\/$/, '');
export const SITE_NAME = BRAND.name;
export const SITE_DESCRIPTION = 'Стройматериалы, инструменты, товары для дома, подарки и цветы с доставкой по Астане за 60–90 минут. Самовывоз из пунктов 8mart.';

/** Заголовок h1 главной (визуально скрыт: в макете 01 заголовка нет). */
export const HOME_H1 = '8mart — стройматериалы, инструменты, товары для дома, подарки и цветы с доставкой по Астане';

export const abs = (path: string) => (/^https?:/.test(path) ? path : SITE_URL + path);

/** Адрес категории каталога (канонический — без сортировки и фильтров). */
export const catalogPath = (cat?: string | null, sub?: string | null) =>
  !cat ? '/catalog' : sub ? `/catalog?cat=${cat}&sub=${sub}` : `/catalog?cat=${cat}`;

type Crumb = { name: string; path: string };
export const breadcrumbsLd = (items: Crumb[]) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.path) })),
});

export const organizationLd = () => ({
  '@context': 'https://schema.org', '@type': 'Organization', name: SITE_NAME, url: SITE_URL, logo: abs('/assets/logo.svg'),
  email: BRAND.email, telephone: BRAND.phoneRaw,
  sameAs: [`https://instagram.com/${BRAND.instagram}`, `https://www.tiktok.com/@${BRAND.tiktok}`],
});

export const websiteLd = () => ({
  '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: SITE_URL, inLanguage: 'ru-KZ',
  potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
});

/** Product + Offer (цена в тенге; у цветов — AggregateOffer по размерам). */
export function productLd(p: Product & { description?: string; images?: string[] }, category?: Category) {
  const prices = p.variants?.map(v => v.price) ?? (p.price != null ? [p.price] : []);
  const offer = !prices.length ? undefined : p.variants
    ? { '@type': 'AggregateOffer', priceCurrency: 'KZT', lowPrice: Math.min(...prices), highPrice: Math.max(...prices), offerCount: prices.length, availability: 'https://schema.org/InStock' }
    : { '@type': 'Offer', priceCurrency: 'KZT', price: prices[0], availability: 'https://schema.org/InStock', url: abs(`/product/${p.id}`) };
  const imgs = (p.images?.length ? p.images : p.img ? [p.img] : []).map(abs);
  return {
    '@context': 'https://schema.org', '@type': 'Product', sku: p.id, name: p.name,
    ...(p.description ? { description: p.description.replace(/\n/g, ' ') } : {}),
    ...(imgs.length ? { image: imgs } : {}),
    ...(category ? { category: category.name } : {}),
    brand: { '@type': 'Brand', name: SITE_NAME },
    ...(offer ? { offers: offer } : {}),
  };
}
