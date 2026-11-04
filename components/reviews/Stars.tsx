// Звёзды оценки — геометрией (SVG), не символом шрифта. value 0–5; дробная часть закрашивает звезду частично
// (средняя 4,6 — четыре полных и шесть десятых пятой). Закрашенные — --star (розовый), пустые — --star-off.
import { useId } from 'react';
import s from '../MartReviews.module.css';

/** Звезда 24×24 (контур с мягкими углами). */
export const STAR_PATH = 'M12 2.8a1 1 0 0 1 .9.56l2.38 4.83 5.33.77a1 1 0 0 1 .55 1.7l-3.85 3.76.9 5.3a1 1 0 0 1-1.45 1.06L12 18.3l-4.76 2.5a1 1 0 0 1-1.45-1.07l.9-5.3-3.85-3.75a1 1 0 0 1 .55-1.71l5.33-.77 2.38-4.83A1 1 0 0 1 12 2.8Z';

/** «4,8» — одна цифра после запятой, по-русски. */
export const ratingText = (v: number) => (Math.round(v * 10) / 10).toFixed(1).replace('.', ',');

export function Stars({ value, size = 16, label, className }: {
  value: number; size?: number;
  /** Подпись для скринридера («Оценка 4,8 из 5»); без неё звёзды скрыты от него — число рядом читается текстом. */
  label?: string; className?: string;
}) {
  const id = `st${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const gap = Math.max(1, Math.round(size / 8));
  const v = Math.min(5, Math.max(0, value));
  const full = Math.floor(v);
  const fill = full * (size + gap) + (v - full) * size;
  const width = size * 5 + gap * 4;
  const row = (color: string) => [0, 1, 2, 3, 4].map(i => (
    <path key={i} d={STAR_PATH} fill={color} transform={`translate(${i * (size + gap)} 0) scale(${size / 24})`} />
  ));
  return (
    <span className={`${s.stars} ${className ?? ''}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <svg width={width} height={size} viewBox={`0 0 ${width} ${size}`} focusable="false" aria-hidden>
        <defs><clipPath id={id}><rect width={fill} height={size} /></clipPath></defs>
        {row('var(--star-off)')}
        <g clipPath={`url(#${id})`}>{row('var(--star)')}</g>
      </svg>
    </span>
  );
}
