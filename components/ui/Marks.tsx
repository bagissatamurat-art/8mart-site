// Индикаторы выбора внутри кнопок-строк (сама строка — button с role="radio" / role="switch").
// Радио 20, рамка 2, точка 10 (сортировка, вклад «Способ», оплата, точки самовывоза); переключатель 40×24, бегунок 20.
import s from './marks.module.css';

/** strong — рамка --border-strong (варианты доставки, 02 Корзина). */
export function RadioMark({ on, strong, className }: { on: boolean; strong?: boolean; className?: string }) {
  return <span className={[s.radio, strong && s.strong, on && s.radioOn, className].filter(Boolean).join(' ')} aria-hidden />;
}

/** Чекбокс 20, r6, рамка 1.5; галочка — геометрией (фильтры, согласие с офертой). */
export function CheckMark({ on, className }: { on: boolean; className?: string }) {
  return <span className={[s.box, on && s.boxOn, className].filter(Boolean).join(' ')} aria-hidden><span className={s.tick} /></span>;
}

/** tone bonus — зелёный «Списать бонусы» (03 Оформление). */
export function SwitchMark({ on, tone = 'primary' }: { on: boolean; tone?: 'primary' | 'bonus' }) {
  return <span className={`${s.switch} ${on ? (tone === 'bonus' ? s.switchBonus : s.switchOn) : ''}`} aria-hidden><span className={s.knob} /></span>;
}
