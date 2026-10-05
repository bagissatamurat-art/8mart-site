import s from './ui.module.css';

export function Spinner({ size = 20 }: { size?: number }) {
  return <span className={s.spinner} style={{ width: size, height: size }} aria-hidden />;
}

/** Скелетон: пульс opacity .5↔1, 1.4 с. */
export function Skeleton({ w = '100%', h = 16, r = 8, style }: { w?: number | string; h?: number | string; r?: number; style?: React.CSSProperties }) {
  return <span className={s.skeleton} style={{ width: w, height: h, borderRadius: r, ...style }} aria-hidden />;
}
