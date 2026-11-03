// Раздел каталога: /catalog/<cat> — та же страница, что /catalog, раздел из пути (см. components/catalog/catalogUrl.ts).
import { catalogMetadata, renderCatalog, withPath } from '@/components/catalog/catalogPage';

type Props = { params: Promise<{ cat: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params, searchParams }: Props) {
  return catalogMetadata(await withPath(await searchParams, (await params).cat));
}

export default async function CatalogCategoryPage({ params, searchParams }: Props) {
  return renderCatalog(await withPath(await searchParams, (await params).cat));
}
