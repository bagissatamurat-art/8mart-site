// Размытые превью фото (blurDataURL) → lib/blur.ts: пока грузится фото, next/image показывает размытое пятно этого фото, а не серый фон.
// Фото букетов из каталога (lib/flowers.ts) + картинки главной и сторис из public/assets. Превью — WebP 16 px, ~200 байт.
// Запуск: node scripts/make-blur.mjs (входит в npm run import:catalog).
import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const root = new URL('..', import.meta.url);
const remote = [...new Set(readFileSync(new URL('lib/flowers.ts', root), 'utf8').match(/https:\/\/dukenfy-api\.8mart\.kz\/[^"']+\.(?:png|jpe?g|webp)/g) ?? [])];
const local = ['banner-flowers.jpg', 'st-flowers.jpg', 'st-delivery.jpg', 'st-gifts.jpg', 'st-sale.jpg', 'cat-flowers.png', 'cat-build.png', 'cat-tools.png', 'cat-home.png', 'cat-goods.png'].map(f => `/assets/${f}`);

const tiny = async (buf) => 'data:image/webp;base64,' + (await sharp(buf).resize(16, 16, { fit: 'inside' }).webp({ quality: 40 }).toBuffer()).toString('base64');
const out = {};
for (const url of remote) {
  const r = await fetch(url);
  if (!r.ok) { console.warn('skip', r.status, url); continue; }
  out[url] = await tiny(Buffer.from(await r.arrayBuffer()));
}
for (const p of local) {
  try { out[p] = await tiny(readFileSync(new URL('public' + p, root))); } catch { console.warn('skip', p); }
}
writeFileSync(new URL('lib/blur.ts', root), `// Сгенерировано scripts/make-blur.mjs — НЕ ПРАВИТЬ РУКАМИ.
/** Размытые превью фото по адресу (удалённые — полный URL, локальные — путь /assets/…). Берёт components/ui/Img. */
export const BLUR: Record<string, string> = ${JSON.stringify(out, null, 1)};
`);
console.log(`blur: ${Object.keys(out).length} превью → lib/blur.ts`);
