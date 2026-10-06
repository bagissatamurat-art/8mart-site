'use client';
// Текущее время с шагом (по умолчанию 30 с) — для статусов «закроется через N мин», пока экран открыт.
import { useEffect, useState } from 'react';

export function useNow(stepMs = 30000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), stepMs); return () => clearInterval(t); }, [stepMs]);
  return now;
}
