import type { NextConfig } from 'next';

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
    remotePatterns: [
      { protocol: 'https', hostname: 'api.8mart.kz', pathname: '/media/**' },
    ],
  },
  // Шрифты и картинки из public — с долгим кэшем браузера (по умолчанию Next отдаёт их с max-age=0).
  async headers() {
    return [
      { source: '/fonts/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/assets/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=2592000' }] },
    ];
  },
};

export default nextConfig;
