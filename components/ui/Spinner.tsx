import s from './ui.module.css';

/** Спиннер. current — полукольцо цветом текста (кнопки); track — кольцо --border с верхом primary (строки статуса). */
export function Spinner({ size = 20, variant = 'current' }: { size?: number; variant?: 'current' | 'track' }) {
  return <span className={variant === 'track' ? `${s.spinner} ${s.spinnerTrack}` : s.spinner} style={{ width: size, height: size }} aria-hidden />;
}

/** Скелетон: пульс opacity .5↔1, 1.4 с. */
export function Skeleton({ w = '100%', h = 16, r = 8, style }: { w?: number | string; h?: number | string; r?: number; style?: React.CSSProperties }) {
  return <span className={s.skeleton} style={{ width: w, height: h, borderRadius: r, ...style }} aria-hidden />;
}

/** Скелетон карточки товара в сетке (каталог, поиск, загрузка страницы). */
export function CardSkeleton({ className }: { className?: string }) {
  return <div className={className ? `${s.cardSkel} ${className}` : s.cardSkel} aria-hidden><span /><span /><span /></div>;
}
