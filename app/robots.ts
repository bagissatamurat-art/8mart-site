import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

// Служебные страницы (корзина, оформление, кабинет, заказы, поиск) закрыты от индексации.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/cart', '/checkout', '/account', '/order/', '/login', '/search', '/kit'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
