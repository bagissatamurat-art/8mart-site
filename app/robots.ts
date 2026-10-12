import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

// Закрыт только /api/. Служебные страницы (корзина, оформление, кабинет, заказы, поиск, вход, /kit) помечены noindex
// в своих метаданных — robots.txt их не блокирует, иначе поисковик не прочтёт noindex и может показать адрес без описания.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
