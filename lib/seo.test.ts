import { describe, expect, it } from 'vitest';
import { productLd } from './seo';
import type { Product, Review } from './types';

const p: Product = { id: 'f7', name: 'Букет', weight: '', price: 15900, cat: 'rozy', weightKg: 1, delivery: 'flowers' };
const review = (o: Partial<Review>): Review => ({ id: '1', author: 'Айгерим К.', rating: 5, text: 'Свежие', photos: [], date: '3 ноября', createdAt: '2026-11-03T09:20:00.000Z', ...o });

describe('productLd: отзывы', () => {
  it('без опубликованных отзывов — ни рейтинга, ни отзывов в разметке (правило Google)', () => {
    const ld = productLd(p, undefined, [review({})]);
    expect(ld).not.toHaveProperty('aggregateRating');
    expect(ld).not.toHaveProperty('review');
    expect(productLd({ ...p, rating: { avg: 0, count: 0 } })).not.toHaveProperty('aggregateRating');
  });
  it('есть отзывы — aggregateRating по всем опубликованным; review — с именем автора, текст — если есть', () => {
    const ld = productLd({ ...p, rating: { avg: 4.7, count: 3 } }, undefined, [
      review({}), review({ id: '2', author: 'Покупатель', rating: 4 }), review({ id: '3', author: 'Ержан', rating: 5, text: '' }),
    ]) as Record<string, unknown>;
    expect(ld.aggregateRating).toEqual({ '@type': 'AggregateRating', ratingValue: 4.7, ratingCount: 3, bestRating: 5, worstRating: 1 });
    expect(ld.review).toEqual([
      { '@type': 'Review', author: { '@type': 'Person', name: 'Айгерим К.' }, datePublished: '2026-11-03T09:20:00.000Z', reviewRating: { '@type': 'Rating', ratingValue: 5, bestRating: 5, worstRating: 1 }, reviewBody: 'Свежие' },
      { '@type': 'Review', author: { '@type': 'Person', name: 'Ержан' }, datePublished: '2026-11-03T09:20:00.000Z', reviewRating: { '@type': 'Rating', ratingValue: 5, bestRating: 5, worstRating: 1 } },
    ]);
  });
});
