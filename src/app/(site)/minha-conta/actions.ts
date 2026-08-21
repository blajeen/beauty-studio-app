'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { audit } from '@/lib/auth/guards';
import { cancelBooking } from '@/lib/scheduling/booking';
import { getBrand } from '@/lib/brand/server';

export type Result = { ok: boolean; error?: string; message?: string };

/** Toda ação da conta confirma que o recurso pertence à cliente autenticada. */
async function currentCustomer() {
  const user = await getCurrentUser();
  if (!user) return null;
  const customer = await db.customer.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  return customer ? { userId: user.id, customerId: customer.id } : null;
}

export async function cancelMyAppointment(appointmentId: string, reason: string): Promise<Result> {
  const me = await currentCustomer();
  if (!me) return { ok: false, error: 'Sessão expirada. Entre novamente.' };

  const appointment = await db.appointment.findFirst({
    where: { id: appointmentId, customerId: me.customerId },
    select: { id: true, startAt: true, status: true },
  });
  if (!appointment) return { ok: false, error: 'Agendamento não encontrado.' };

  const brand = await getBrand();
  const hoursAhead = (appointment.startAt.getTime() - Date.now()) / 3_600_000;

  const result = await cancelBooking(appointmentId, reason || null, 'CUSTOMER');
  if (!result.ok) return result;

  await audit('appointment.cancel', 'Appointment', appointmentId, { reason }, me.userId);

  await db.notification.create({
    data: {
      customerId: me.customerId,
      type: 'CANCELLATION',
      title: 'Agendamento cancelado',
      body:
        hoursAhead < brand.policies.cancellationHours
          ? `Cancelamento realizado. ${brand.policies.cancellationText}`
          : 'Seu horário foi liberado. Quando quiser, é só agendar de novo.',
      actionUrl: '/agendar',
      sentAt: new Date(),
    },
  });

  revalidatePath('/minha-conta');
  revalidatePath('/minha-conta/agendamentos');
  return { ok: true, message: 'Agendamento cancelado.' };
}

const profileSchema = z.object({
  name: z.string().trim().min(3, 'Informe seu nome completo'),
  phone: z
    .string()
    .trim()
    .min(10, 'Informe um telefone com DDD')
    .transform((value) => value.replace(/\D/g, '')),
  birthDate: z.string().optional(),
  consentPhotos: z.boolean(),
  consentMarketing: z.boolean(),
  preferredProfessionalId: z.string().optional(),
  notes: z.string().trim().max(400).optional(),
});

export async function updateProfile(raw: unknown): Promise<Result> {
  const me = await currentCustomer();
  if (!me) return { ok: false, error: 'Sessão expirada. Entre novamente.' };

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Verifique os dados.' };
  }

  const data = parsed.data;

  await db.$transaction([
    db.customer.update({
      where: { id: me.customerId },
      data: {
        name: data.name,
        phone: data.phone,
        birthDate: data.birthDate ? new Date(`${data.birthDate}T12:00:00`) : null,
        consentPhotos: data.consentPhotos,
        consentMarketing: data.consentMarketing,
        preferredProfessionalId: data.preferredProfessionalId || null,
        notes: data.notes || null,
      },
    }),
    db.user.update({
      where: { id: me.userId },
      data: { name: data.name, phone: data.phone },
    }),
  ]);

  // Retirar o consentimento tira as fotos do portfólio público imediatamente.
  if (!data.consentPhotos) {
    await db.portfolioItem.updateMany({
      where: { customerId: me.customerId, visibility: 'PUBLIC_PORTFOLIO' },
      data: { visibility: 'CLIENT_VISIBLE', consentGiven: false },
    });
    await db.procedurePhoto.updateMany({
      where: { procedure: { customerId: me.customerId }, visibility: 'PUBLIC_PORTFOLIO' },
      data: { visibility: 'CLIENT_VISIBLE' },
    });
  }

  await audit('customer.updateProfile', 'Customer', me.customerId, null, me.userId);
  revalidatePath('/minha-conta/perfil');
  revalidatePath('/portfolio');
  return { ok: true, message: 'Perfil atualizado.' };
}

const inspirationSchema = z.object({
  imageUrl: z.string().trim().url('Cole o endereço de uma imagem válida'),
  note: z.string().trim().max(240).optional(),
  categorySlug: z.string().trim().optional(),
  sharedWithId: z.string().trim().optional(),
});

export async function addInspiration(raw: unknown): Promise<Result> {
  const me = await currentCustomer();
  if (!me) return { ok: false, error: 'Sessão expirada. Entre novamente.' };

  const parsed = inspirationSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Verifique os dados.' };
  }

  await db.inspirationImage.create({
    data: {
      customerId: me.customerId,
      imageUrl: parsed.data.imageUrl,
      note: parsed.data.note || null,
      categorySlug: parsed.data.categorySlug || null,
      sharedWithId: parsed.data.sharedWithId || null,
    },
  });

  revalidatePath('/minha-conta/inspiracoes');
  return { ok: true, message: 'Inspiração salva.' };
}

export async function shareInspiration(id: string, professionalId: string): Promise<Result> {
  const me = await currentCustomer();
  if (!me) return { ok: false, error: 'Sessão expirada. Entre novamente.' };

  const updated = await db.inspirationImage.updateMany({
    where: { id, customerId: me.customerId },
    data: { sharedWithId: professionalId || null },
  });
  if (updated.count === 0) return { ok: false, error: 'Inspiração não encontrada.' };

  revalidatePath('/minha-conta/inspiracoes');
  return { ok: true, message: professionalId ? 'Enviada para a profissional.' : 'Compartilhamento removido.' };
}

export async function removeInspiration(id: string): Promise<Result> {
  const me = await currentCustomer();
  if (!me) return { ok: false, error: 'Sessão expirada. Entre novamente.' };

  await db.inspirationImage.deleteMany({ where: { id, customerId: me.customerId } });
  revalidatePath('/minha-conta/inspiracoes');
  return { ok: true, message: 'Inspiração removida.' };
}

/* ── BEAUTY CLUB & PACOTES ──────────────────────────────────────────────────── */

export async function subscribePlan(planSlug: string): Promise<Result> {
  const me = await currentCustomer();
  if (!me) return { ok: false, error: 'Entre na sua conta para assinar.' };

  const plan = await db.plan.findUnique({ where: { slug: planSlug }, select: { id: true, name: true } });
  if (!plan) return { ok: false, error: 'Plano não encontrado.' };

  const active = await db.subscription.findFirst({
    where: { customerId: me.customerId, status: 'ACTIVE' },
  });
  if (active) {
    return { ok: false, error: 'Você já tem um plano ativo. Cancele o atual antes de trocar.' };
  }

  const now = new Date();
  await db.subscription.create({
    data: {
      customerId: me.customerId,
      planId: plan.id,
      cycleStart: new Date(now.getFullYear(), now.getMonth(), 1),
      cycleEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
    },
  });

  await audit('subscription.create', 'Subscription', plan.id, { plan: plan.name }, me.userId);
  revalidatePath('/minha-conta/pacotes');
  return {
    ok: true,
    message: `${plan.name} ativado. O pagamento é acertado no estúdio na sua próxima visita.`,
  };
}

export async function cancelSubscription(subscriptionId: string): Promise<Result> {
  const me = await currentCustomer();
  if (!me) return { ok: false, error: 'Sessão expirada. Entre novamente.' };

  const updated = await db.subscription.updateMany({
    where: { id: subscriptionId, customerId: me.customerId, status: 'ACTIVE' },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });
  if (updated.count === 0) return { ok: false, error: 'Assinatura não encontrada.' };

  await audit('subscription.cancel', 'Subscription', subscriptionId, null, me.userId);
  revalidatePath('/minha-conta/pacotes');
  return { ok: true, message: 'Plano cancelado. Ele segue válido até o fim do ciclo atual.' };
}
