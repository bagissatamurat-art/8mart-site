// GET /api/geo/suggest?q&city — подсказки адреса (прокси DaData). city — id из GET /cities.
// Нет DADATA_API_KEY → 503 (UI: «Подсказки недоступны — укажите дом пином на карте»).
import { badRequest, hasDadata, resolveCity, suggestAddress, unavailable } from '../geo.server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const q = (sp.get('q') || '').trim();
  const city = (sp.get('city') || '').trim();
  // Подсказки — с 3 символов (DESIGN_RULES → «Подсказки адреса»); длину ограничиваем, чтобы не гонять мусор к поставщику.
  if (q.length < 3 || q.length > 200) return badRequest('q');
  if (!city || city.length > 64) return badRequest('city');
  if (!hasDadata()) return unavailable();
  try {
    const list = await suggestAddress(q, await resolveCity(city));
    return Response.json(list, { headers: { 'Cache-Control': 'private, max-age=60' } });
  } catch (e) {
    console.error('[geo/suggest]', e instanceof Error ? e.message : e);
    return unavailable();
  }
}
