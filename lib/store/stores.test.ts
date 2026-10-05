import { beforeEach, describe, expect, it } from 'vitest';
import { useCart, cartCount } from './cart';
import { useMethod } from './method';
import { flushPending, setCartQty, useUi } from './ui';

beforeEach(() => {
  useCart.setState({ lines: {}, together: false });
  useMethod.getState().reset();
  useUi.setState({ methodOpen: false, pending: null });
});

describe('корзина и способ получения', () => {
  it('без способа «В корзину» открывает модалку и откладывает товар', () => {
    setCartQty('b1', 1);
    expect(useCart.getState().lines).toEqual({});
    expect(useUi.getState()).toMatchObject({ methodOpen: true, pending: { key: 'b1', qty: 1 } });
  });
  it('после выбора способа отложенный товар попадает в корзину', () => {
    setCartQty('b1', 1);
    useMethod.getState().set({ method: 'pickup', city: 'astana', address: 'пр. Туран, 37', lat: 1, lng: 1, pickupPointId: 'ast-4' }, 'пр. Туран, 37');
    flushPending();
    expect(useCart.getState().lines).toEqual({ b1: 1 });
    expect(useUi.getState().methodOpen).toBe(false);
  });
  it('закрытие модалки сбрасывает отложенный товар', () => {
    setCartQty('b1', 1);
    useUi.getState().closeMethod();
    expect(useUi.getState().pending).toBeNull();
  });
  it('со способом количество меняется сразу, 0 удаляет позицию', () => {
    useMethod.getState().set({ method: 'delivery', city: 'astana', address: 'Кабанбай батыра, 11', lat: 1, lng: 1, pickupPointId: null }, 'Астана, Кабанбай батыра, 11');
    setCartQty('f2|Розовый', 2);
    setCartQty('b1', 3);
    expect(cartCount(useCart.getState().lines)).toBe(5);
    setCartQty('b1', 0);
    expect(useCart.getState().lines).toEqual({ 'f2|Розовый': 2 });
  });
});

describe('localStorage', () => {
  it('корзина и способ сохраняются под ключами 8mart.*', () => {
    useMethod.getState().set({ method: 'delivery', city: 'astana', address: 'Кабанбай батыра, 11', lat: 1, lng: 2, pickupPointId: null }, 'Астана, Кабанбай батыра, 11');
    useCart.getState().setQty('b4', 2);
    expect(JSON.parse(localStorage.getItem('8mart.cart')!).state.lines).toEqual({ b4: 2 });
    expect(JSON.parse(localStorage.getItem('8mart.method')!).state).toMatchObject({ method: 'delivery', label: 'Астана, Кабанбай батыра, 11' });
  });
});
