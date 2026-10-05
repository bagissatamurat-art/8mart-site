'use client';
// Витрина: шапка (MartHeader + боковое меню) и поиск (MartSearch, экран поиска mobile).
// Desktop — рамки 1152, mobile — 390. Меню показано статично (contained) и вживую — по кнопке меню в шапке.
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MartHeader, MartSideMenu } from '@/components/MartHeader';
import { MartSearch, MartSearchScreen, type SearchSuggest } from '@/components/MartSearch';
import { searchSuggest } from '@/lib/api';
import { BONUS, CATEGORIES, FAVORITES, ORDERS, USER, USER_PROMOS } from '@/lib/mock';
import { KitItem, KitSection } from '../Kit';

const ADDRESS = 'Астана, Кабанбай батыра, 11';
const RECENT = ['цемент 50 кг', 'гипсокартон', 'розы'];
const BADGES = { favorites: FAVORITES.length, promos: USER_PROMOS.filter(p => p.status === 'active').length, bonus: BONUS.balance };
const userProps = { userName: USER.name, userPhone: USER.phone, orders: ORDERS, accountBadges: BADGES };
const noop = () => {};

/** Подсказки через слой данных (lib/api.ts → GET /search/suggest). */
function useSuggest(q: string): SearchSuggest | undefined {
  const [res, setRes] = useState<{ q: string; data: SearchSuggest }>();
  useEffect(() => {
    let alive = true;
    searchSuggest(q).then(data => { if (alive) setRes({ q, data }); });
    return () => { alive = false; };
  }, [q]);
  return res && res.q === q ? res.data : undefined;
}

const page: React.CSSProperties = { background: 'var(--surface-page)', borderRadius: 'var(--r-20)', overflow: 'hidden' };
const scroll: React.CSSProperties = { overflowX: 'auto', margin: '0 -4px', padding: '0 4px' };
const desk: React.CSSProperties = { ...page, width: 1152, flex: 'none' };
const phone: React.CSSProperties = { ...page, width: 390, flex: 'none' };
const row: React.CSSProperties = { display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' };

/** Живая шапка: ввод → подсказки. Гость — меню внутри рамки (contained), пользователь — на весь экран (Esc / фон / крестик). */
function LiveDesktop({ user }: { user?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const suggest = useSuggest(q);
  return (
    <div style={{ ...desk, position: 'relative', height: user ? 80 : 640 }}>
      <MartHeader mode="desktop" method={user ? 'delivery' : null} address={user ? ADDRESS : ''} categories={CATEGORIES}
        {...(user ? userProps : {})} query={q} onQuery={setQ} contained={!user} onMethod={noop}
        searchPanel={<MartSearch query={q} suggest={suggest} recent={RECENT} onQuery={setQ}
          onPick={p => router.push(`/product/${p.id}`)} onCategory={slug => router.push(`/catalog?cat=${slug}`)}
          onSubmit={v => router.push(`/search?q=${encodeURIComponent(v)}`)} />} />
    </div>
  );
}

/** Шапка с открытыми подсказками (поле в фокусе, затемнение 0.35, панель 575). */
function FocusedDesktop({ q, height }: { q: string; height: number }) {
  const suggest = useSuggest(q);
  return (
    <div style={{ ...desk, position: 'relative', height }}>
      <MartHeader mode="desktop" method="delivery" address={ADDRESS} {...userProps} categories={CATEGORIES} query={q} searchFocused contained
        searchPanel={<MartSearch query={q} suggest={suggest} recent={RECENT} />} />
    </div>
  );
}

function SearchPanelDemo({ q, recent }: { q: string; recent?: string[] }) {
  const suggest = useSuggest(q);
  return <MartSearch query={q} suggest={suggest} recent={recent} />;
}

function SearchScreenDemo({ q }: { q: string }) {
  const [query, setQuery] = useState(q);
  const suggest = useSuggest(query);
  return (
    <div style={{ ...phone, height: 760, background: 'var(--surface-card)' }}>
      <MartSearchScreen query={query} onQuery={setQuery} suggest={suggest} recent={RECENT} onBack={noop} onSubmit={noop} />
    </div>
  );
}

export default function HeaderSection() {
  return (
    <>
      <KitSection id="header" title="Шапка · MartHeader"
        note="Desktop 80: лого · способ получения (точка: выбран — зелёная, не выбран — оранжевая) · поиск (фокус — розовый бордер + кольцо) · кнопка меню. Корзины в шапке нет. Меню — панель справа 420, затемнение, крестик, Esc, клик по фону. Mobile 124 — белый блок r24 снизу.">
        <div style={scroll}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: 1152 }}>
            <KitItem label="Способ не выбран · гость — «Как получить заказ?», «Войти». Живая: введите запрос или откройте меню (внутри рамки)">
              <LiveDesktop />
            </KitItem>
            <KitItem label="Доставка выбрана · пользователь (аватар-инициал). Кнопка меню открывает панель на весь экран">
              <LiveDesktop user />
            </KitItem>
            <KitItem label="Самовывоз · пользователь · запрос введён (кнопка очистки)">
              <div style={desk}>
                <MartHeader mode="desktop" method="pickup" address="пр. Мангилик Ел, 55" {...userProps} categories={CATEGORIES} query="цемент" />
              </div>
            </KitItem>
            <KitItem label="Доставка без адреса — «Укажите адрес»">
              <div style={desk}><MartHeader mode="desktop" method="delivery" /></div>
            </KitItem>
            <KitItem label="Поиск в фокусе — розовый бордер + кольцо, подсказки под полем, затемнение">
              <FocusedDesktop q="" height={520} />
            </KitItem>
            <KitItem label="Поиск в фокусе · ввод «роз» — категории и товары">
              <FocusedDesktop q="роз" height={560} />
            </KitItem>
            <div style={{ display: 'flex', gap: 20 }}>
              <KitItem label="Меню · гость — плашка «Войдите» + «Войти»">
                <div style={{ ...page, position: 'relative', width: 560, height: 860 }}>
                  <MartSideMenu categories={CATEGORIES} contained autoFocus={false} onClose={noop} />
                </div>
              </KitItem>
              <KitItem label="Меню · пользователь — профиль, активный заказ, разделы со счётчиками, «Выйти»">
                <div style={{ ...page, position: 'relative', width: 560, height: 1080 }}>
                  <MartSideMenu {...userProps} categories={CATEGORIES} contained autoFocus={false} onClose={noop} />
                </div>
              </KitItem>
            </div>
          </div>
        </div>
        <div style={row}>
          <KitItem label="Mobile 124 · способ не выбран">
            <div style={phone}><MartHeader mode="mobile" method={null} onMethod={noop} /></div>
          </KitItem>
          <KitItem label="Mobile · доставка с адресом">
            <div style={phone}><MartHeader mode="mobile" method="delivery" address={ADDRESS} onMethod={noop} /></div>
          </KitItem>
          <KitItem label="Mobile · самовывоз без адреса · поиск в фокусе">
            <div style={phone}><MartHeader mode="mobile" method="pickup" searchFocused onMethod={noop} /></div>
          </KitItem>
        </div>
      </KitSection>

      <KitSection id="search" title="Поиск · MartSearch"
        note="Пусто — «Вы искали» + «Часто ищут» (чипы); ввод — категории (до 2) и товары (строка 60, фото 44 r10, совпадение жирным, цена справа), «Показать все N»; ничего не нашли — подсказка и чипы. Desktop — панель под полем (5 товаров), mobile — отдельный экран (6 товаров). Данные — searchSuggest() из lib/api.ts.">
        <div style={row}>
          <KitItem label="Desktop · пусто — недавние + популярные" style={{ width: 575 }}>
            <SearchPanelDemo q="" recent={RECENT} />
          </KitItem>
          <KitItem label="Desktop · пусто, истории нет" style={{ width: 575 }}>
            <SearchPanelDemo q="" />
          </KitItem>
          <KitItem label="Desktop · ввод «роз» — категории + товары + «Показать все N»" style={{ width: 575 }}>
            <SearchPanelDemo q="роз" />
          </KitItem>
          <KitItem label="Desktop · ввод «цем» — только товары" style={{ width: 575 }}>
            <SearchPanelDemo q="цем" />
          </KitItem>
          <KitItem label="Desktop · ничего не нашли" style={{ width: 575 }}>
            <SearchPanelDemo q="бетономешалка" />
          </KitItem>
        </div>
        <div style={row}>
          <KitItem label="Mobile · экран поиска, пусто"><SearchScreenDemo q="" /></KitItem>
          <KitItem label="Mobile · ввод «цем»"><SearchScreenDemo q="цем" /></KitItem>
          <KitItem label="Mobile · ничего не нашли"><SearchScreenDemo q="бетономешалка" /></KitItem>
        </div>
      </KitSection>
    </>
  );
}
