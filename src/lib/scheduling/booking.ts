import 'server-only';
import { db } from '@/lib/db';
import { BLOCKING_STATUSES } from '@/lib/constants';
import { addMinutes } from '@/lib/datetime';
import { generateCode } from '@/lib/utils';
import type { ChainSlot } from './engine';

/**
 * CONFIRMAÇÃO ATÔMICA (seção 72)
 *
 * A grade de horários pode ficar desatualizada entre a leitura e o toque em
 * "confirmar". Por isso a verificação final acontece dentro da transação: se
 * alguém reservou primeiro, a reserva inteira falha — nunca gravamos metade.
 */

export type BookingResult =
  | { ok: true; appointmentId: string; code: string }
  | { ok: false; error: string; conflict?: boolean };

export type CreateBookingInput = {
  customerId: string;
  branchId: string;
  slot: ChainSlot;
  eventId?: string | null;
  readyByAt?: Date | null;
  notes?: string | null;
  source?: 'APP' | 'ADMIN' | 'WHATSAPP' | 'PRO';
  createdById?: string | null;
  status?: 'PENDING' | 'CONFIRMED';
};

export async function createBooking(input: CreateBookingInput): Promise<BookingResult> {
  const { slot } = input;
  if (slot.items.length === 0) return { ok: false, error: 'Nenhum serviço selecionado.' };
  if (slot.start < new Date()) return { ok: false, error: 'Este horário já passou.' };

  const bufferByService = await loadBuffers(slot.items.map((item) => item.serviceId));

  try {
    const appointment = await db.$transaction(async (tx) => {
      for (const item of slot.items) {
        const occupiedEnd = addMinutes(item.end, bufferByService.get(item.serviceId) ?? 0);

        const conflict = await tx.appointmentItem.findFirst({
          where: {
            professionalId: item.professionalId,
            startAt: { lt: occupiedEnd },
            endAt: { gt: item.start },
            appointment: { status: { in: BLOCKING_STATUSES } },
          },
          select: { id: true },
        });
        if (conflict) throw new ConflictError();

        const blocked = await tx.blockedSlot.findFirst({
          where: {
            startAt: { lt: item.end },
            endAt: { gt: item.start },
            OR: [{ professionalId: item.professionalId }, { professionalId: null, branchId: input.branchId }],
          },
          select: { id: true },
        });
        if (blocked) throw new ConflictError();
      }

      return tx.appointment.create({
        data: {
          code: generateCode(),
          customerId: input.customerId,
          branchId: input.branchId,
          eventId: input.eventId ?? null,
          status: input.status ?? 'CONFIRMED',
          startAt: slot.start,
          endAt: slot.end,
          totalPrice: slot.totalPrice,
          totalDuration: slot.totalDuration,
          readyByAt: input.readyByAt ?? null,
          notes: input.notes ?? null,
          source: input.source ?? 'APP',
          createdById: input.createdById ?? null,
          items: {
            create: slot.items.map((item, index) => ({
              serviceId: item.serviceId,
              professionalId: item.professionalId,
              startAt: item.start,
              endAt: item.end,
              duration: item.duration,
              price: item.price,
              sortOrder: index,
            })),
          },
        },
        select: { id: true, code: true },
      });
    });

    return { ok: true, appointmentId: appointment.id, code: appointment.code };
  } catch (error) {
    if (error instanceof ConflictError) {
      return {
        ok: false,
        conflict: true,
        error: 'Este horário acabou de ser reservado. Escolha outro horário disponível.',
      };
    }
    return { ok: false, error: 'Não foi possível concluir o agendamento. Tente novamente.' };
  }
}

/**
 * Remarcação (seção 53): preserva serviços, profissionais, evento e cliente.
 * Só a grade é recalculada — a reserva mantém o mesmo código.
 */
export async function rescheduleBooking(
  appointmentId: string,
  slot: ChainSlot,
): Promise<BookingResult> {
  const existing = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: { id: true, code: true, branchId: true, status: true },
  });
  if (!existing) return { ok: false, error: 'Agendamento não encontrado.' };
  if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(existing.status)) {
    return { ok: false, error: 'Este agendamento não pode mais ser alterado.' };
  }

  const bufferByService = await loadBuffers(slot.items.map((item) => item.serviceId));

  try {
    await db.$transaction(async (tx) => {
      for (const item of slot.items) {
        const occupiedEnd = addMinutes(item.end, bufferByService.get(item.serviceId) ?? 0);
        const conflict = await tx.appointmentItem.findFirst({
          where: {
            professionalId: item.professionalId,
            appointmentId: { not: appointmentId },
            startAt: { lt: occupiedEnd },
            endAt: { gt: item.start },
            appointment: { status: { in: BLOCKING_STATUSES } },
          },
          select: { id: true },
        });
        if (conflict) throw new ConflictError();
      }

      await tx.appointmentItem.deleteMany({ where: { appointmentId } });
      await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          startAt: slot.start,
          endAt: slot.end,
          totalDuration: slot.totalDuration,
          totalPrice: slot.totalPrice,
          items: {
            create: slot.items.map((item, index) => ({
              serviceId: item.serviceId,
              professionalId: item.professionalId,
              startAt: item.start,
              endAt: item.end,
              duration: item.duration,
              price: item.price,
              sortOrder: index,
            })),
          },
        },
      });
    });

    return { ok: true, appointmentId: existing.id, code: existing.code };
  } catch (error) {
    if (error instanceof ConflictError) {
      return { ok: false, conflict: true, error: 'Esse novo horário acabou de ser ocupado.' };
    }
    return { ok: false, error: 'Não foi possível remarcar. Tente novamente.' };
  }
}

export async function cancelBooking(
  appointmentId: string,
  reason: string | null,
  cancelledBy: string,
): Promise<{ ok: boolean; error?: string }> {
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: { status: true, customerId: true },
  });
  if (!appointment) return { ok: false, error: 'Agendamento não encontrado.' };
  if (appointment.status === 'CANCELLED') return { ok: true };
  if (['COMPLETED', 'NO_SHOW'].includes(appointment.status)) {
    return { ok: false, error: 'Este agendamento já foi finalizado.' };
  }

  await db.$transaction([
    db.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason,
        cancelledBy,
        items: { updateMany: { where: { appointmentId }, data: { status: 'CANCELLED' } } },
      },
    }),
    db.customer.update({
      where: { id: appointment.customerId },
      data: { cancelCount: { increment: 1 } },
    }),
  ]);

  return { ok: true };
}

/** Conclusão do atendimento — atualiza os contadores de relacionamento da ficha. */
export async function completeAppointment(appointmentId: string) {
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: { customerId: true, startAt: true, status: true },
  });
  if (!appointment || appointment.status === 'COMPLETED') return;

  await db.$transaction([
    db.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'COMPLETED',
        items: { updateMany: { where: { appointmentId }, data: { status: 'COMPLETED' } } },
      },
    }),
    db.customer.update({
      where: { id: appointment.customerId },
      data: {
        totalVisits: { increment: 1 },
        lastVisitAt: appointment.startAt,
      },
    }),
  ]);
}

async function loadBuffers(serviceIds: string[]): Promise<Map<string, number>> {
  const services = await db.service.findMany({
    where: { id: { in: Array.from(new Set(serviceIds)) } },
    select: { id: true, bufferAfter: true },
  });
  return new Map(services.map((service) => [service.id, service.bufferAfter]));
}

class ConflictError extends Error {
  constructor() {
    super('SLOT_CONFLICT');
    this.name = 'ConflictError';
  }
}
