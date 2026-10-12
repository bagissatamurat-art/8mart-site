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
    // Фото товаров из API 8mart
    remotePatterns: [
      { protocol: 'https', hostname: 'dukenfy-api.8mart.kz', pathname: '/api/v1/catalog/files/**' },
      // Обложки сторис 8mart.kz (PNG ~2,7 МБ → оптимизатор отдаёт WebP/AVIF нужного размера)
      { protocol: 'https', hostname: 'dukenfy-api.8mart.kz', pathname: '/api/v1/stories/files/**' },
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
