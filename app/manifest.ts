import type { MetadataRoute } from 'next';
import { SITE_DESCRIPTION } from '@/lib/seo';

// Иконка и имя сайта при добавлении на главный экран телефона; иконки — public/icon-192/512.png (из app/icon.svg).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '8mart — цветы и букеты', short_name: '8mart', description: SITE_DESCRIPTION, lang: 'ru',
    start_url: '/', display: 'standalone', background_color: '#F2F2F4', theme_color: '#F2F2F4',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
