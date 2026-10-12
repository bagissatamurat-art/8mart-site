// Страница товара на телефоне: сразу отдаём мобильную вёрстку (app/product/[id]/m), а не desktop с перестройкой после гидрации —
// так нет сдвига макета, а первое фото грузится нужного размера. Адрес в браузере не меняется; обе версии статические.
import { NextResponse, type NextRequest } from 'next/server';
import { isMobileUA } from '@/lib/device';

export function proxy(req: NextRequest) {
  if (!isMobileUA(req.headers.get('user-agent'))) return;
  const url = req.nextUrl.clone();
  url.pathname = `${url.pathname.replace(/\/$/, '')}/m`;
  return NextResponse.rewrite(url);
}

export const config = { matcher: '/product/:id' };
