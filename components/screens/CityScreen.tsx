'use client';
// Страница города (/dostavka-cvetov/<город>): заголовок с городом, магазины для самовывоза, букеты, условия. Без лишних блоков:
// всё, что ниже, покупатель реально спрашивает — где забрать, сколько везти, сколько стоит, как оплатить.
import Link from 'next/link';
import { Breadcrumbs } from '@/components/site/Breadcrumbs';
import { ProductShelf } from '@/components/site/ProductShelf';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteTabBar } from '@/components/site/SiteTabBar';
import { catalogPathOf } from '@/components/catalog/catalogUrl';
import { DELIVERY } from '@/lib/config';
import { plural, tg } from '@/lib/domain';
import { cityPath, CITY_IN } from '@/lib/seo';
import type { Category, City, PickupPoint, Product } from '@/lib/types';
import s from '@/components/site/site.module.css';
import c from './CityScreen.module.css';

interface Props { where: string; points: PickupPoint[]; products: Product[]; categories: Category[]; others: City[] }

export function CityScreen({ where, points, products, categories, others }: Props) {
  const eta = `${DELIVERY.etaMin}–${DELIVERY.etaMax}`;
  const shops = points.length === 1 ? 'магазине' : `${points.length} ${plural(points.length, 'магазине', 'магазинах', 'магазинах')}`;
  return (
    <div className={s.page}>
      <SiteHeader categories={categories} />
      <main className={c.wrap}>
        <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: `Доставка цветов ${where}` }]} />
        <header className={c.head}>
          <h1 className={c.h1}>Доставка цветов {where}</h1>
          <p className={c.lead}>
            Букеты из роз, гортензий и хризантем собираем в день заказа и привозим за {eta} минут. Забрать самому можно
            в {shops} 8mart {where}. Размеры S, M и L, к каждому букету — открытка и подкормка в подарок.
          </p>
        </header>

        {products.length > 0 && <ProductShelf title={`Букеты с доставкой ${where}`} href={catalogPathOf('tsvety')} products={products} />}

        <section className={c.card} aria-labelledby="shops">
          <h2 id="shops" className={c.h2}>Магазины 8mart {where}</h2>
          <ul className={c.shops}>
            {points.map(p => (
              <li key={p.id} className={c.shop}>
                <span className={c.shopName}>{p.name}{p.brand ? <span className={c.brand}>{p.brand}</span> : null}</span>
                <span className={c.muted}>{p.hours || 'График уточняйте по телефону'}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className={c.card} aria-labelledby="terms">
          <h2 id="terms" className={c.h2}>Доставка и оплата</h2>
          <dl className={c.terms}>
            <div><dt>Курьер</dt><dd>За {eta} минут после оплаты, от {tg(DELIVERY.fee)} — точная цена зависит от района. Бесплатно от {tg(DELIVERY.freeFrom)}.</dd></div>
            <div><dt>Ко времени</dt><dd>Интервалы 09:00–12:00, 12:00–15:00, 15:00–18:00, 18:00–21:00 — на сегодня и следующие дни.</dd></div>
            <div><dt>Самовывоз</dt><dd>Бесплатно. Соберём за 30–40 минут и пришлём уведомление, храним заказ до конца дня.</dd></div>
            <div><dt>Оплата</dt><dd>Kaspi Pay или картой онлайн. Бонусами — до 30% суммы.</dd></div>
          </dl>
        </section>

        {others.length > 0 && (
          <nav className={c.others} aria-label="Другие города">
            <span className={c.muted}>Доставляем и в других городах:</span>
            {others.map(o => <Link key={o.id} href={cityPath(o.id)}>{CITY_IN[o.id] ? `Доставка цветов ${CITY_IN[o.id]}` : o.name}</Link>)}
          </nav>
        )}
      </main>
      <SiteFooter categories={categories} />
      <SiteTabBar active="home" />
    </div>
  );
}
