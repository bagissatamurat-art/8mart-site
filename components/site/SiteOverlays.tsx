'use client';
// Глобальные оверлеи: гидрация сторов, модалка способа получения, быстрый просмотр.
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { QuickViewSkeleton } from './QuickViewSkeleton';

// Модалки грузятся по требованию — их код не входит в бандл страниц.
const MartMethodModal = dynamic(() => import('@/components/MartMethodModal').then(m => m.MartMethodModal), { ssr: false });
const MartProductView = dynamic(() => import('@/components/MartProductView').then(m => m.MartProductView), { ssr: false, loading: () => <QuickViewSkeleton /> });
import { getCities, getGroup, getProduct } from '@/lib/api';
import { useCart } from '@/lib/store/cart';
import { useAuth } from '@/lib/store/auth';
import { methodValue, useMethod } from '@/lib/store/method';
import { flushPending, setCartQty, useUi } from '@/lib/store/ui';
import type { Category, City, Product, ProductDetail } from '@/lib/types';
import type { MethodValue } from '@/components/method/types';

/** Подпись способа для шапки: доставка — «Город, улица, дом», самовывоз — адрес точки. */
export function methodLabel(v: MethodValue, cities: City[]): string {
  if (v.method === 'pickup') return v.address;
  const city = cities.find(c => c.id === v.city)?.name;
  return [city, v.address].filter(Boolean).join(', ');
}

function StoreHydrator() {
  useEffect(() => {
    Promise.all([useCart.persist.rehydrate(), useMethod.persist.rehydrate(), useAuth.persist.rehydrate()]).then(() => useUi.setState({ hydrated: true }));
    // Синхронизация между вкладками
    const onStorage = (e: StorageEvent) => {
      if (e.key === useCart.persist.getOptions().name) useCart.persist.rehydrate();
      if (e.key === useMethod.persist.getOptions().name) useMethod.persist.rehydrate();
      if (e.key === useAuth.persist.getOptions().name) useAuth.persist.rehydrate();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  return null;
}

function MethodModalHost() {
  const open = useUi(s => s.methodOpen);
  const close = useUi(s => s.closeMethod);
  const state = useMethod();
  const [cities, setCities] = useState<City[]>([]);
  useEffect(() => { getCities().then(setCities); }, []);
  if (!open) return null;
  return (
    <MartMethodModal open mode="auto" initial={state.method ? methodValue(state) : undefined} onClose={close}
      onConfirm={v => { state.set(v, methodLabel(v, cities)); flushPending(); }} />
  );
}

function QuickViewHost({ categories }: { categories: Category[] }) {
  const id = useUi(s => s.quickViewId);
  const close = useUi(s => s.closeQuickView);
  const open = useUi(s => s.openQuickView);
  const method = useMethod(s => s.method);
  const lines = useCart(s => s.lines);
  const [data, setData] = useState<{ product: ProductDetail; group: Product[] } | null>(null);
  useEffect(() => {
    if (!id) { setData(null); return; }
    let live = true;
    getProduct(id).then(async product => {
      const group = product.group ? await getGroup(product.group) : [];
      if (live) setData({ product, group });
    }).catch(close);
    return () => { live = false; };
  }, [id, close]);
  if (!id) return null;
  if (!data || data.product.id !== id) return <QuickViewSkeleton onClose={close} />;
  return (
    <MartProductView product={data.product} group={data.group} categories={categories} method={method}
      qtyFor={k => lines[k] || 0} onQty={setCartQty} onClose={close} onPickGroup={open} mode="auto" />
  );
}

export function SiteOverlays({ categories }: { categories: Category[] }) {
  return <><StoreHydrator /><MethodModalHost /><QuickViewHost categories={categories} /></>;
}
