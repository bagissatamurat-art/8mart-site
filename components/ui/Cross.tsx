// Крестик — геометрией (две полосы), не символом шрифта.
import s from './ui.module.css';

export function Cross({ size = 14, color = 'var(--ink-2)', thickness = 2 }: { size?: number; color?: string; thickness?: number }) {
  const bar = { width: size, height: thickness, top: (size - thickness) / 2, background: color };
  return (
    <span className={s.cross} style={{ width: size, height: size }} aria-hidden>
      <span style={{ ...bar, transform: 'rotate(45deg)' }} />
      <span style={{ ...bar, transform: 'rotate(-45deg)' }} />
    </span>
  );
}

/** Шеврон-уголок (border-right + border-bottom), direction — куда смотрит остриё. */
export function Chevron({ size = 7, color = 'var(--ink-2)', direction = 'down' }: { size?: number; color?: string; direction?: 'down' | 'up' | 'left' | 'right' }) {
  const rot = { down: 45, right: -45, up: -135, left: 135 }[direction];
  return <span className={s.chevron} aria-hidden style={{ width: size, height: size, borderColor: color, transform: `rotate(${rot}deg)`, marginTop: direction === 'down' ? -3 : direction === 'up' ? 3 : 0 }} />;
}

/** Галочка (выбранный пункт списка). */
export function Check({ color = 'var(--primary)' }: { color?: string }) {
  return <span className={s.check} aria-hidden style={{ borderColor: color }} />;
}
