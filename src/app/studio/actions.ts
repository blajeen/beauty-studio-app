'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { guardAction, audit } from '@/lib/auth/guards';
import {
  BRAND_KEY,
  CONTENT_KEY,
  PREVIEW_COOKIE,
  discardDraft,
  getSettingPair,
  publishDraft,
  saveDraft,
} from '@/lib/brand/server';
import { mergeBrand, mergeContent } from '@/lib/brand/config';

/* ── PRÉ-VISUALIZAÇÃO ────────────────────────────────────────────────────────
 * O cookie faz todo o app ler o rascunho em vez do publicado — o gestor navega
 * o site inteiro como ele ficará, sem afetar nenhuma cliente (seção 56).
 */

export async function enterPreview() {
  const guard = await guardAction('branding.manage');
  if (!guard.ok) return guard;
  const store = await cookies();
  store.set(PREVIEW_COOKIE, '1', { httpOnly: true, sameSite: 'lax', path: '/' });
  revalidatePath('/', 'layout');
  return { ok: true as const };
}

export async function exitPreview() {
  const store = await cookies();
  store.delete(PREVIEW_COOKIE);
  revalidatePath('/', 'layout');
  return { ok: true as const };
}

/* ── BRANDING ───────────────────────────────────────────────────────────────── */

const hex = z
  .string()
  .trim()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Use uma cor em hexadecimal, como #3B2C28');

const brandSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do estúdio'),
  shortName: z.string().trim().min(1),
  tagline: z.string().trim().min(2),
  monogram: z.string().trim().min(1).max(3),
  logoUrl: z.string().trim().url().or(z.literal('')).transform((value) => value || null),
  colors: z.object({
    primary: hex,
    primaryContrast: hex,
    secondary: hex,
    accent: hex,
    background: hex,
    surface: hex,
    foreground: hex,
    muted: hex,
    border: hex,
  }),
  fonts: z.object({ display: z.string().trim().min(2), body: z.string().trim().min(2) }),
  radius: z.enum(['sharp', 'soft', 'round']),
  contact: z.object({
    whatsapp: z.string().trim().min(10, 'Informe o WhatsApp com DDI e DDD'),
    phone: z.string().trim().min(8),
    email: z.string().trim().email('E-mail inválido'),
    instagram: z.string().trim().min(1),
  }),
  legal: z.object({ companyName: z.string().trim().min(2), document: z.string().trim().min(4) }),
  features: z.object({
    packages: z.boolean(),
    beautyClub: z.boolean(),
    events: z.boolean(),
    portfolio: z.boolean(),
    inspiration: z.boolean(),
    waitlist: z.boolean(),
    reviews: z.boolean(),
    multiBranch: z.boolean(),
  }),
  policies: z.object({
    cancellationHours: z.coerce.number().int().min(0).max(72),
    cancellationText: z.string().trim().min(4),
    lateText: z.string().trim().min(4),
    depositText: z.string().trim().min(4),
  }),
  booking: z.object({
    slotStep: z.coerce.number().int().min(5).max(60),
    minLeadTimeHours: z.coerce.number().int().min(0).max(72),
    maxAdvanceDays: z.coerce.number().int().min(7).max(365),
    eventPrepBuffer: z.coerce.number().int().min(0).max(120),
  }),
});

export type ActionResult = { ok: boolean; error?: string; message?: string };

export async function saveBrand(raw: unknown): Promise<ActionResult> {
  const guard = await guardAction('branding.manage');
  if (!guard.ok) return guard;

  const parsed = brandSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Configuração inválida.' };
  }

  await saveDraft(BRAND_KEY, mergeBrand(parsed.data), guard.user.id);
  await audit('branding.draft', 'Setting', BRAND_KEY, null, guard.user.id);
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Rascunho salvo. Pré-visualize antes de publicar.' };
}

const contentSchema = z.object({
  hero: z.object({
    eyebrow: z.string().trim().min(1),
    headline: z.string().trim().min(4),
    subheadline: z.string().trim().min(4),
    imageUrl: z.string().trim().url('Informe uma URL de imagem válida'),
    ctaPrimary: z.string().trim().min(2),
    ctaSecondary: z.string().trim().min(2),
  }),
  highlights: z.array(z.object({ label: z.string().trim().min(1), value: z.string().trim().min(1) })),
  about: z.object({
    eyebrow: z.string().trim().min(1),
    title: z.string().trim().min(3),
    body: z.string().trim().min(10),
    imageUrl: z.string().trim().url(),
    signature: z.string().trim().min(1),
  }),
  editorial: z.object({ quote: z.string().trim().min(5), author: z.string().trim().min(1) }),
  bridal: z.object({
    heroImageUrl: z.string().trim().url('Informe uma URL de imagem válida'),
    sectionImageUrl: z.string().trim().url('Informe uma URL de imagem válida'),
  }),
  faq: z.array(z.object({ question: z.string().trim().min(3), answer: z.string().trim().min(3) })),
  footerNote: z.string().trim().min(3),
});

export async function saveContent(raw: unknown): Promise<ActionResult> {
  const guard = await guardAction('content.manage');
  if (!guard.ok) return guard;

  const parsed = contentSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Conteúdo inválido.' };
  }

  await saveDraft(CONTENT_KEY, mergeContent(parsed.data), guard.user.id);
  await audit('content.draft', 'Setting', CONTENT_KEY, null, guard.user.id);
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Rascunho salvo.' };
}

export async function publish(key: string): Promise<ActionResult> {
  const guard = await guardAction('branding.manage');
  if (!guard.ok) return guard;

  const pair = await getSettingPair(key);
  if (!pair.hasDraft) return { ok: false, error: 'Não há rascunho para publicar.' };

  await publishDraft(key, guard.user.id);
  await audit('setting.publish', 'Setting', key, null, guard.user.id);

  const store = await cookies();
  store.delete(PREVIEW_COOKIE);
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Publicado. Todas as clientes já veem a nova versão.' };
}

export async function discard(key: string): Promise<ActionResult> {
  const guard = await guardAction('branding.manage');
  if (!guard.ok) return guard;

  await discardDraft(key);
  await audit('setting.discard', 'Setting', key, null, guard.user.id);
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Rascunho descartado.' };
}

/* ── NEGÓCIO: preços e catálogo sem código (seção 57) ───────────────────────── */

const serviceSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2),
  shortDescription: z.string().trim().max(220).optional().or(z.literal('')),
  price: z.coerce.number().int().min(0),
  priceType: z.enum(['FIXED', 'FROM', 'CUSTOM', 'CONSULTATION']),
  duration: z.coerce.number().int().min(5).max(600),
  bufferAfter: z.coerce.number().int().min(0).max(120),
  returnIntervalDays: z.coerce.number().int().min(0).max(365).optional(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
});

export async function updateService(raw: unknown): Promise<ActionResult> {
  const guard = await guardAction('pricing.manage');
  if (!guard.ok) return guard;

  const parsed = serviceSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }

  const { id, returnIntervalDays, shortDescription, ...data } = parsed.data;
  await db.service.update({
    where: { id },
    data: {
      ...data,
      shortDescription: shortDescription || null,
      returnIntervalDays: returnIntervalDays && returnIntervalDays > 0 ? returnIntervalDays : null,
    },
  });

  await audit('service.update', 'Service', id, { price: data.price }, guard.user.id);
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Serviço atualizado.' };
}
