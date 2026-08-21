import type { Metadata } from 'next';
import { requireRole } from '@/lib/auth/guards';
import { CONTENT_KEY, getSettingPair } from '@/lib/brand/server';
import { mergeContent } from '@/lib/brand/config';
import { ContentEditor } from './content-editor';

export const metadata: Metadata = { title: 'Conteúdo' };
export const dynamic = 'force-dynamic';

export default async function ContentPage() {
  await requireRole(['PRODUCT_MANAGER', 'OWNER']);

  const setting = await getSettingPair(CONTENT_KEY);
  const current = mergeContent(setting.draft ?? setting.published);

  return <ContentEditor content={current} hasDraft={setting.hasDraft} />;
}
