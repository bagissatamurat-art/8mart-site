'use client';
// Общее поведение модальных слоёв (быстрый просмотр, способ получения, лист, меню, сторис, вход, подтверждение):
// Esc закрывает, Tab не уходит из диалога, фокус — внутрь и обратно, прокрутка страницы заблокирована.
// Слои лежат в стеке: Esc и Tab обрабатывает только верхний — модалка способа поверх быстрого просмотра закрывается одна.
// «Назад» в браузере / жест назад на телефоне тоже закрывает верхний слой, а не уводит со страницы (см. syncHistory).
import { useEffect, useEffectEvent, type RefObject } from 'react';

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),iframe,[tabindex]:not([tabindex="-1"])';

interface Layer { ref: RefObject<HTMLElement | null>; close: () => void; trap: boolean; back: boolean }
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

// ── «Назад» закрывает модалку ──
// Пока открыт хоть один слой с onClose, в истории лежит одна лишняя запись того же адреса (с пометкой HISTORY_KEY).
// «Назад» снимает её → закрываем верхний слой; остались слои — кладём запись снова. Закрыли крестиком/Esc — убираем
// запись сами (history.back), если она ещё верхняя. Ушли по ссылке — запись уже не верхняя, историю не трогаем.
// Синхронизация отложена на такт: смена слоёв в одном рендере (скелетон → быстрый просмотр) историю не дёргает.
const HISTORY_KEY = '__modal';
/** Метка нашей записи; false — записи нет. Уникальна: после перезагрузки в истории может остаться старая метка. */
let pushed: string | false = false;
let skipPop = false;
/** Время последнего ухода со страницы из модалки (ссылка, router.push): тогда запись не снимаем — history.back() отменил бы переход. */
let navAt = -Infinity;
const NAV_WINDOW = 1500;

/** Вызвать перед router.push из модалки: закрытие слоя не тронет историю, переход не отменится. Ссылки (<a>) отмечаются сами. */
export function beforeNavigate() { navAt = performance.now(); }
let syncTimer: ReturnType<typeof setTimeout> | undefined;
const backLayers = () => stack.filter(l => l.back).length;
const ownEntry = () => !!pushed && (window.history.state as Record<string, unknown> | null)?.[HISTORY_KEY] === pushed;

function syncHistory() {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    const n = backLayers();
    if (n && !pushed) {
      // Состояние Next.js (__NA и дерево) копируем: роутер принимает запись как свою и не перезагружает страницу.
      pushed = `${Date.now()}-${Math.random()}`;
      window.history.pushState({ ...(window.history.state ?? {}), [HISTORY_KEY]: pushed }, '');
    } else if (!n && pushed) {
      const own = ownEntry() && performance.now() - navAt > NAV_WINDOW;
      pushed = false;
      if (own) { skipPop = true; window.history.back(); }
    }
  }, 0);
}

function onPop() {
  if (skipPop) { skipPop = false; return; }
  if (!pushed || ownEntry()) return;
  pushed = false;
  const top = [...stack].reverse().find(l => l.back);
  top?.close();
  syncHistory(); // слой не закрылся (идёт запрос) или под ним есть ещё — запись вернётся
}

// Слушатели постоянные: собственный history.back() приходит popstate уже после закрытия последнего слоя.
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', onPop);
  // Клик по внутренней ссылке — уход со страницы (до обработчиков React, которые закрывают меню).
  document.addEventListener('click', e => {
    const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (a && a.origin === location.origin && !a.target && !a.hasAttribute('download') && a.href !== location.href) beforeNavigate();
  }, true);
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
  const hasClose = !!onClose;
  const pickFocus = useEffectEvent(() => (initialFocus === false ? null : initialFocus?.() ?? ref.current));

  useEffect(() => {
    if (!active) return;
    const prev = document.activeElement as HTMLElement | null;
    const layer: Layer = { ref, close: () => close(), trap, back: hasClose };
    if (!stack.length) window.addEventListener('keydown', onKey);
    stack.push(layer);
    if (hasClose) syncHistory();
    if (lockScroll && locks++ === 0) { savedOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; }
    if (!ref.current?.contains(document.activeElement)) pickFocus()?.focus({ preventScroll: true });
    return () => {
      stack.splice(stack.indexOf(layer), 1);
      if (!stack.length) window.removeEventListener('keydown', onKey);
      if (hasClose) syncHistory();
      if (lockScroll && --locks === 0) document.body.style.overflow = savedOverflow;
      if (restoreFocus && prev?.isConnected) prev.focus({ preventScroll: true });
    };
  }, [active, ref, trap, lockScroll, restoreFocus, hasClose]);
}
