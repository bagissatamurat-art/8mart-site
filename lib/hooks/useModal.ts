'use client';
// Общее поведение модальных слоёв (быстрый просмотр, способ получения, лист, меню, сторис, вход, подтверждение):
// Esc закрывает, Tab не уходит из диалога, фокус — внутрь и обратно, прокрутка страницы заблокирована.
// Слои лежат в стеке: Esc и Tab обрабатывает только верхний — модалка способа поверх быстрого просмотра закрывается одна.
import { useEffect, useEffectEvent, type RefObject } from 'react';

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),iframe,[tabindex]:not([tabindex="-1"])';

interface Layer { ref: RefObject<HTMLElement | null>; close: () => void; trap: boolean }
const stack: Layer[] = [];
let locks = 0;
let savedOverflow = '';

// Слушатель на window (всплытие) срабатывает после React-обработчиков: список внутри модалки
// (подсказки адреса, города, сортировка) гасит свой Esc через preventDefault — модалка тогда остаётся.
function onKey(e: KeyboardEvent) {
  const top = stack[stack.length - 1];
  if (!top) return;
  if (e.key === 'Escape') {
    if (!e.defaultPrevented) { e.preventDefault(); top.close(); }
    return;
  }
  const box = top.ref.current;
  if (e.key !== 'Tab' || !top.trap || !box) return;
  const els = [...box.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(el => el.offsetParent !== null || el === document.activeElement);
  if (!els.length) { e.preventDefault(); return; }
  const first = els[0], last = els[els.length - 1], a = document.activeElement;
  if (!box.contains(a)) { e.preventDefault(); first.focus(); }
  else if (e.shiftKey && (a === first || a === box)) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
}

/** Над слоем `ref` (или над страницей, если ref не передан) открыт другой модальный слой. */
export function modalAbove(ref?: RefObject<HTMLElement | null>): boolean {
  const top = stack[stack.length - 1];
  return !!top && top.ref !== ref;
}

export interface ModalOptions {
  /** Слой открыт и живёт на странице (не образец витрины). */
  active: boolean;
  ref: RefObject<HTMLElement | null>;
  /** Esc. Если закрывать сейчас нельзя (идёт запрос) — просто ничего не делать. */
  onClose?: () => void;
  /** Ловушка Tab внутри ref. */
  trap?: boolean;
  lockScroll?: boolean;
  /** Куда поставить фокус при открытии (по умолчанию — сам ref), false — не трогать.
   *  Если дочерний компонент уже забрал фокус внутрь (поле кода) — не перехватываем. */
  initialFocus?: (() => HTMLElement | null | undefined) | false;
  /** Вернуть фокус туда, где он был до открытия. */
  restoreFocus?: boolean;
}

export function useModal({ active, ref, onClose, trap = true, lockScroll = true, initialFocus, restoreFocus = true }: ModalOptions) {
  const close = useEffectEvent(() => onClose?.());
  const pickFocus = useEffectEvent(() => (initialFocus === false ? null : initialFocus?.() ?? ref.current));

  useEffect(() => {
    if (!active) return;
    const prev = document.activeElement as HTMLElement | null;
    const layer: Layer = { ref, close: () => close(), trap };
    if (!stack.length) window.addEventListener('keydown', onKey);
    stack.push(layer);
    if (lockScroll && locks++ === 0) { savedOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; }
    if (!ref.current?.contains(document.activeElement)) pickFocus()?.focus({ preventScroll: true });
    return () => {
      stack.splice(stack.indexOf(layer), 1);
      if (!stack.length) window.removeEventListener('keydown', onKey);
      if (lockScroll && --locks === 0) document.body.style.overflow = savedOverflow;
      if (restoreFocus && prev?.isConnected) prev.focus({ preventScroll: true });
    };
  }, [active, ref, trap, lockScroll, restoreFocus]);
}
