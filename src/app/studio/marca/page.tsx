import type { Metadata } from 'next';
import { requireRole } from '@/lib/auth/guards';
import { BRAND_KEY, getSettingPair } from '@/lib/brand/server';
import { mergeBrand } from '@/lib/brand/config';
import { BrandEditor } from './brand-editor';

export const metadata: Metadata = { title: 'Marca' };
export const dynamic = 'force-dynamic';

export default async function BrandPage() {
  await requireRole(['PRODUCT_MANAGER', 'OWNER']);

  const setting = await getSettingPair(BRAND_KEY);
  // O rascunho é a fonte de edição; sem rascunho, partimos do publicado.
  const current = mergeBrand(setting.draft ?? setting.published);

  return <BrandEditor brand={current} hasDraft={setting.hasDraft} />;
}
