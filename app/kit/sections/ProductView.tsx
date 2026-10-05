'use client';
// Витрина MartProductView: кнопки открывают настоящую модалку/sheet (по брейкпоинту), ниже — статичные
// рендеры: страница товара desktop (page) и mobile 390 (страница и sheet внутри рамки).
import { useEffect, useState } from 'react';
import { getCategories, getGroup, getProduct } from '@/lib/api';
import type { Category, Method, Product, ProductDetail } from '@/lib/types';
import { MartProductView } from '@/components/MartProductView';
import { MartButton } from '@/components/MartButton';
import { MartChip } from '@/components/MartChip';
import { Skeleton } from '@/components/ui/Spinner';
import { KitItem, KitPanel, KitSection } from '../Kit';
import s from './sections.module.css';

/** Демо-сценарии: id товара + правка ответа API (товар без фото). */
const DEMOS: { id: string; label: string; noImages?: boolean }[] = [
  { id: 'b1', label: 'Цемент · фасовки, тяжёлый' },
  { id: 'b4', label: 'Краска · цвета' },
  { id: 'f1', label: 'Розы · размер + цвет' },
  { id: 't4', label: 'Дрель · длинные характеристики' },
  { id: 'b9', label: 'Без фото', noImages: true },
];

interface Loaded { product: ProductDetail; group: Product[] }

async function load(id: string, noImages?: boolean): Promise<Loaded> {
  const product = await getProduct(id);
  const group = product.group ? await getGroup(product.group) : [];
  return { product: noImages ? { ...product, images: [] } : product, group };
}

export default function ProductViewSection() {
  const [cats, setCats] = useState<Category[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({ 'b4|Белый': 1 });
  const [method, setMethod] = useState<Method | null>('delivery');
  const [open, setOpen] = useState<{ id: string; noImages?: boolean } | null>(null);
  const [modal, setModal] = useState<Loaded | null>(null);
  const [pageId, setPageId] = useState('b1');
  const [pageData, setPageData] = useState<Loaded | null>(null);
  const [flowers, setFlowers] = useState<Loaded | null>(null);

  useEffect(() => { getCategories().then(setCats); load('f1').then(setFlowers); }, []);
  useEffect(() => { let on = true; load(pageId).then(d => on && setPageData(d)); return () => { on = false; }; }, [pageId]);
  useEffect(() => {
    if (!open) { setModal(null); return; }
    let on = true; load(open.id, open.noImages).then(d => on && setModal(d)); return () => { on = false; };
  }, [open]);

  const qtyFor = (k: string) => cart[k] || 0;
  const onQty = (k: string, q: number) => setCart(c => { const n = { ...c }; if (q <= 0) delete n[k]; else n[k] = q; return n; });
  const common = { categories: cats, method, qtyFor, onQty };

  return (
    <KitSection id="product" title="Быстрый просмотр · MartProductView"
      note="Desktop — модалка 1040 (←→ листают фото, Esc закрывает); уже 1024 — sheet 94% со свайп-галереей и CTA снизу. «Поделиться»: mobile — системный share, desktop — копирует ссылку. page=true — страница /product/[id] без оверлея и крестика.">
      <KitPanel layout="row">
        {DEMOS.map(d => (
          <MartButton key={d.label} label={d.label} variant="ghost" size={40} onClick={() => setOpen({ id: d.id, noImages: d.noImages })} />
        ))}
      </KitPanel>
      <KitPanel layout="row">
        <span>Способ получения:</span>
        <MartChip label="Доставка" selected={method === 'delivery'} onClick={() => setMethod('delivery')} />
        <MartChip label="Самовывоз" selected={method === 'pickup'} onClick={() => setMethod('pickup')} />
        <MartChip label="Не выбран" selected={method == null} onClick={() => setMethod(null)} />
      </KitPanel>

      <KitItem label={`page · desktop (${pageId}) — переключение фасовки грузит товар группы`}>
        <div style={{ background: 'var(--surface-page)', borderRadius: 'var(--r-20)', padding: 16 }}>
          {pageData
            ? <MartProductView {...common} product={pageData.product} group={pageData.group} page mode="desktop" onPickGroup={setPageId} />
            : <Skeleton h={600} r={24} />}
        </div>
      </KitItem>

      <KitPanel layout="row" style={{ alignItems: 'flex-start', gap: 24 }}>
        <KitItem label="page · mobile 390 (b1)">
          <div className={s.phone} style={{ position: 'relative', height: 760 }}>
            {pageData && <MartProductView {...common} product={pageData.product} group={pageData.group} page mode="mobile" onPickGroup={setPageId} />}
          </div>
        </KitItem>
        <KitItem label="sheet · mobile 390 (f1, внутри рамки)">
          <div className={s.phone} style={{ position: 'relative', height: 760 }}>
            {flowers && <MartProductView {...common} product={flowers.product} group={flowers.group} mode="mobile" contained onClose={() => {}} />}
          </div>
        </KitItem>
      </KitPanel>

      {open && modal && (
        <MartProductView {...common} product={modal.product} group={modal.group} mode="auto"
          onClose={() => setOpen(null)} onPickGroup={id => setOpen({ id })} />
      )}
    </KitSection>
  );
}
