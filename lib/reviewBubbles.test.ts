// Пузыри отзывов: только отзывы с текстом, начало отзыва с многоточием, инициал автора.
import { describe, expect, it } from 'vitest';
import { authorInitial, bubbleReviews, reviewSnippet } from './reviewBubbles';
import type { Review } from './types';

const r = (id: string, text: string, author = 'Айгерим К.'): Review => ({ id, author, rating: 5, text, photos: [], date: '3 ноября', createdAt: '2026-11-03T09:20:00Z' });

describe('пузыри отзывов', () => {
  it('только отзывы с текстом: оценка без текста пузырём не становится', () => {
    expect(bubbleReviews([r('1', 'Свежие цветы'), r('2', '   '), r('3', '')]).map(x => x.id)).toEqual(['1']);
  });

  it('начало отзыва: первые слова одной строкой, обрезано — многоточие', () => {
    expect(reviewSnippet('Букет привезли за 40 минут, цветы свежие, коробка с водой', 6, 44)).toBe('Букет привезли за 40 минут, цветы…');
    expect(reviewSnippet('Всё отлично!', 6, 44)).toBe('Всё отлично!');
    expect(reviewSnippet('Первая строка\nвторая   строка', 6, 44)).toBe('Первая строка вторая строка');
  });

  it('длинные слова — не длиннее предела, по границе слова', () => {
    const s = reviewSnippet('Великолепнейший восхитительнейший замечательнейший букетище', 6, 30);
    expect(s.length).toBeLessThanOrEqual(31);
    expect(s.endsWith('…')).toBe(true);
    expect(s).toBe('Великолепнейший…');
  });

  it('инициал автора; «Покупатель» — «П»', () => {
    expect(authorInitial('Айгерим К.')).toBe('А');
    expect(authorInitial('покупатель')).toBe('П');
    expect(authorInitial('  ')).toBe('?');
  });
});
