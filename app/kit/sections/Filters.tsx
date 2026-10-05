'use client';
// Фильтры · MartFilters — как в site/UI Kit.dc.html (две панели: по умолчанию и с активными фильтрами)
// + сайдбар desktop, кнопки и листы mobile, сортировка (site/07 Каталог.dc.html).
import { useState } from 'react';
import type { SortId } from '@/lib/types';
import { MartButton } from '@/components/MartButton';
import { MartChip } from '@/components/MartChip';
import {
  MartFilters, MartFiltersButton, MartFiltersPanel, MartFiltersSheet, filterChips, hasActiveFilters, type FilterGroup, type FiltersValue,
} from '@/components/MartFilters';
import { MartSort, MartSortButton, MartSortSheet } from '@/components/MartSort';
import { KitSection, KitItem } from '../Kit';
import s from './Filters.module.css';

// Демо-группы — те же, что в MartFilters.dc.html (по умолчанию).
const GROUPS: FilterGroup[] = [
  { key: 'brands', title: 'Производитель', items: [['Heidelberg', 4], ['Knauf', 3], ['Alina', 2], ['Standart Cement', 2]] },
  { key: 'packs', title: 'Фасовка', items: [['до 5 кг', 3], ['25 кг', 6], ['50 кг', 2]] },
];
const EMPTY: FiltersValue = { min: '', max: '', brands: [], packs: [], inStock: false, sale: false };
const ACTIVE: FiltersValue = { min: '2000', max: '', brands: ['Knauf'], packs: ['25 кг'], inStock: true, sale: false };
/** Мок счётчика результата: без фильтров — 12, с фильтрами — 4 (как в UI Kit). */
const countFor = (v: FiltersValue) => (hasActiveFilters(v) ? 4 : 12);

export default function FiltersSection() {
  const [a, setA] = useState<FiltersValue>(EMPTY);
  const [b, setB] = useState<FiltersValue>(ACTIVE);
  const [side, setSide] = useState<FiltersValue>({ ...EMPTY, packs: ['25 кг'] });
  const [sort, setSort] = useState<SortId>('popular');
  const [sortOpen, setSortOpen] = useState(true);
  const [m, setM] = useState<FiltersValue>(ACTIVE);
  const [mSort, setMSort] = useState<SortId>('cheap');
  const [sheet, setSheet] = useState<null | 'filters' | 'sort'>(null);
  const noop = () => {};

  const sideChips = filterChips(side, GROUPS);
  const mChips = filterChips(m, GROUPS);

  return (
    <KitSection id="filters" title="Фильтры · MartFilters"
      note="Desktop — панель под категориями, применяется сразу; активные фильтры дублируются чипами над сеткой. Mobile — кнопка «Фильтры» открывает нижний лист с CTA «Показать · N товаров».">
      {/* Две панели из UI Kit: по умолчанию и с активными фильтрами. */}
      <div className={s.pair}>
        <KitItem label="По умолчанию · result-count 12">
          <div className={s.card}><MartFilters value={a} groups={GROUPS} resultCount={countFor(a)} onChange={setA} /></div>
        </KitItem>
        <KitItem label="Активные фильтры · result-count 4">
          <div className={s.card}><MartFilters value={b} groups={GROUPS} resultCount={countFor(b)} onChange={setB} /></div>
        </KitItem>
      </div>

      {/* Desktop: сайдбар 260 + чипы и сортировка над сеткой. */}
      <KitItem label="Desktop · сайдбар 260 (применяется сразу, «Сбросить») · чипы активных фильтров · сортировка — список 240 открыт">
        <div className={s.desk}>
          <div className={s.deskSide}>
            <MartFiltersPanel value={side} groups={GROUPS} resultCount={countFor(side)} showToggles onChange={setSide} />
          </div>
          <div className={s.deskMain}>
            <div className={s.bar}>
              <div className={s.chips}>
                {sideChips.map(c => <MartChip key={c.label} label={c.label} removable onClick={() => setSide(c.remove())} />)}
              </div>
              <MartSort value={sort} onChange={setSort} open={sortOpen} onOpenChange={setSortOpen} />
            </div>
          </div>
        </div>
      </KitItem>

      {/* Mobile: кнопки и листы в артборде 390 — видно без клика. */}
      <div className={s.phones}>
        <KitItem label="Mobile · лист «Фильтры» (CTA «Показать · N товаров»)">
          <div className={s.phone}>
            <MobileBar value={m} sort={mSort} />
            <MartFiltersSheet open contained autoFocus={false} onClose={noop} value={m} groups={GROUPS} resultCount={countFor(m)} onChange={setM} />
          </div>
        </KitItem>
        <KitItem label="Mobile · лист «Сортировка» (радио-строки 56)">
          <div className={s.phone}>
            <MobileBar value={m} sort={mSort} />
            <MartSortSheet open contained autoFocus={false} onClose={noop} value={mSort} onChange={setMSort} />
          </div>
        </KitItem>
        <KitItem label="Mobile · кнопки над списком и чипы; откройте настоящие листы">
          <div className={s.mobileDemo}>
            <div className={s.mobileHead}>
              <div className={s.scroller}>
                <MartFiltersButton count={mChips.length} onClick={() => setSheet('filters')} />
                <MartSortButton value={mSort} onClick={() => setSheet('sort')} />
              </div>
            </div>
            {mChips.length > 0 && (
              <div className={s.mChips}>{mChips.map(c => <MartChip key={c.label} label={c.label} removable onClick={() => setM(c.remove())} />)}</div>
            )}
            <div className={s.buttons}>
              <MartButton label="Открыть лист фильтров" variant="secondary" size={44} onClick={() => setSheet('filters')} />
              <MartButton label="Открыть сортировку" variant="ghost" size={44} onClick={() => setSheet('sort')} />
            </div>
          </div>
        </KitItem>
      </div>

      <MartFiltersSheet open={sheet === 'filters'} onClose={() => setSheet(null)} value={m} groups={GROUPS} resultCount={countFor(m)} onChange={setM} />
      <MartSortSheet open={sheet === 'sort'} onClose={() => setSheet(null)} value={mSort} onChange={setMSort} />
    </KitSection>
  );
}

/** Шапка списка mobile (07 Каталог, 390): кнопки «Фильтры» и сортировка — под листом. */
function MobileBar({ value, sort }: { value: FiltersValue; sort: SortId }) {
  return (
    <div className={s.mobileHead}>
      <div className={s.scroller}>
        <MartFiltersButton count={filterChips(value, GROUPS).length} />
        <MartSortButton value={sort} />
      </div>
    </div>
  );
}
