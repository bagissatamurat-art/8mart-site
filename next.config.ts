import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Пакет дизайна лежит рядом с кодом; при сборке его не трогаем.
  outputFileTracingExcludes: { '*': ['design_handoff_8mart_site/**'] },
  // Метаданные (title, description, canonical) — всегда в <head>, а не потоком: так их видят все поисковики, не только Google.
  htmlLimitedBots: /.*/,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Фото товаров из API 8mart
    remotePatterns: [
      { protocol: 'https', hostname: 'dukenfy-api.8mart.kz', pathname: '/api/v1/catalog/files/**' },
      // Обложки сторис 8mart.kz (PNG ~2,7 МБ → оптимизатор отдаёт WebP/AVIF нужного размера)
      { protocol: 'https', hostname: 'dukenfy-api.8mart.kz', pathname: '/api/v1/stories/files/**' },
    ],
  },
};

export default nextConfig;
