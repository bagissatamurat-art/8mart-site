'use client';
// «Поделиться» товаром из плеера видео и сторис: на телефоне — системное меню (Web Share API), иначе — ссылка в буфер.
// Как «Поделиться» в карточке товара (MartProductView).
import { asset } from '@/lib/basePath';
import type { Product } from '@/lib/types';

export const productHref = (id: string) => new URL(asset(`/product/${encodeURIComponent(id)}`), location.origin).href;

/** true — ссылку скопировали (показать «Ссылка скопирована»); false — открылось системное меню. */
export async function shareProduct(p: Pick<Product, 'id' | 'name'>, mobile: boolean): Promise<boolean> {
  const url = productHref(p.id);
  if (mobile && typeof navigator.share === 'function') {
    await navigator.share({ title: p.name, url }).catch(() => { /* закрыли меню */ });
    return false;
  }
  await navigator.clipboard?.writeText(url).catch(() => { /* нет доступа к буферу */ });
  return true;
}

/** Стрелка из коробки, цветом текста. */
export function ShareIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 15V3.5M7.5 8 12 3.5 16.5 8" />
      <path d="M5 12.5v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
    </svg>
  );
}
