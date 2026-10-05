'use client';
// Элементы раскладки сайта (этап 2): сайдбар категорий, тост, полка товаров.
import { useState } from 'react';
import { CategorySidebar } from '@/components/site/CategorySidebar';
import { ProductShelf } from '@/components/site/ProductShelf';
import { Toast } from '@/components/ui/Toast';
import { MartButton } from '@/components/MartButton';
import { CATEGORIES, PRODUCTS } from '@/lib/mock';
import { KitItem, KitSection } from '../Kit';
import { TOASTS } from '@/lib/copy';

export default function Site() {
  const [toast, setToast] = useState(false);
  return (
    <>
      <KitSection id="sidebar" title="Сайдбар категорий · CategorySidebar" note="Белый, r24, padding 12, строки 48, иконка 36 r10. Активная категория — #FDF0F6, 700.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(260px,100%),260px))', gap: 20 }}>
          <KitItem label="главная"><CategorySidebar categories={CATEGORIES} /></KitItem>
          <KitItem label="каталог · активная"><CategorySidebar categories={CATEGORIES} active="stroymaterialy" /></KitItem>
        </div>
      </KitSection>
      <KitSection id="shelf" title="Полка товаров · ProductShelf" note="Desktop — 4 в ряд gap 12, заголовок 24/700; mobile — 2 в ряд gap 8, заголовок 20/700. Количество — из стора корзины.">
        <ProductShelf title="Выгодная полка" href="/catalog?sale=1" products={PRODUCTS.filter(p => p.oldPrice).slice(0, 4)} />
      </KitSection>
      <KitSection id="toast" title="Тост · Toast" note="Тёмная плашка r16, 15/1.35, крестик 36. Сверху по центру (desktop 460) / на всю ширину с отступом 16 (mobile). Закрывается сам через 6 с.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 460, maxWidth: '100%' }}><Toast inline onClose={() => {}}>{TOASTS.accountDeleted}</Toast></div>
          <MartButton label="Показать тост" variant="secondary" size={44} onClick={() => setToast(true)} />
          {toast && <Toast onClose={() => setToast(false)}>{TOASTS.orderRepeated}</Toast>}
        </div>
      </KitSection>
    </>
  );
}
