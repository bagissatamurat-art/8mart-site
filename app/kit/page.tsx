import type { Metadata } from 'next';
import Foundations from './sections/Foundations';
import Controls from './sections/Controls';
import Filters from './sections/Filters';
import Stories from './sections/Stories';
import Catalog from './sections/Catalog';
import Cart from './sections/Cart';
import Header from './sections/Header';
import ProductView from './sections/ProductView';
import MethodModal from './sections/MethodModal';
import Auth from './sections/Auth';
import Account from './sections/Account';
import Site from './sections/Site';
import Checkout from './sections/Checkout';
import s from './kit.module.css';
import { asset } from '@/lib/basePath';

export const metadata: Metadata = { title: 'UI Kit', robots: { index: false } };

const TOC: [string, string][] = [
  ['colors', 'Цвета'], ['type', 'Типографика'], ['radii', 'Радиусы'], ['button', 'Кнопка'], ['input', 'Инпут'], ['promo', 'Промокод'],
  ['shipments', 'Отправления'], ['stepper', 'Счётчик'], ['chips', 'Чипы'], ['filters', 'Фильтры'], ['stories', 'Сторис'], ['banner', 'Баннер'],
  ['card', 'Карточка товара'], ['badges', 'Бейджи и алерты'], ['cart', 'Корзина'], ['tabbar', 'Таб-бар'], ['header', 'Шапка'], ['search', 'Поиск'],
  ['product', 'Быстрый просмотр'], ['method', 'Способ получения'], ['auth', 'Вход'], ['account', 'Кабинет'],
  ['sidebar', 'Сайдбар'], ['shelf', 'Полка'], ['toast', 'Тост'],
  ['checkout-controls', 'Оформление'], ['checkout-summary', 'Итоги'], ['order-track', 'Статус заказа'], ['topbar', 'Шапка экрана'],
];

export default function KitPage() {
  return (
    <main className={s.page}>
      <header className={s.header}>
        <img src={asset('/assets/logo.svg')} alt="8mart" className={s.logo} />
        <h1 className={s.h1}>UI Kit</h1>
        <p className={s.lead}>Единый источник правды для экранов 8mart. Шрифт Onest, шаг отступов 4, высоты контролов 36 / 40 / 44 / 56 (textarea 84), строки списков 48 / 60.</p>
        <nav className={s.toc} aria-label="Разделы витрины">{TOC.map(([id, t]) => <a key={id} href={`#${id}`}>{t}</a>)}</nav>
      </header>
      <Foundations />
      <Controls />
      <Filters />
      <Stories />
      <Catalog />
      <Cart />
      <Header />
      <ProductView />
      <MethodModal />
      <Auth />
      <Account />
      <Site />
      <Checkout />
    </main>
  );
}
