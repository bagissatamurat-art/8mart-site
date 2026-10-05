'use client';
// Строка корзины, мини-корзина, таб-бар (в UI Kit.dc.html их нет — состояния из COMPONENTS.md и Mart*.dc.html).
import { useState } from 'react';
import { MartCartLine } from '@/components/MartCartLine';
import { MartMiniCart } from '@/components/MartMiniCart';
import { MartTabBar } from '@/components/MartTabBar';
import { resolveCartItem } from '@/lib/api';
import { KitItem, KitPanel, KitSection } from '../Kit';
import s from './sections.module.css';

const item = (k: string) => resolveCartItem(k)!;

export default function Cart() {
  const [cart, setCart] = useState<Record<string, number>>({ b1: 2, b6: 1, b4: 1 });
  const [lineQty, setLineQty] = useState(2);
  const change = (k: string, q: number) => setCart(c => { const n = { ...c }; if (q <= 0) delete n[k]; else n[k] = q; return n; });
  return (
    <>
      <KitSection id="cart" title="Корзина · MartCartLine, MartMiniCart"
        note="Распроданное — фон #F7F7F8, не учитывается в сумме, только удалить. Мини-корзина: доставка по planShipments(), прогресс до бесплатной — только курьер.">
        <div className={s.cartGrid}>
          <KitPanel>
            <KitItem label="default · степпер меняет количество"><MartCartLine product={item('b1')} qty={lineQty} onChange={(_, q) => setLineQty(Math.max(1, q))} /></KitItem>
            <KitItem label="без бонусов и скидки"><MartCartLine product={item('t1')} qty={1} /></KitItem>
            <KitItem label="цветы: вариант и цвет · max=3"><MartCartLine product={item('f2|Розовый')} qty={3} max={3} /></KitItem>
            <KitItem label="раскупили"><MartCartLine product={item('b6')} qty={1} soldOut /></KitItem>
            <KitItem label="compact"><MartCartLine product={item('b4')} qty={1} compact /></KitItem>
            <KitItem label="compact · раскупили"><MartCartLine product={item('b3')} qty={6} compact soldOut /></KitItem>
          </KitPanel>
          <div className={s.stack}>
            <KitItem label="живая: курьер + Газель"><MartMiniCart cart={cart} onChange={change} /></KitItem>
            <KitItem label="одна доставка, бесплатно от порога"><MartMiniCart cart={{ t4: 1 }} /></KitItem>
            <KitItem label="самовывоз"><MartMiniCart cart={{ b6: 2, h3: 4 }} method="pickup" /></KitItem>
            <KitItem label="пусто"><MartMiniCart cart={{}} /></KitItem>
          </div>
        </div>
      </KitSection>
      <KitSection id="tabbar" title="Таб-бар · MartTabBar" note="4 вкладки, высота 84 (8/8/20), активная #EE1D74. Плавающей кнопки корзины нет.">
        <KitPanel layout="grid" min={390}>
          <div className={s.phone}><MartTabBar active="home" /></div>
          <div className={s.phone}><MartTabBar active="catalog" cartCount={3} /></div>
          <div className={s.phone}><MartTabBar active="cart" cartCount={12} /></div>
          <div className={s.phone}><MartTabBar active="profile" cartCount={1} /></div>
        </KitPanel>
      </KitSection>
    </>
  );
}
