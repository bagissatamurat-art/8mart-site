// Перед рендером страницы:
// 1) Старые адреса каталога /catalog?cat=<cat>&sub=<sub> — навсегда (301) на /catalog/<cat>/<sub>, остальные параметры сохраняются.
// 2) Страница товара на телефоне: сразу отдаём мобильную вёрстку (app/product/[id]/m), а не desktop с перестройкой после гидрации —
//    так нет сдвига макета, а первое фото грузится нужного размера. Адрес в браузере не меняется; обе версии статические.
import { NextResponse, type NextRequest } from 'next/server';
import { catalogPathOf } from '@/components/catalog/catalogUrl';
import { isMobileUA } from '@/lib/device';

const SLUG = /^[a-z0-9-]{1,48}$/;

export function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  if (url.pathname === '/catalog') {
    const cat = url.searchParams.get('cat'), sub = url.searchParams.get('sub');
    if (!cat || !SLUG.test(cat) || (sub && !SLUG.test(sub))) return;
    url.searchParams.delete('cat');
    url.searchParams.delete('sub');
    url.pathname = catalogPathOf(cat, sub);
    return NextResponse.redirect(url, 301);
  }
  if (!isMobileUA(req.headers.get('user-agent'))) return;
  url.pathname = `${url.pathname.replace(/\/$/, '')}/m`;
  return NextResponse.rewrite(url);
}

export const config = { matcher: ['/product/:id', '/catalog'] };
