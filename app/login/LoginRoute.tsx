'use client';
// ?next= читается в браузере, чтобы страница была статической.
import { useSearchParams } from 'next/navigation';
import { LoginScreen } from '@/components/screens/LoginScreen';
import type { Category } from '@/lib/types';

export function LoginRoute({ categories }: { categories: Category[] }) {
  return <LoginScreen categories={categories} next={useSearchParams().get('next') || '/account'} />;
}
