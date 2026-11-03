// Подраздел каталога: /catalog/<cat>/<sub> — список товаров подраздела.
import { catalogMetadata, renderCatalog, withPath } from '@/components/catalog/catalogPage';

type Props = { params: Promise<{ cat: string; sub: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params, searchParams }: Props) {
  const { cat, sub } = await params;
  return catalogMetadata(await withPath(await searchParams, cat, sub));
}

export default async function CatalogSubPage({ params, searchParams }: Props) {
  const { cat, sub } = await params;
  return renderCatalog(await withPath(await searchParams, cat, sub));
}
