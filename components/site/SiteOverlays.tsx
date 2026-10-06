'use client';
// Глобальные оверлеи: гидрация сторов, модалка способа получения, быстрый просмотр.
import { Suspense, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { QuickViewSkeleton } from './QuickViewSkeleton';

// Модалки грузятся по требованию — их код не входит в бандл страниц.
const MartMethodModal = dynamic(() => import('@/components/MartMethodModal').then(m => m.MartMethodModal), { ssr: false });
import { getCities } from '@/lib/api';
import { loadQuickView, loadQuickViewComponent, peekQuickView, peekQuickViewComponent, preloadQuickView, type QuickViewData } from './quickViewData';
import { useCart } from '@/lib/store/cart';
import { useAuth } from '@/lib/store/auth';
import { methodValue, useMethod } from '@/lib/store/method';
import { closeOverlays, flushPending, setCartQty, useUi } from '@/lib/store/ui';
import type { Category, City } from '@/lib/types';
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

/** Скелетон — только если загрузка дольше этого (мс): быстрый ответ открывается сразу, без мигания. */
const SKELETON_DELAY = 150;
/** Наведение на карточку дольше этого (мс) — начинаем грузить товар и код модалки. */
const HOVER_INTENT = 80;

type Ready = { id: string; data: QuickViewData; View: NonNullable<ReturnType<typeof peekQuickViewComponent>>; appear: 'enter' | 'swap' };

function QuickViewHost({ categories }: { categories: Category[] }) {
  const id = useUi(s => s.quickViewId);
  const close = useUi(s => s.closeQuickView);
  const open = useUi(s => s.openQuickView);
  const method = useMethod(s => s.method);
  const lines = useCart(s => s.lines);
  const [ready, setReady] = useState<Ready | null>(null);
  const [skeleton, setSkeleton] = useState(false);
  const skelRef = useRef<HTMLDivElement>(null);
  /** Высота, с которой окно товара плавно перейдёт к своей (высота скелетона). */
  const fromH = useRef<number | undefined>(undefined);

  // Предзагрузка по намерению: наведение (desktop), касание, фокус на карточке с data-quickview.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const target = (e: Event) => (e.target as Element | null)?.closest?.('[data-quickview]')?.getAttribute('data-quickview');
    const onOver = (e: Event) => { clearTimeout(t); const q = target(e); if (q) t = setTimeout(() => preloadQuickView(q), HOVER_INTENT); };
    const now = (e: Event) => { const q = target(e); if (q) preloadQuickView(q); };
    document.addEventListener('pointerover', onOver);
    document.addEventListener('pointerdown', now);
    document.addEventListener('focusin', now);
    return () => { clearTimeout(t); document.removeEventListener('pointerover', onOver); document.removeEventListener('pointerdown', now); document.removeEventListener('focusin', now); };
  }, []);

  useEffect(() => {
    if (!id) { setReady(null); setSkeleton(false); fromH.current = undefined; return; }
    const data = peekQuickView(id), View = peekQuickViewComponent();
    // Окно уже стоит (прошлый товар или скелетон) — проявляется только содержимое, иначе полный вход.
    if (data && View) { setReady(prev => ({ id, data, View, appear: prev ? 'swap' : 'enter' })); return; }
    // Смена товара внутри просмотра (фасовка): прошлый остаётся на экране, пока грузится новый — скелетон не нужен.
    let live = true;
    const t = setTimeout(() => { if (live) setSkeleton(true); }, SKELETON_DELAY);
    Promise.all([loadQuickView(id), loadQuickViewComponent()]).then(async ([data, View]) => {
      // Скелетон ещё выезжает — дать ему доехать, иначе окно товара встанет на место рывком.
      const anims = (skelRef.current?.parentElement?.getAnimations({ subtree: true }) ?? [])
        .filter(a => a.effect?.getComputedTiming().endTime !== Infinity); // пульс скелетона бесконечный — его не ждём
      await Promise.all(anims.map(a => a.finished.catch(() => {})));
      if (!live) return;
      const skel = skelRef.current?.getBoundingClientRect().height;
      if (skel) fromH.current = skel;
      setReady(prev => ({ id, data, View, appear: prev || skel ? 'swap' : 'enter' }));
      setSkeleton(false);
    }).catch(close);
    return () => { live = false; clearTimeout(t); };
  }, [id, close]);

  if (!id) return null;
  if (!ready) return skeleton ? <QuickViewSkeleton ref={skelRef} onClose={close} /> : null;
  const { View, data } = ready;
  return (
    <View product={data.product} group={data.group} categories={categories} method={method}
      qtyFor={k => lines[k] || 0} onQty={setCartQty} onClose={close} onPickGroup={open} mode="auto"
      appear={ready.appear} fromHeight={fromH.current} />
  );
}

/** Смена адреса (путь или query) — закрыть модалки: иначе они остаются поверх новой страницы с заблокированной прокруткой.
 *  useSearchParams — внутри Suspense, чтобы статические страницы не уходили в клиентский рендер. */
function RouteWatcher() {
  const route = usePathname() + '?' + useSearchParams().toString();
  const first = useRef(route);
  useEffect(() => {
    if (route === first.current) return;
    first.current = route;
    closeOverlays();
  }, [route]);
  return null;
}

export function SiteOverlays({ categories }: { categories: Category[] }) {
  return <><StoreHydrator /><Suspense fallback={null}><RouteWatcher /></Suspense><MethodModalHost /><QuickViewHost categories={categories} /></>;
}
