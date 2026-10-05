// Цвета, типографика, радиусы/тени/motion — как в site/UI Kit.dc.html. Значения — из styles/tokens.css.
import { KitSection } from '../Kit';
import { DELIVERY } from '@/lib/config';
import { money } from '@/lib/domain';
import s from './sections.module.css';

const COLORS: [string, string, boolean?][] = [
  ['primary', '--primary'], ['primary-hover', '--primary-hover'], ['primary-active', '--primary-active'], ['primary-200', '--primary-200'],
  ['primary-100', '--primary-100'], ['primary-50', '--primary-50'], ['ink-1', '--ink-1'], ['ink-2', '--ink-2'], ['ink-3', '--ink-3'],
  ['surface-page', '--surface-page', true], ['surface-card', '--surface-card', true], ['surface-subtle', '--surface-subtle', true],
  ['border', '--border'], ['divider', '--divider'], ['success', '--success'], ['warning', '--warning'], ['danger', '--danger'], ['kaspi', '--kaspi'],
];
const HEX: Record<string, string> = {
  '--primary': '#EE1D74', '--primary-hover': '#D6136A', '--primary-active': '#BF0F5E', '--primary-200': '#F7B4D1', '--primary-100': '#FBDCEA', '--primary-50': '#FDF0F6',
  '--ink-1': '#17151A', '--ink-2': '#6B6873', '--ink-3': '#9E9BA6', '--surface-page': '#F2F2F4', '--surface-card': '#FFFFFF', '--surface-subtle': '#F7F7F8',
  '--border': '#E3E2E7', '--divider': '#EEEDF1', '--success': '#1DA765', '--warning': '#F59E0B', '--danger': '#E23D3D', '--kaspi': '#F14635',
};

const TYPE: [string, React.CSSProperties, React.ReactNode][] = [
  ['display 40/800', { fontSize: 'var(--fs-display)', fontWeight: 800, letterSpacing: 'var(--tracking-tight)', lineHeight: 'var(--lh-display)' }, 'Доставим за 60–90 мин'],
  ['h1 32/800', { fontSize: 'var(--fs-h1)', fontWeight: 800, letterSpacing: 'var(--tracking-tight)', lineHeight: 'var(--lh-h1)' }, 'Корзина · 3 товара'],
  ['h2 24/700', { fontSize: 'var(--fs-h2)', fontWeight: 700, lineHeight: 'var(--lh-h2)' }, 'Стройматериалы'],
  ['h3 18/600', { fontSize: 'var(--fs-h3)', fontWeight: 600, lineHeight: 'var(--lh-h3)' }, 'Способ получения'],
  ['body 16/400', { fontSize: 'var(--fs-body)', lineHeight: 'var(--lh-body)' }, `Бесплатная доставка от ${money(DELIVERY.freeFrom).replace('тг.', 'тг')}, иначе ${money(DELIVERY.fee).replace('тг.', 'тг')}`],
  ['small 14/400', { fontSize: 'var(--fs-small)', lineHeight: 'var(--lh-small)', color: 'var(--ink-2)' }, 'Цены и наличие зависят от филиала'],
  ['caption 12/500', { fontSize: 'var(--fs-caption)', fontWeight: 500, color: 'var(--ink-3)' }, '50 кг · Товар дня'],
  ['price 16/700', { fontSize: 16, fontWeight: 700 }, <>4 090 тг. <s style={{ fontWeight: 400, color: 'var(--ink-3)', fontSize: 13 }}>4 590 тг.</s></>],
];

const TILES: [string, React.CSSProperties][] = [
  ['r-8 бейдж', { borderRadius: 'var(--r-8)' }], ['r-12 фото', { borderRadius: 'var(--r-12)' }], ['r-16 инпут', { borderRadius: 'var(--r-16)' }],
  ['r-20 карточка', { borderRadius: 'var(--r-20)' }], ['r-24 панель', { borderRadius: 'var(--r-24)' }], ['pill кнопки', { borderRadius: 'var(--r-pill)' }],
  ['shadow-1', { borderRadius: 'var(--r-20)', boxShadow: 'var(--shadow-1)' }], ['shadow-2', { borderRadius: 'var(--r-20)', boxShadow: 'var(--shadow-2)' }],
];

export default function Foundations() {
  return (
    <>
      <KitSection id="colors" title="Цвета">
        <div className={s.swatches}>
          {COLORS.map(([name, v, bordered]) => (
            <div key={name} className={s.swatch}>
              <div className={s.swatchColor} style={{ background: `var(${v})`, border: bordered ? '1px solid var(--border)' : undefined }} />
              <b>{name}</b><span>{HEX[v]}</span>
            </div>
          ))}
        </div>
      </KitSection>
      <KitSection id="type" title="Типографика · Onest">
        <div className={s.typePanel}>
          {TYPE.map(([k, st, sample]) => <div key={k} className={s.typeRow}><span className={s.typeKey}>{k}</span><span style={st}>{sample}</span></div>)}
        </div>
      </KitSection>
      <KitSection id="radii" title="Радиусы · Тени · Motion">
        <div className={s.tiles}>
          {TILES.map(([k, st]) => <div key={k} className={s.tile} style={st}>{k}</div>)}
          <div className={s.tile} style={{ borderRadius: 'var(--r-20)', textAlign: 'center' }}>150 ms ease<br />hover/focus</div>
        </div>
      </KitSection>
    </>
  );
}
