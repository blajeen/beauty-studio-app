'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getBrand } from '@/lib/brand/server';
import { getCurrentUser } from '@/lib/auth/session';
import { audit } from '@/lib/auth/guards';
import {
  availabilityCalendar,
  buildChain,
  findFirstAvailable,
  loadScheduleContext,
  collectProfessionals,
  slotsForDay,
  type ChainSlot,
} from '@/lib/scheduling/engine';
import { buildRequests, planBackward, sortSelections } from '@/lib/scheduling/planner';
import { createBooking, rescheduleBooking } from '@/lib/scheduling/booking';
import { addDays, parseDateKey, startOfDay, toDateKey } from '@/lib/datetime';

/* ── CONTRATOS ──────────────────────────────────────────────────────────────
 * O cliente nunca envia preço, duração ou profissional resolvido: manda apenas
 * o que a cliente escolheu. O servidor recalcula tudo — inclusive na
 * confirmação — para que a interface não consiga alterar valores.
 */

const selectionSchema = z.object({
  serviceId: z.string().min(1),
  professionalId: z.string().min(1).nullable().optional(),
});

const searchSchema = z.object({
  branchId: z.string().min(1),
  selections: z.array(selectionSchema).min(1).max(6),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  readyBy: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  excludeAppointmentId: z.string().optional(),
});

export type SlotDTO = {
  start: string;
  end: string;
  totalDuration: number;
  totalPrice: number;
  items: {
    serviceId: string;
    serviceName: string;
    professionalId: string;
    professionalName: string;
    start: string;
    end: string;
    duration: number;
    price: number;
  }[];
};

export type DaySummary = { dateKey: string; count: number; firstStart: string | null };

export type BackwardPlanDTO = {
  suggestedStart: string;
  steps: { label: string; start: string; end: string; minutes: number; kind: string }[];
};

export type AvailabilityResult =
  | {
      ok: true;
      days: DaySummary[];
      selectedDate: string | null;
      slots: SlotDTO[];
      totalDuration: number;
      totalPrice: number;
      plan: BackwardPlanDTO | null;
    }
  | { ok: false; error: string };

const HORIZON_DAYS = 21;

/** Grade de horários para o dia escolhido + resumo dos próximos dias. */
export async function searchAvailability(raw: unknown): Promise<AvailabilityResult> {
  const parsed = searchSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Seleção inválida.' };

  const brand = await getBrand();
  const input = parsed.data;

  const ordered = await sortSelections(input.selections);
  const { requests, problems } = await buildRequests(ordered, input.branchId);
  if (requests.length === 0) {
    return { ok: false, error: problems[0] ?? 'Nenhum serviço disponível para esta seleção.' };
  }

  const now = new Date();
  const from = startOfDay(now);
  const options = {
    step: brand.booking.slotStep,
    minLeadTimeHours: brand.booking.minLeadTimeHours,
    preferredProfessionalId: await preferredProfessionalOf(),
    excludeAppointmentId: input.excludeAppointmentId ?? null,
    now,
  };

  const calendar = await availabilityCalendar(input.branchId, requests, from, HORIZON_DAYS, options);

  const days: DaySummary[] = calendar.map((day) => ({
    dateKey: toDateKey(day.date),
    count: day.slots.length,
    firstStart: day.slots[0]?.start.toISOString() ?? null,
  }));

  const requestedKey = input.dateKey;
  const requested = requestedKey
    ? calendar.find((day) => toDateKey(day.date) === requestedKey)
    : undefined;
  // Sem data pedida (ou data sem vaga), abrimos no primeiro dia com horário.
  const target = requested ?? calendar.find((day) => day.slots.length > 0) ?? null;

  let slots = target?.slots ?? [];
  let plan: BackwardPlanDTO | null = null;

  // Cronograma reverso: só interessam os encaixes que terminam a tempo.
  if (input.readyBy && target) {
    const [h, m] = input.readyBy.split(':').map(Number);
    const readyBy = new Date(target.date);
    readyBy.setHours(h, m, 0, 0);

    slots = slots.filter((slot) => slot.end <= readyBy).sort((a, b) => b.start.getTime() - a.start.getTime());

    const backward = planBackward(
      readyBy,
      requests.map((request) => ({ name: request.serviceName, duration: request.duration })),
      brand.booking.eventPrepBuffer,
    );
    plan = {
      suggestedStart: backward.suggestedStart.toISOString(),
      steps: backward.steps.map((step) => ({
        label: step.label,
        start: step.start.toISOString(),
        end: step.end.toISOString(),
        minutes: step.minutes,
        kind: step.kind,
      })),
    };
  }

  const names = await professionalNames(collectProfessionals(requests));

  return {
    ok: true,
    days,
    selectedDate: target ? toDateKey(target.date) : null,
    slots: slots.slice(0, 40).map(toSlotDTO(requests, names)),
    totalDuration: requests.reduce((sum, request) => sum + request.duration, 0),
    totalPrice: requests.reduce((sum, request) => sum + request.price, 0),
    plan,
  };
}

/** Caminho C: o primeiro encaixe possível, sem a cliente escolher data. */
export async function firstAvailable(raw: unknown): Promise<
  { ok: true; slot: SlotDTO | null } | { ok: false; error: string }
> {
  const parsed = searchSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Seleção inválida.' };

  const brand = await getBrand();
  const ordered = await sortSelections(parsed.data.selections);
  const { requests, problems } = await buildRequests(ordered, parsed.data.branchId);
  if (requests.length === 0) {
    return { ok: false, error: problems[0] ?? 'Nenhum serviço disponível.' };
  }

  const now = new Date();
  const slot = await findFirstAvailable(parsed.data.branchId, requests, now, brand.booking.maxAdvanceDays > 30 ? 30 : brand.booking.maxAdvanceDays, {
    step: brand.booking.slotStep,
    minLeadTimeHours: brand.booking.minLeadTimeHours,
    preferredProfessionalId: await preferredProfessionalOf(),
    now,
  });

  const names = await professionalNames(collectProfessionals(requests));
  return { ok: true, slot: slot ? toSlotDTO(requests, names)(slot) : null };
}

const confirmSchema = z.object({
  branchId: z.string().min(1),
  selections: z.array(selectionSchema).min(1).max(6),
  start: z.string().datetime(),
  notes: z.string().trim().max(500).optional(),
  readyBy: z.string().datetime().optional(),
  eventId: z.string().optional(),
  rescheduleId: z.string().optional(),
});

export type ConfirmResult =
  | { ok: true; appointmentId: string; code: string }
  | { ok: false; error: string; conflict?: boolean };

/**
 * Confirmação. Reconstrói a cadeia no servidor a partir do horário escolhido —
 * a interface não envia preço nem duração — e grava dentro de uma transação
 * que recheca conflitos (seção 72).
 */
export async function confirmBooking(raw: unknown): Promise<ConfirmResult> {
  const parsed = confirmSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Não foi possível ler os dados do agendamento.' };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Entre na sua conta para confirmar o agendamento.' };

  const customerId = await resolveCustomerId(user.id, user.name, user.email);
  if (!customerId) return { ok: false, error: 'Não encontramos a sua ficha de cliente.' };

  const brand = await getBrand();
  const input = parsed.data;
  const start = new Date(input.start);

  if (start < new Date()) return { ok: false, error: 'Este horário já passou. Escolha outro.' };
  if (start > addDays(new Date(), brand.booking.maxAdvanceDays)) {
    return { ok: false, error: 'A agenda ainda não está aberta para esta data.' };
  }

  const ordered = await sortSelections(input.selections);
  const { requests, problems } = await buildRequests(ordered, input.branchId);
  if (requests.length === 0) {
    return { ok: false, error: problems[0] ?? 'Serviços indisponíveis.' };
  }

  const ctx = await loadScheduleContext(
    input.branchId,
    start,
    start,
    collectProfessionals(requests),
    input.rescheduleId ?? null,
  );

  const slot = buildChain(requests, start, ctx, {
    step: brand.booking.slotStep,
    preferredProfessionalId: await preferredProfessionalOf(customerId),
  });

  if (!slot || slot.start.getTime() !== start.getTime()) {
    return {
      ok: false,
      conflict: true,
      error: 'Este horário acabou de ser ocupado. Escolha outro horário disponível.',
    };
  }

  const result = input.rescheduleId
    ? await rescheduleBooking(input.rescheduleId, slot)
    : await createBooking({
        customerId,
        branchId: input.branchId,
        slot,
        notes: input.notes ?? null,
        eventId: input.eventId ?? null,
        readyByAt: input.readyBy ? new Date(input.readyBy) : null,
        source: 'APP',
        createdById: user.id,
      });

  if (!result.ok) return result;

  await audit(
    input.rescheduleId ? 'appointment.reschedule' : 'appointment.create',
    'Appointment',
    result.appointmentId,
    { services: requests.map((request) => request.serviceName) },
    user.id,
  );

  await db.notification.create({
    data: {
      customerId,
      type: 'CONFIRMATION',
      title: input.rescheduleId ? 'Horário remarcado' : 'Agendamento confirmado',
      body: `${requests.map((request) => request.serviceName).join(', ')} — código ${result.code}.`,
      actionUrl: `/minha-conta/agendamentos/${result.appointmentId}`,
      sentAt: new Date(),
    },
  });

  revalidatePath('/minha-conta');
  revalidatePath('/minha-conta/agendamentos');
  return result;
}

/* ── LISTA DE ESPERA (seção 52) ─────────────────────────────────────────────── */

export async function joinWaitlist(raw: {
  branchId: string;
  serviceId?: string;
  professionalId?: string;
  period?: string;
  notes?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Entre na sua conta para entrar na lista de espera.' };

  const customerId = await resolveCustomerId(user.id, user.name, user.email);
  if (!customerId) return { ok: false, error: 'Não encontramos a sua ficha de cliente.' };

  await db.waitlistEntry.create({
    data: {
      customerId,
      branchId: raw.branchId,
      serviceId: raw.serviceId || null,
      professionalId: raw.professionalId || null,
      preferredPeriod: raw.period || null,
      preferredFrom: new Date(),
      preferredTo: addDays(new Date(), 21),
      notes: raw.notes || null,
    },
  });

  await audit('waitlist.join', 'WaitlistEntry', null, raw, user.id);
  return { ok: true };
}

/* ── auxiliares ─────────────────────────────────────────────────────────────── */

function toSlotDTO(
  requests: { serviceId: string; serviceName: string }[],
  professionalName: Map<string, string>,
) {
  const nameById = new Map(requests.map((request) => [request.serviceId, request.serviceName]));
  return (slot: ChainSlot): SlotDTO => ({
    start: slot.start.toISOString(),
    end: slot.end.toISOString(),
    totalDuration: slot.totalDuration,
    totalPrice: slot.totalPrice,
    items: slot.items.map((item) => ({
      serviceId: item.serviceId,
      serviceName: nameById.get(item.serviceId) ?? item.serviceName,
      professionalId: item.professionalId,
      professionalName: professionalName.get(item.professionalId) ?? '',
      start: item.start.toISOString(),
      end: item.end.toISOString(),
      duration: item.duration,
      price: item.price,
    })),
  });
}

async function professionalNames(ids: string[]): Promise<Map<string, string>> {
  const rows = await db.professional.findMany({
    where: { id: { in: ids } },
    select: { id: true, displayName: true },
  });
  return new Map(rows.map((row) => [row.id, row.displayName]));
}

async function preferredProfessionalOf(customerId?: string): Promise<string | null> {
  if (customerId) {
    const customer = await db.customer.findUnique({
      where: { id: customerId },
      select: { preferredProfessionalId: true },
    });
    return customer?.preferredProfessionalId ?? null;
  }
  const user = await getCurrentUser();
  if (!user?.customerId) return null;
  const customer = await db.customer.findUnique({
    where: { id: user.customerId },
    select: { preferredProfessionalId: true },
  });
  return customer?.preferredProfessionalId ?? null;
}

async function resolveCustomerId(
  userId: string,
  name: string,
  email: string,
): Promise<string | null> {
  const existing = await db.customer.findUnique({ where: { userId }, select: { id: true } });
  if (existing) return existing.id;
  const created = await db.customer.create({
    data: { userId, name, email, phone: '' },
    select: { id: true },
  });
  return created.id;
}

/** Usado pela tela de remarcação para reabrir o fluxo já preenchido. */
export async function slotsForDate(
  branchId: string,
  selections: { serviceId: string; professionalId?: string | null }[],
  dateKey: string,
): Promise<SlotDTO[]> {
  const brand = await getBrand();
  const { requests } = await buildRequests(selections, branchId);
  if (requests.length === 0) return [];

  const date = parseDateKey(dateKey);
  const ctx = await loadScheduleContext(branchId, date, date, collectProfessionals(requests));
  const names = await professionalNames(collectProfessionals(requests));
  return slotsForDay(date, requests, ctx, {
    step: brand.booking.slotStep,
    minLeadTimeHours: brand.booking.minLeadTimeHours,
  }).map(toSlotDTO(requests, names));
}
