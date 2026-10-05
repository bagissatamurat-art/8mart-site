'use client';
// Глобальные оверлеи сайта: модалка способа получения и быстрый просмотр. Не сохраняются.
import { create } from 'zustand';
import { useCart } from './cart';
import { useMethod } from './method';

interface UiState {
  methodOpen: boolean;
  /** Товар, который пытались добавить без способа получения — положим после выбора. */
  pending: { key: string; qty: number } | null;
  quickViewId: string | null;
  hydrated: boolean;
  openMethod: () => void;
  closeMethod: () => void;
  openQuickView: (id: string) => void;
  closeQuickView: () => void;
}

export const useUi = create<UiState>()(set => ({
  methodOpen: false, pending: null, quickViewId: null, hydrated: false,
  openMethod: () => set({ methodOpen: true }),
  closeMethod: () => set({ methodOpen: false, pending: null }),
  openQuickView: id => set({ quickViewId: id }),
  closeQuickView: () => set({ quickViewId: null }),
}));

/** Изменение количества с проверкой способа получения: без него «В корзину» открывает модалку. */
export function setCartQty(key: string, qty: number) {
  if (qty > 0 && !useMethod.getState().method) {
    useUi.setState({ methodOpen: true, pending: { key, qty } });
    return;
  }
  useCart.getState().setQty(key, qty);
}

/** После выбора способа — кладём отложенный товар. */
export function flushPending() {
  const p = useUi.getState().pending;
  if (p) useCart.getState().setQty(p.key, p.qty);
  useUi.setState({ pending: null, methodOpen: false });
}

const AUTO_KEY = '8mart.methodAutoShown';
/** Главная: способ не выбран — модалка открывается сама один раз за сессию (sessionStorage). */
export function autoOpenMethodOnce() {
  if (useMethod.getState().method) return;
  try { if (sessionStorage.getItem(AUTO_KEY)) return; sessionStorage.setItem(AUTO_KEY, '1'); } catch { /* приватный режим — показываем */ }
  // После загрузки страницы и в простое: карта в модалке не конкурирует с главной картинкой (LCP).
  const open = () => { if (!useMethod.getState().method) useUi.setState({ methodOpen: true }); };
  const idle = () => ('requestIdleCallback' in window ? window.requestIdleCallback(open, { timeout: 1500 }) : setTimeout(open, 300));
  if (document.readyState === 'complete') idle(); else window.addEventListener('load', idle, { once: true });
}
