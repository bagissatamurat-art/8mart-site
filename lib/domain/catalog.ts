// Каталог и корзина: разбор позиции, бонусы, условия получения. Перенесено 1:1 из data.js.
import { DELIVERY_TYPES } from '../config';
import type { CartProduct, DeliveryType, Product, ProductConditions } from '../types';

/** Бонусы за строки корзины: product.bonus за 1 шт × qty. Принимает [{p, qty}] или товары. */
export function bonusFor(lines: ({ p?: Pick<Product, 'bonus'>; bonus?: number; qty?: number })[]): number {
  return lines.reduce((s, l) => s + ((l.p || l).bonus || 0) * (l.qty || 1), 0);
}

/** Разбор позиции корзины '<id>|<цвет>' → товар с размером/цветом. */
export function cartItem(key: string, products: Product[]): CartProduct | null {
  const [id, color] = String(key).split('|');
  const x = products.find(q => q.id === id && !q.variants);
  if (x) return color ? { ...x, id: key, name: x.name + ', ' + color.toLowerCase(), color } : x;
  for (const g of products) if (g.variants) {
    const v = g.variants.find(v => v.id === id);
    if (v) return { ...g, id: key, name: g.name + ', ' + v.size + (color ? ', ' + color.toLowerCase() : ''), price: v.price, img: v.img, variant: v.size, color };
  }
  return null;
}

/** Ключ позиции корзины для цветов/колеровки. */
export function cartKey(id: string, color?: string): string {
  return color ? `${id}|${color}` : id;
}

// Условия получения задаются на товаре (админка): product.conditions поверх шаблона DELIVERY_TYPES[product.delivery].
export function mergeConditions(base: DeliveryType, own?: ProductConditions): DeliveryType {
  if (!own) return base;
  return { tag: own.tag ?? base.tag, delivery: { ...base.delivery, ...(own.delivery || {}) }, pickup: { ...base.pickup, ...(own.pickup || {}) } };
}

export function deliveryConditions(p: Pick<Product, 'delivery' | 'conditions'>): DeliveryType {
  return mergeConditions(DELIVERY_TYPES[p.delivery || 'express'] || DELIVERY_TYPES.express, p.conditions);
}

/** Скидка в процентах для бейджа «−N%». */
export function discountPct(p: Pick<Product, 'price' | 'oldPrice'>): number {
  return p.oldPrice && p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
}
