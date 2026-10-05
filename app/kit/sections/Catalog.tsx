'use client';
// Карточка товара + бейджи и алерты — как в site/UI Kit.dc.html.
import { useState } from 'react';
import { MartProductCard } from '@/components/MartProductCard';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { PRODUCTS } from '@/lib/mock';
import { CART_ALERT } from '@/lib/copy';
import type { Product } from '@/lib/types';
import { KitSection } from '../Kit';
import s from './sections.module.css';

const by = (id: string) => PRODUCTS.find(p => p.id === id)!;
const noPrice: Product = { ...by('b5'), id: 'demo-noprice', name: 'Розы Мандала L', price: null, oldPrice: undefined, bonus: undefined, badge: undefined, img: by('f1').img, weight: 'L' };
const noImg: Product = { ...by('h2'), id: 'demo-noimg', img: undefined };

export default function Catalog() {
  const [qty, setQty] = useState<Record<string, number>>({ b4: 2 });
  const q = (id: string) => qty[id] || 0;
  const onQty = (id: string, n: number) => setQty(c => ({ ...c, [id]: n }));
  return (
    <>
      <KitSection id="card" title="Карточка товара · MartProductCard"
        note="Состояния: default · в корзине (счётчик) · без скидки · раскупили · цветы «от …» с выбором размера · цена не задана · без фото. Сердце — общий стор избранного.">
        <div className={s.cards}>
          <MartProductCard product={by('b1')} qty={q('b1')} onQty={onQty} />
          <MartProductCard product={by('b4')} qty={q('b4')} onQty={onQty} />
          <MartProductCard product={by('b2')} qty={q('b2')} onQty={onQty} />
          <MartProductCard product={by('b1')} soldOut />
          <MartProductCard product={by('f1')} />
          <MartProductCard product={noPrice} />
          <MartProductCard product={noImg} qty={q('demo-noimg')} onQty={onQty} />
        </div>
      </KitSection>
      <KitSection id="badges" title="Бейджи и алерты">
        <div style={{ background: 'var(--surface-card)', borderRadius: 'var(--r-20)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className={s.badges}>
            <Badge tone="sale">−21%</Badge>
            <Badge tone="neutral">Товар дня</Badge>
            <Badge tone="neutral">3 за 2</Badge>
            <Badge tone="dark">Раскупили</Badge>
            <Badge tone="success">Доставка бесплатно</Badge>
          </div>
          <Alert tone="danger">{CART_ALERT.soldOut}</Alert>
          <Alert tone="warning">Цены и наличие зависят от филиала — выберите способ получения</Alert>
          <Alert tone="success">До бесплатной доставки осталось 7 220 тг</Alert>
        </div>
      </KitSection>
    </>
  );
}
