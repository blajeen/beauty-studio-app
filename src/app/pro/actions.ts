'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { audit, can } from '@/lib/auth/guards';
import { completeAppointment } from '@/lib/scheduling/booking';
import { addDays } from '@/lib/datetime';
import type { Role } from '@/lib/constants';

export type Result = { ok: boolean; error?: string; message?: string };

/**
 * Toda ação da área profissional é escopada ao vínculo de quem está logada.
 * A gestão (OWNER/MANAGER) passa por aqui também, mas com escopo ampliado —
 * é o que impede uma profissional de mexer na agenda de outra (seção 38).
 */
async function actor() {
  const user = await getCurrentUser();
  if (!user) return null;
  const isStaff = user.role === 'OWNER' || user.role === 'MANAGER';
  if (!user.professionalId && !isStaff) return null;
  return { ...user, isStaff, role: user.role as Role };
}

async function ownsItem(itemId: string) {
  const me = await actor();
  if (!me) return { error: 'Sessão expirada. Entre novamente.' as const };

  const item = await db.appointmentItem.findUnique({
    where: { id: itemId },
    include: {
      service: { select: { id: true, name: true, recordSchema: true, returnIntervalDays: true } },
      appointment: { select: { id: true, customerId: true, status: true } },
    },
  });
  if (!item) return { error: 'Atendimento não encontrado.' as const };
  if (!me.isStaff && item.professionalId !== me.professionalId) {
    return { error: 'Este atendimento não é seu.' as const };
  }
  return { me, item };
}

const recordSchema = z.object({
  itemId: z.string().min(1),
  technique: z.string().trim().max(120).optional(),
  shape: z.string().trim().max(120).optional(),
  lengthSpec: z.string().trim().max(120).optional(),
  color: z.string().trim().max(120).optional(),
  style: z.string().trim().max(120).optional(),
  decoration: z.string().trim().max(160).optional(),
  curvature: z.string().trim().max(120).optional(),
  effect: z.string().trim().max(120).optional(),
  volume: z.string().trim().max(120).optional(),
  product: z.string().trim().max(160).optional(),
  materials: z.string().trim().max(200).optional(),
  observations: z.string().trim().max(800).optional(),
  nextRecommendedDays: z.coerce.number().int().min(0).max(365).optional(),
  complete: z.boolean().optional(),
});

/** Registro da ficha técnica + conclusão do atendimento em um só gesto. */
export async function saveProcedure(raw: unknown): Promise<Result> {
  const parsed = recordSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Verifique os campos.' };
  }

  const guard = await ownsItem(parsed.data.itemId);
  if ('error' in guard) return { ok: false, error: guard.error };
  const { me, item } = guard;

  const { itemId, nextRecommendedDays, complete, ...fields } = parsed.data;
  const clean = Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, value?.trim() ? value.trim() : null]),
  );

  const interval = nextRecommendedDays ?? item.service.returnIntervalDays ?? null;
  const nextRecommendedAt = interval ? addDays(new Date(), interval) : null;

  await db.procedureRecord.upsert({
    where: { appointmentItemId: itemId },
    create: {
      appointmentItemId: itemId,
      customerId: item.appointment.customerId,
      professionalId: item.professionalId,
      serviceId: item.serviceId,
      performedAt: item.startAt,
      nextRecommendedAt,
      ...clean,
    },
    update: { ...clean, nextRecommendedAt },
  });

  if (complete) {
    await completeAppointment(item.appointmentId);
  }

  await audit('procedure.save', 'AppointmentItem', itemId, { complete: Boolean(complete) }, me.id);
  revalidatePath('/pro');
  revalidatePath(`/pro/atendimento/${itemId}`);
  revalidatePath('/admin/agenda');
  return { ok: true, message: complete ? 'Atendimento concluído e ficha salva.' : 'Ficha salva.' };
}

const photoSchema = z.object({
  itemId: z.string().min(1),
  imageUrl: z.string().trim().url('Informe o endereço de uma imagem válida'),
  caption: z.string().trim().max(160).optional(),
  visibility: z.enum(['PRIVATE', 'CLIENT_VISIBLE', 'PUBLIC_PORTFOLIO']),
});

/**
 * Fotos do atendimento (seções 44 e 69). Publicar no portfólio exige, além da
 * escolha da profissional, o consentimento registrado na ficha da cliente.
 */
export async function addProcedurePhoto(raw: unknown): Promise<Result> {
  const parsed = photoSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Verifique os campos.' };
  }

  const guard = await ownsItem(parsed.data.itemId);
  if ('error' in guard) return { ok: false, error: guard.error };
  const { me, item } = guard;

  const customer = await db.customer.findUnique({
    where: { id: item.appointment.customerId },
    select: { id: true, name: true, consentPhotos: true },
  });

  if (parsed.data.visibility === 'PUBLIC_PORTFOLIO' && !customer?.consentPhotos) {
    return {
      ok: false,
      error:
        'Esta cliente ainda não autorizou o uso das fotos no portfólio. Salve como visível apenas para ela.',
    };
  }

  const procedure = await db.procedureRecord.upsert({
    where: { appointmentItemId: item.id },
    create: {
      appointmentItemId: item.id,
      customerId: item.appointment.customerId,
      professionalId: item.professionalId,
      serviceId: item.serviceId,
      performedAt: item.startAt,
    },
    update: {},
    select: { id: true },
  });

  await db.procedurePhoto.create({
    data: {
      procedureId: procedure.id,
      imageUrl: parsed.data.imageUrl,
      caption: parsed.data.caption || null,
      visibility: parsed.data.visibility,
    },
  });

  // Publicar no portfólio cria o item correspondente, já vinculado à cliente.
  if (parsed.data.visibility === 'PUBLIC_PORTFOLIO') {
    await db.portfolioItem.create({
      data: {
        professionalId: item.professionalId,
        serviceId: item.serviceId,
        customerId: customer?.id ?? null,
        title: parsed.data.caption || item.service.name,
        imageUrl: parsed.data.imageUrl,
        visibility: 'PUBLIC_PORTFOLIO',
        consentGiven: true,
      },
    });
    revalidatePath('/portfolio');
  }

  await audit('procedure.photo', 'AppointmentItem', item.id, { visibility: parsed.data.visibility }, me.id);
  revalidatePath(`/pro/atendimento/${item.id}`);
  return { ok: true, message: 'Foto adicionada.' };
}

export async function setAppointmentStatus(
  appointmentId: string,
  status: 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'NO_SHOW',
): Promise<Result> {
  const me = await actor();
  if (!me) return { ok: false, error: 'Sessão expirada.' };
  if (!can(me.role, 'appointment.complete')) {
    return { ok: false, error: 'Você não tem permissão para esta ação.' };
  }

  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: { id: true, customerId: true, items: { select: { professionalId: true } } },
  });
  if (!appointment) return { ok: false, error: 'Agendamento não encontrado.' };

  const isMine = appointment.items.some((item) => item.professionalId === me.professionalId);
  if (!me.isStaff && !isMine) return { ok: false, error: 'Este atendimento não é seu.' };

  if (status === 'COMPLETED') {
    await completeAppointment(appointmentId);
  } else {
    await db.appointment.update({
      where: { id: appointmentId },
      data: {
        status,
        items: { updateMany: { where: { appointmentId }, data: { status } } },
        ...(status === 'NO_SHOW'
          ? { customer: { update: { noShowCount: { increment: 1 } } } }
          : {}),
      },
    });
  }

  await audit('appointment.status', 'Appointment', appointmentId, { status }, me.id);
  revalidatePath('/pro');
  revalidatePath('/admin/agenda');
  return { ok: true, message: 'Status atualizado.' };
}

/* ── BLOQUEIOS DE AGENDA (seção 38: a profissional pode bloquear) ───────────── */

const blockSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  reason: z.string().trim().max(120).optional(),
  type: z.enum(['BLOCK', 'BREAK', 'VACATION', 'HOLIDAY']).default('BLOCK'),
  professionalId: z.string().optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function createBlock(raw: unknown): Promise<Result> {
  const me = await actor();
  if (!me) return { ok: false, error: 'Sessão expirada.' };

  const parsed = blockSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Verifique os campos.' };
  }

  const targetId = me.isStaff && parsed.data.professionalId ? parsed.data.professionalId : me.professionalId;
  if (!targetId) return { ok: false, error: 'Selecione a profissional.' };

  const startAt = new Date(`${parsed.data.date}T${parsed.data.startTime}:00`);
  const endAt = new Date(`${parsed.data.endDate ?? parsed.data.date}T${parsed.data.endTime}:00`);
  if (endAt <= startAt) return { ok: false, error: 'O fim precisa ser depois do início.' };

  // Bloquear por cima de atendimento marcado geraria conflito silencioso.
  const conflict = await db.appointmentItem.findFirst({
    where: {
      professionalId: targetId,
      startAt: { lt: endAt },
      endAt: { gt: startAt },
      appointment: { status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] } },
    },
    select: { id: true, startAt: true, appointment: { select: { customer: { select: { name: true } } } } },
  });

  if (conflict) {
    return {
      ok: false,
      error: `Existe atendimento de ${conflict.appointment.customer.name} nesse período. Remarque antes de bloquear.`,
    };
  }

  await db.blockedSlot.create({
    data: {
      professionalId: targetId,
      startAt,
      endAt,
      reason: parsed.data.reason || null,
      type: parsed.data.type,
    },
  });

  await audit('block.create', 'BlockedSlot', null, { targetId, startAt, endAt }, me.id);
  revalidatePath('/pro/bloqueios');
  revalidatePath('/admin/agenda');
  return { ok: true, message: 'Período bloqueado.' };
}

export async function removeBlock(id: string): Promise<Result> {
  const me = await actor();
  if (!me) return { ok: false, error: 'Sessão expirada.' };

  const block = await db.blockedSlot.findUnique({ where: { id }, select: { professionalId: true } });
  if (!block) return { ok: false, error: 'Bloqueio não encontrado.' };
  if (!me.isStaff && block.professionalId !== me.professionalId) {
    return { ok: false, error: 'Este bloqueio não é seu.' };
  }

  await db.blockedSlot.delete({ where: { id } });
  await audit('block.remove', 'BlockedSlot', id, null, me.id);
  revalidatePath('/pro/bloqueios');
  revalidatePath('/admin/agenda');
  return { ok: true, message: 'Bloqueio removido.' };
}

/* ── PORTFÓLIO DA PROFISSIONAL ──────────────────────────────────────────────── */

const portfolioSchema = z.object({
  title: z.string().trim().min(2, 'Dê um título ao trabalho'),
  imageUrl: z.string().trim().url('Informe o endereço de uma imagem válida'),
  serviceId: z.string().optional(),
  technique: z.string().trim().max(120).optional(),
  styleTags: z.string().trim().max(160).optional(),
  visibility: z.enum(['PRIVATE', 'CLIENT_VISIBLE', 'PUBLIC_PORTFOLIO']),
  isFeatured: z.boolean().optional(),
});

export async function savePortfolioItem(raw: unknown): Promise<Result> {
  const me = await actor();
  if (!me?.professionalId) return { ok: false, error: 'Sessão expirada.' };

  const parsed = portfolioSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Verifique os campos.' };
  }

  const service = parsed.data.serviceId
    ? await db.service.findUnique({
        where: { id: parsed.data.serviceId },
        select: { id: true, categoryId: true },
      })
    : null;

  await db.portfolioItem.create({
    data: {
      professionalId: me.professionalId,
      serviceId: service?.id ?? null,
      categoryId: service?.categoryId ?? null,
      title: parsed.data.title,
      imageUrl: parsed.data.imageUrl,
      technique: parsed.data.technique || null,
      styleTags: parsed.data.styleTags || null,
      visibility: parsed.data.visibility,
      consentGiven: parsed.data.visibility === 'PUBLIC_PORTFOLIO',
      isFeatured: parsed.data.isFeatured ?? false,
    },
  });

  await audit('portfolio.create', 'PortfolioItem', null, { title: parsed.data.title }, me.id);
  revalidatePath('/pro/portfolio');
  revalidatePath('/portfolio');
  return { ok: true, message: 'Trabalho adicionado ao portfólio.' };
}

export async function removePortfolioItem(id: string): Promise<Result> {
  const me = await actor();
  if (!me) return { ok: false, error: 'Sessão expirada.' };

  const item = await db.portfolioItem.findUnique({
    where: { id },
    select: { professionalId: true },
  });
  if (!item) return { ok: false, error: 'Item não encontrado.' };
  if (!me.isStaff && item.professionalId !== me.professionalId) {
    return { ok: false, error: 'Este item não é seu.' };
  }

  await db.portfolioItem.delete({ where: { id } });
  await audit('portfolio.remove', 'PortfolioItem', id, null, me.id);
  revalidatePath('/pro/portfolio');
  revalidatePath('/portfolio');
  return { ok: true, message: 'Item removido.' };
}

/** Observação livre na ficha da cliente — visível apenas para o estúdio. */
export async function saveCustomerNote(customerId: string, notes: string): Promise<Result> {
  const me = await actor();
  if (!me) return { ok: false, error: 'Sessão expirada.' };

  const attended = me.isStaff
    ? true
    : Boolean(
        await db.appointmentItem.findFirst({
          where: { professionalId: me.professionalId!, appointment: { customerId } },
          select: { id: true },
        }),
      );
  if (!attended) return { ok: false, error: 'Você ainda não atendeu esta cliente.' };

  await db.customer.update({
    where: { id: customerId },
    data: { notes: notes.trim() || null },
  });

  await audit('customer.note', 'Customer', customerId, null, me.id);
  revalidatePath(`/pro/clientes/${customerId}`);
  revalidatePath(`/admin/clientes/${customerId}`);
  return { ok: true, message: 'Anotação salva.' };
}
