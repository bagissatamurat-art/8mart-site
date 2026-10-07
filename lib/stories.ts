// Настоящие сторис 8mart.kz (GET /api/v1/public/stories): сейчас — видео с обложкой. Только на сервере, кэш 5 мин;
// API недоступен — пусто (остаются сторис сайта из lib/mock).
import { BRAND } from './config';
import type { Story } from './types';

const ORIGIN = 'https://dukenfy-api.8mart.kz';

interface RawStory { id: string; type: string; url: string; thumbnail?: string; duration?: number; isActive?: boolean }

export function toStory(r: RawStory): Story | null {
  if (r.isActive === false || !r.url) return null;
  const media = ORIGIN + r.url, cover = r.thumbnail ? ORIGIN + r.thumbnail : media;
  // Заголовка в API нет — подпись кружка «8mart»; текст и цена уже в самом видео.
  if (r.type === 'video') return { id: `live-${r.id}`, title: BRAND.name, cover, slides: [{ img: cover, video: media, duration: r.duration, title: '', text: '' }] };
  if (r.type === 'image') return { id: `live-${r.id}`, title: BRAND.name, cover, slides: [{ img: media, title: '', text: '' }] };
  return null;
}

export async function fetchLiveStories(): Promise<Story[]> {
  try {
    const r = await fetch(`${ORIGIN}/api/v1/public/stories`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(5000) });
    if (!r.ok) return [];
    return ((await r.json()) as RawStory[]).map(toStory).filter((s): s is Story => !!s);
  } catch {
    return [];
  }
}
