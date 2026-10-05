'use client';
// Счётчик изменений значения после монтирования: анимации отклика запускаются на действие, а не при загрузке страницы.
// Изменения в первые SETTLE мс после монтирования не считаются — это чтение корзины и избранного из localStorage.
// when — какие изменения считать (например, только включение избранного).
import { useEffect, useRef, useState } from 'react';

const SETTLE = 800;

export function useChangeTick<T>(value: T, when: (next: T, prev: T) => boolean = () => true): number {
  const [tick, setTick] = useState(0);
  const prev = useRef(value);
  const mountedAt = useRef(0);
  useEffect(() => { mountedAt.current = performance.now(); }, []);
  useEffect(() => {
    if (Object.is(prev.current, value)) return;
    const was = prev.current; prev.current = value;
    if (performance.now() - mountedAt.current < SETTLE) return;
    if (when(value, was)) setTick(t => t + 1);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return tick;
}
