import type { Metadata, Viewport } from 'next';
import { SiteOverlays } from '@/components/site/SiteOverlays';
import { getCategories } from '@/lib/api';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: '8mart — стройматериалы, инструменты и цветы с доставкой',
  description: 'Доставка по Астане и другим городам Казахстана за 60–90 минут.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#F2F2F4', viewportFit: 'cover' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();
  return (
    <html lang="ru">
      <body>
        {children}
        <SiteOverlays categories={categories} />
      </body>
    </html>
  );
}
