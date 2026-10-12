import type { Metadata, Viewport } from 'next';
import { SiteOverlays } from '@/components/site/SiteOverlays';
import { getCategories } from '@/lib/api';
import { OG_BASE, OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/seo';
import { asset } from '@/lib/basePath';
import '@/styles/globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: '8mart — цветы и букеты с доставкой по Астане', template: '%s — 8mart' },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  // canonical — у каждой страницы свой (у главной — в app/page.tsx); в макете его нет, чтобы не унаследовался «/».
  openGraph: { ...OG_BASE, url: '/', title: '8mart — цветы и букеты с доставкой', description: SITE_DESCRIPTION, images: [OG_IMAGE] },
  twitter: { card: 'summary_large_image' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#F2F2F4', viewportFit: 'cover' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();
  return (
    <html lang="ru">
      <head>
        {/* Кириллица Onest нужна на каждой странице — грузим сразу, без ожидания CSS. */}
        <link rel="preload" href={asset('/fonts/onest-cyrillic.woff2')} as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
        <SiteOverlays categories={categories} />
      </body>
    </html>
  );
}
