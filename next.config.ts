import type { NextConfig } from 'next';

/** Фото бэкенд отдаёт с того же хоста, что и API (/media/…): прод — api.8mart.kz, локально — localhost:4000. */
const api = new URL(process.env.NEXT_PUBLIC_API_URL || 'https://api.8mart.kz/v1');
const media = { protocol: api.protocol.slice(0, -1) as 'http' | 'https', hostname: api.hostname, port: api.port, pathname: '/media/**' };

const nextConfig: NextConfig = {
  // Пакет дизайна лежит рядом с кодом; при сборке его не трогаем.
  outputFileTracingExcludes: { '*': ['design_handoff_8mart_site/**'] },
  // Метаданные (title, description, canonical) — всегда в <head>, а не потоком: так их видят все поисковики, не только Google.
  htmlLimitedBots: /.*/,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Шире 720 картинок на сайте нет (баннер); меньше вариантов — быстрее холодный кэш оптимизатора.
    deviceSizes: [360, 414, 640, 750, 828, 1080, 1440],
    imageSizes: [32, 48, 64, 96, 128, 160, 256, 384],
    qualities: [60, 75],
    // Фото товаров и обложки сторис не меняются по тому же адресу — держим оптимизированные копии 31 день.
    minimumCacheTTL: 2678400,
    // Фото товаров, баннеров и сторис из бэкенда 8mart (MEDIA_PUBLIC_URL)
    remotePatterns: [media],
    // Локальный бэкенд на localhost: оптимизатор next/image по умолчанию не ходит на внутренние адреса
    dangerouslyAllowLocalIP: api.hostname === 'localhost',
  },
  // Шрифты и картинки из public — с долгим кэшем браузера (по умолчанию Next отдаёт их с max-age=0).
  // Технический адрес Vercel — копия сайта: навсегда на основное зеркало, чтобы поисковик не держал дубль.
  // Превью-сборки (другие адреса *.vercel.app) не трогаем.
  async redirects() {
    return [{ source: '/:path*', has: [{ type: 'host', value: '8mart-site.vercel.app' }], destination: 'https://www.8mart.kz/:path*', permanent: true }];
  },
  async headers() {
    return [
      { source: '/fonts/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/assets/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=2592000' }] },
    ];
  },
};

export default nextConfig;
