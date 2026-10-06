// Импорт цветов из каталога 8mart.kz → lib/flowers.ts (мок в форме API-контракта сайта).
// Источник: публичный API dukenfy-api.8mart.kz (тот же, что у 8mart.kz/catalog/tsvety), цены — филиала в Астане.
// Размеры S / M / L в каталоге — отдельные товары «НАЗВАНИЕ S|M|L»; здесь они — варианты одного букета.
// Запуск: node scripts/import-flowers.mjs  (перезаписывает lib/flowers.ts; руками файл не править).
import { writeFileSync } from 'node:fs';

const API = 'https://dukenfy-api.8mart.kz/api/v1';
const FILES = 'https://dukenfy-api.8mart.kz';
const CATEGORY = 'c0a7e0e0-0000-4000-8000-000000000003'; // «Цветы»
const BRANCH = { id: 'd45c8fea-de8a-497c-866e-e28e71e4b4a8', name: '8MART — Абылай хана 32, Астана' };
const SUBS = { 'b4170724-6f6d-428d-89c9-b03e2679ea16': 'gortenzii', '50997070-0f27-49a7-93f5-8a4d3cb1478c': 'rozy', 'b7c0b473-c64e-4cd9-ae15-e9179d98379c': 'hrizantemy' };
const SIZES = ['S', 'M', 'L'];

// Стабильные id букетов и вариантов (на них ссылаются корзина, избранное, тесты). Новый букет получит id из каталога.
const KNOWN = {
  'РОЗЫ МАНДАЛА': { id: 'f1', name: 'Розы Мандала', v: { S: 'f1-s', M: 'f2', L: 'f1' } },
  'КУСТОВЫЕ РОЗЫ В БУКЕТЕ': { id: 'f3', name: 'Кустовые розы в букете', v: { S: 'f3-s', M: 'f3-m', L: 'f3' } },
  'ГОРТЕНЗИЯ С ХРИЗАНТЕМАМИ': { id: 'f4', name: 'Гортензия с хризантемами', v: { S: 'f4-s', M: 'f4', L: 'f4-l' } },
  'ФРАНЦУЗСКИЕ РОЗЫ МАНДАЛА С ГОРТЕНЗИЕЙ': { id: 'f5', name: 'Французские розы Мандала с гортензией', v: { S: 'f5-s', M: 'f5-m', L: 'f5' } },
  'РОЗА МИКС': { id: 'f6', name: 'Роза микс', v: { S: 'f6-s', M: 'f6', L: 'f6-l' } },
  'ГОРТЕНЗИЯ С КУСТОВЫМИ РОЗАМИ': { id: 'f7', name: 'Гортензия с кустовыми розами', v: { S: 'f7-s', M: 'f7-m', L: 'f7' } },
  'ХРИЗАНТЕМА МОМОКО С РОЗАМИ МАНДАЛА': { id: 'f8', name: 'Хризантема Момоко с розами Мандала', v: { S: 'f8-s', M: 'f8-m', L: 'f8' } },
  'ХРИЗАНТЕМА С КУСТОВЫМИ РОЗАМИ': { id: 'f9', name: 'Хризантема с кустовыми розами', v: { S: 'f9-s', M: 'f9', L: 'f9-l' } },
  'ХРИЗАНТЕМА': { id: 'f10', name: 'Хризантема', v: { S: 'f10-s', M: 'f10-m', L: 'f10' } },
};
const sentence = (t) => t.charAt(0) + t.slice(1).toLowerCase();

const res = await fetch(`${API}/categories/${CATEGORY}/products?branchId=${BRANCH.id}&includeDescendants=true&page=0&size=200`);
if (!res.ok) throw new Error(`API ${res.status}`);
const { products } = await res.json();

const groups = new Map();
for (const p of products) {
  const m = p.title.trim().match(/^(.*?)\s+([SML])$/);
  const base = m ? m[1].trim() : p.title.trim(), size = m ? m[2] : 'M';
  if (!p.price) continue; // нет цены в филиале — не продаётся
  const g = groups.get(base) ?? { base, cat: SUBS[p.categoryId], items: {} };
  // Состав: строки описания; описание, равное названию, — не состав.
  const lines = String(p.description || '').split(/\r?\n/).map(s => s.trim().replace(/\s+;?$/, '')).filter(Boolean);
  const composition = lines.join(' ').toUpperCase() === base ? '' : lines.join(', ').replace(/\s+,/g, ',');
  g.items[size] = { price: p.price, img: FILES + p.image, composition, sourceId: p.id };
  groups.set(base, g);
}

const flowers = [], composition = {};
for (const g of groups.values()) {
  const known = KNOWN[g.base];
  const id = known?.id ?? 'f-' + Object.values(g.items)[0].sourceId.slice(0, 8);
  const sizes = SIZES.filter(s => g.items[s]);
  const variants = sizes.map(s => ({ id: known?.v[s] ?? `${id}-${s.toLowerCase()}`, size: s, price: g.items[s].price, img: g.items[s].img }));
  const largest = g.items[sizes[sizes.length - 1]];
  flowers.push({
    id, name: known?.name ?? sentence(g.base), weight: sizes.join(' · '), price: Math.min(...variants.map(v => v.price)),
    cat: g.cat, img: largest.img, variants, sizes, delivery: 'flowers', weightKg: 1,
  });
  composition[id] = sizes.map(s => [s, g.items[s].composition]).filter(([, c]) => c);
}
flowers.sort((a, b) => (a.cat + a.name).localeCompare(b.cat + b.name, 'ru'));

const date = new Date().toISOString().slice(0, 10);
const out = `// Сгенерировано scripts/import-flowers.mjs — НЕ ПРАВИТЬ РУКАМИ, перезапустить скрипт.
// Источник: каталог 8mart.kz (${API}), цены филиала «${BRANCH.name}», ${date}.
import type { Product } from './types';

export const FLOWERS_SOURCE = { api: '${API}', branch: '${BRANCH.name}', date: '${date}' };

export const FLOWERS: Product[] = ${JSON.stringify(flowers, null, 2)};

/** Состав букета по размерам (из описания товара в каталоге). */
export const FLOWER_COMPOSITION: Record<string, [string, string][]> = ${JSON.stringify(composition, null, 2)};
`;
writeFileSync(new URL('../lib/flowers.ts', import.meta.url), out);
console.log(`flowers: ${flowers.length} букетов, ${flowers.reduce((n, f) => n + f.variants.length, 0)} вариантов → lib/flowers.ts`);
