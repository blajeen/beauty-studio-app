import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import {
  DEFAULT_BRAND,
  DEFAULT_CONTENT,
  mergeBrand,
  mergeContent,
  type BrandConfig,
  type ContentConfig,
} from './config';

import { BRAND_KEY, CONTENT_KEY, PREVIEW_COOKIE } from './keys';

export { BRAND_KEY, CONTENT_KEY, PREVIEW_COOKIE } from './keys';

function parse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function readSetting(key: string, preview: boolean) {
  const row = await db.setting.findUnique({ where: { key } });
  if (!row) return null;
  return preview ? (row.draft ?? row.published) : row.published;
}

/** Estado de preview do request atual (cookie httpOnly gravado pelo painel). */
export const isPreviewMode = cache(async (): Promise<boolean> => {
  const store = await cookies();
  return store.get(PREVIEW_COOKIE)?.value === '1';
});

export const getBrand = cache(async (): Promise<BrandConfig> => {
  const preview = await isPreviewMode();
  return mergeBrand(parse(await readSetting(BRAND_KEY, preview), DEFAULT_BRAND));
});

export const getContent = cache(async (): Promise<ContentConfig> => {
  const preview = await isPreviewMode();
  return mergeContent(parse(await readSetting(CONTENT_KEY, preview), DEFAULT_CONTENT));
});

/** Lê explicitamente uma das versões — usado pelo painel de configuração. */
export async function getSettingPair(key: string) {
  const row = await db.setting.findUnique({ where: { key } });
  return {
    published: parse<unknown>(row?.published, null),
    draft: row?.draft ? parse<unknown>(row.draft, null) : null,
    hasDraft: Boolean(row?.draft),
    updatedAt: row?.updatedAt ?? null,
  };
}

export async function saveDraft(key: string, value: unknown, userId?: string) {
  const payload = JSON.stringify(value);
  await db.setting.upsert({
    where: { key },
    create: { key, published: payload, draft: payload, updatedBy: userId },
    update: { draft: payload, updatedBy: userId },
  });
}

export async function publishDraft(key: string, userId?: string) {
  const row = await db.setting.findUnique({ where: { key } });
  if (!row?.draft) return false;
  await db.setting.update({
    where: { key },
    data: { published: row.draft, draft: null, updatedBy: userId },
  });
  return true;
}

export async function discardDraft(key: string) {
  await db.setting.update({ where: { key }, data: { draft: null } }).catch(() => null);
}

export type { BrandConfig, ContentConfig };
