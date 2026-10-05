import { getCategories } from '@/lib/api';
import { NotFoundRoute } from './NotFoundRoute';

// 404. Запасной путь для /order/<id> без собранной страницы (статический хостинг); иначе — «Страница не найдена».
export default async function NotFound() {
  return <NotFoundRoute categories={await getCategories()} />;
}
