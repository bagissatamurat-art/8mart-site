// Цветы — настоящий каталог 8mart.kz (lib/flowers.ts, scripts/import-flowers.mjs): форма данных и корзина.
import { describe, expect, it } from 'vitest';
import { FLOWERS, FLOWER_COMPOSITION } from './flowers';
import { CATEGORIES, PRODUCTS } from './mock';
import { cartItem } from './domain/catalog';

describe('цветы из каталога 8mart.kz', () => {
  it('букеты — варианты S/M/L с ценами, фото из API, подкатегории цветов', () => {
    const subs = CATEGORIES.find(c => c.slug === 'tsvety')!.sub.map(s => s.slug);
    expect(FLOWERS.length).toBeGreaterThan(0);
    for (const f of FLOWERS) {
      expect(subs).toContain(f.cat);
      expect(f.delivery).toBe('flowers');
      expect(f.variants!.length).toBeGreaterThan(0);
      for (const v of f.variants!) {
        expect(['S', 'M', 'L']).toContain(v.size);
        expect(v.price).toBeGreaterThan(0);
        expect(v.img).toMatch(/^https:\/\/dukenfy-api\.8mart\.kz\/api\/v1\/catalog\/files\//);
      }
      expect(f.price).toBe(Math.min(...f.variants!.map(v => v.price))); // «от» — самый маленький размер
    }
  });
  it('цветы — первыми в каталоге и в категориях', () => {
    expect(CATEGORIES[0].slug).toBe('tsvety');
    expect(PRODUCTS.slice(0, FLOWERS.length).every(p => p.delivery === 'flowers')).toBe(true);
  });
  it('каждый вариант кладётся в корзину с ценой своего размера', () => {
    for (const f of FLOWERS) for (const v of f.variants!) {
      expect(cartItem(v.id, PRODUCTS)).toMatchObject({ id: v.id, name: `${f.name}, ${v.size}`, price: v.price });
    }
  });
  it('состав по размерам — непустые строки', () => {
    for (const rows of Object.values(FLOWER_COMPOSITION)) for (const [size, text] of rows) {
      expect(['S', 'M', 'L']).toContain(size);
      expect(text.length).toBeGreaterThan(3);
    }
  });
});
