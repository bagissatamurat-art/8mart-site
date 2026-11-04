// Пузыри отзывов над товаром в видео и сторис (решение владельца 04.11): по одному всплывают начала настоящих
// опубликованных отзывов — «Купил(а): …» с инициалом автора. Отзывов нет — пузырей нет; выдумывать нельзя (DESIGN_RULES).
import type { Review } from './types';

/** Отзывы, из которых можно сделать пузырь: только с текстом (оценка без текста — не пузырь). */
export const bubbleReviews = (items: Review[]): Review[] => items.filter(r => r.text.trim().length > 0);

/** Начало отзыва: первые words слов одной строкой, не длиннее maxChars; обрезали — многоточие. */
export function reviewSnippet(text: string, words: number, maxChars: number): string {
  const all = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  let out = all.slice(0, words).join(' ');
  let cut = all.length > words;
  if (out.length > maxChars) {
    out = out.slice(0, maxChars);
    const sp = out.lastIndexOf(' ');
    if (sp > 0) out = out.slice(0, sp); // по границе слова; одно огромное слово — режем как есть
    cut = true;
  }
  // Обрезали — без висящей запятой или тире перед многоточием
  return cut ? `${out.replace(/[\s,.;:!?—–-]+$/u, '')}…` : out;
}

/** Инициал для кружка: «Айгерим К.» → «А», «Покупатель» → «П». */
export const authorInitial = (author: string) => (author.trim()[0] ?? '?').toLocaleUpperCase('ru-RU');
