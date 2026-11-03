'use client';
// Миниатюры видео, которые покупатель закрыл крестиком, — до конца сессии: sessionStorage '8mart.videoHidden' (id товаров).
import { create } from 'zustand';
import { VIDEO_HIDDEN_KEY } from '../config';

const read = (): string[] => {
  try { const v = JSON.parse(sessionStorage.getItem(VIDEO_HIDDEN_KEY) || 'null'); if (Array.isArray(v)) return v; } catch { /* приватный режим */ }
  return [];
};

export const useVideoHiddenStore = create<{ ids: string[] }>()(() => ({ ids: [] }));
if (typeof window !== 'undefined') queueMicrotask(() => useVideoHiddenStore.setState({ ids: read() }));

export function hideVideo(id: string) {
  const ids = [...new Set([...useVideoHiddenStore.getState().ids, id])];
  try { sessionStorage.setItem(VIDEO_HIDDEN_KEY, JSON.stringify(ids)); } catch { /* приватный режим — до перезагрузки страницы */ }
  useVideoHiddenStore.setState({ ids });
}
export const useVideoHidden = (id: string) => useVideoHiddenStore(s => s.ids.includes(id));
