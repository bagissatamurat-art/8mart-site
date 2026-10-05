'use client';
import { useEffect, useState } from 'react';
import { MartButton } from '@/components/MartButton';
import { OrderScreen } from '@/components/screens/OrderScreen';
import { NOT_FOUND } from '@/lib/copy';
import type { Category } from '@/lib/types';

/** /order/<id> без заранее собранной страницы → статус заказа; иначе — «Страница не найдена». */
export function NotFoundRoute({ categories }: { categories: Category[] }) {
  const [orderId, setOrderId] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    const m = location.pathname.match(/\/order\/([^/]+)\/?$/);
    setOrderId(m ? decodeURIComponent(m[1]) : null);
  }, []);
  if (orderId === undefined) return null;
  if (orderId) return <OrderScreen id={orderId} categories={categories} />;
  return (
    <main style={{ minHeight: '60dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center' }}>
      <h1 style={{ margin: 0, fontSize: 'var(--fs-h1)', fontWeight: 800, letterSpacing: 'var(--tracking-tight)' }}>{NOT_FOUND.title}</h1>
      <MartButton label={NOT_FOUND.home} size={56} href="/" />
    </main>
  );
}
