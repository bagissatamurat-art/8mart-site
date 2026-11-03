import { catalogMetadata, renderCatalog, type Raw } from '@/components/catalog/catalogPage';

type Props = { searchParams: Promise<Raw> };

export const generateMetadata = async ({ searchParams }: Props) => catalogMetadata(await searchParams);
export default async function CatalogPage({ searchParams }: Props) { return renderCatalog(await searchParams); }
