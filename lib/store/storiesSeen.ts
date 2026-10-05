'use client';
// Просмотренные сторис — localStorage '8mart.storiesSeen' (string[]).
import { STORIES_SEEN_KEY } from '../config';
import { createLocalArrayStore } from './localArray';

export const useStoriesSeenStore = createLocalArrayStore(STORIES_SEEN_KEY, () => []);
export function markStorySeen(id: string) {
  const s = useStoriesSeenStore.getState();
  if (!s.ids.includes(id)) s.set([...s.ids, id]);
}
export const useStoriesSeen = () => useStoriesSeenStore(s => s.ids);
