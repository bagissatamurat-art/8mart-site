'use client';
// Блоки правой колонки быстрого просмотра: фасовки, размер, цвет, CTA, способы получения, описание, характеристики.
import { useId, useState } from 'react';
import { COLOR_SWATCH } from '@/lib/config';
import { money } from '@/lib/domain';
import type { DeliveryType, Method, Product, Variant } from '@/lib/types';
import { MartButton } from '../MartButton';
import { MartStepper } from '../MartStepper';
import { Chevron } from '../ui/Cross';
import s from '../MartProductView.module.css';

// ── Фасовки (товары одной group) ──
export function Packs({ items, currentId, onPick }: { items: Product[]; currentId: string; onPick?: (id: string) => void }) {
  return (
    <div className={s.block10}>
      <b className={s.optTitle}>Фасовка</b>
      <div className={s.packs}>
        {items.map(x => {
          const on = x.id === currentId;
          return (
            <button key={x.id} type="button" className={`${s.opt} ${s.pack} ${on ? s.optOn : ''}`} aria-pressed={on}
              onClick={() => { if (!on) onPick?.(x.id); }}>
              <span className={s.packLabel}>{x.pack || x.weight}</span>
              <span className={s.optPrice}>{money(x.price)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Подсказка высоты букета — из референса (MartProductView.dc.html), совпадает с FLOWER_SPECS в моке.
const SIZE_HINT: Record<string, string> = { S: '35 см', M: '45 см', L: '55 см' };

// ── Размер (variants) ──
export function Sizes({ variants, current, onPick }: { variants: Variant[]; current: Variant; onPick: (id: string) => void }) {
  return (
    <div className={s.block10}>
      <span className={s.optHead}><b>Размер</b><span className={s.optHint}>{SIZE_HINT[current.size] || ''}</span></span>
      <div className={s.sizes}>
        {variants.map(v => {
          const on = v.id === current.id;
          return (
            <button key={v.id} type="button" className={`${s.opt} ${s.size} ${on ? s.optOn : ''}`} aria-pressed={on} onClick={() => onPick(v.id)}>
              <span className={s.sizeLabel}>{v.size}</span>
              <span className={s.optPrice}>{money(v.price)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Цвет (colors + COLOR_SWATCH) ──
export function Colors({ colors, current, note, onPick }: { colors: string[]; current: string; note?: string; onPick: (c: string) => void }) {
  return (
    <div className={s.block10}>
      <span className={`${s.optHead} ${s.wrap}`}><b>Цвет</b><span className={s.optHint}>{current}</span></span>
      <div className={s.swatches}>
        {colors.map(c => {
          const on = c === current;
          return (
            <button key={c} type="button" className={`${s.swatch} ${on ? s.swatchOn : ''}`} style={{ background: COLOR_SWATCH[c] || 'var(--divider)' }}
              aria-label={c} title={c} aria-pressed={on} onClick={() => onPick(c)} />
          );
        })}
      </div>
      {note && <span className={s.note13}>{note}</span>}
    </div>
  );
}

// ── CTA: «В корзину · цена» → степпер + «В корзине · сумма»; без цены — заблокировано ──
export function Cta({ price, qty, mobile, cartHref, onQty }: { price: number | null; qty: number; mobile: boolean; cartHref: string; onQty: (q: number) => void }) {
  if (price == null) return <MartButton label="Цена уточняется" size={56} full disabled reason="Цена пока не указана" />;
  if (qty <= 0) return <MartButton label="В корзину" amount={money(price)} size={56} full onClick={() => onQty(1)} />;
  return (
    <div className={mobile ? s.inCartM : s.inCart}>
      <MartStepper qty={qty} size={44} full onChange={q => onQty(Math.max(0, q))} />
      <MartButton label="В корзине" amount={money(price * qty)} variant="secondary" size={44} full href={cartHref} />
    </div>
  );
}

// ── Доставка / Самовывоз: выбранный способ первым с меткой «Ваш способ» ──
export function Ways({ type, method }: { type: DeliveryType; method?: Method | null }) {
  const ways = [
    { id: 'delivery' as const, title: 'Доставка', when: type.delivery.when, sub: type.delivery.price, note: type.delivery.note },
    { id: 'pickup' as const, title: 'Самовывоз', when: type.pickup.when, sub: type.pickup.where, note: type.pickup.note },
  ].sort((a, b) => Number(b.id === method) - Number(a.id === method));
  return (
    <div className={s.ways}>
      {ways.map(w => (
        <div key={w.id} className={s.way}>
          <div className={s.wayHead}>
            <b className={s.wayTitle}>{w.title}</b>
            {w.id === method && <span className={s.yours}>Ваш способ</span>}
          </div>
          <span className={s.wayWhen}>{w.when}</span>
          <span className={s.note13}>{w.sub}</span>
          {w.note && <span className={s.note13}>{w.note}</span>}
        </div>
      ))}
    </div>
  );
}

// Свёрнутое описание — ~5 строк (120px) при тексте длиннее 240 символов, как в референсе.
const DESC_LONG = 240;

// ── Описание: абзацы разделены \n ──
export function Description({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const paras = text.split('\n').map(t => t.trim()).filter(Boolean);
  if (!paras.length) return null;
  const long = paras.join(' ').length > DESC_LONG, collapsed = long && !open;
  return (
    <div className={s.block10}>
      <b className={s.h17}>Описание</b>
      <div className={`${s.desc} ${collapsed ? s.descCollapsed : ''}`} id={id}>
        {paras.map((t, i) => <p key={i} className={s.para}>{t}</p>)}
        {collapsed && <span className={s.fade} aria-hidden />}
      </div>
      {long && (
        <button type="button" className={`${s.more} ${s.more36}`} aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
          {open ? 'Свернуть' : 'Читать полностью'}<Chevron color="var(--primary)" direction={open ? 'up' : 'down'} />
        </button>
      )}
    </div>
  );
}

const SPEC_N = 6;

// ── Характеристики: первые 6 → «Все характеристики · N» ──
export function Specs({ specs }: { specs: [string, string][] }) {
  const [open, setOpen] = useState(false);
  if (!specs.length) return null;
  const long = specs.length > SPEC_N, rows = open ? specs : specs.slice(0, SPEC_N);
  return (
    <div className={s.specs}>
      <b className={`${s.h17} ${s.specsTitle}`}>Характеристики</b>
      <dl className={s.dl}>
        {rows.map(([k, v], i) => (
          <div key={i} className={s.specRow}><dt className={s.specK}>{k}</dt><dd className={s.specV}>{v}</dd></div>
        ))}
      </dl>
      {long && (
        <button type="button" className={`${s.more} ${s.more44}`} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? 'Свернуть' : `Все характеристики · ${specs.length}`}<Chevron color="var(--primary)" direction={open ? 'up' : 'down'} />
        </button>
      )}
    </div>
  );
}
