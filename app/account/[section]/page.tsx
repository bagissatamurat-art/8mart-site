import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ACCOUNT_SECTIONS, sectionTitle, type AccountSection } from '@/components/account/sections';
import { AccountScreen } from '@/components/screens/AccountScreen';
import { getCategories } from '@/lib/api';

type Params = { params: Promise<{ section: string }> };

const isSection = (v: string): v is AccountSection => ACCOUNT_SECTIONS.some(([id]) => id === v);

export function generateStaticParams() {
  return ACCOUNT_SECTIONS.map(([section]) => ({ section }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { section } = await params;
  return { title: `${isSection(section) ? sectionTitle(section) : 'Личный кабинет'}`, robots: { index: false } };
}

export default async function AccountSectionPage({ params }: Params) {
  const [{ section }, categories] = await Promise.all([params, getCategories()]);
  if (!isSection(section)) notFound();
  return <AccountScreen categories={categories} section={section} />;
}
