import 'server-only';
import { db } from '@/lib/db';
import { BLOCKING_STATUSES } from '@/lib/constants';
import { endOfDay, startOfDay } from '@/lib/datetime';

export type AgendaFilters = {
  branchId?: string | null;
  professionalId?: string | null;
  categoryId?: string | null;
  serviceId?: string | null;
  status?: string | null;
};

/**
 * Itens da agenda em um intervalo. Uma única consulta serve à profissional
 * (restrita a ela), à gestão (com filtros) e ao dashboard.
 */
export async function getAgendaItems(from: Date, to: Date, filters: AgendaFilters = {}) {
  return db.appointmentItem.findMany({
    where: {
      startAt: { gte: startOfDay(from), lte: endOfDay(to) },
      ...(filters.professionalId ? { professionalId: filters.professionalId } : {}),
      ...(filters.serviceId ? { serviceId: filters.serviceId } : {}),
      ...(filters.categoryId ? { service: { categoryId: filters.categoryId } } : {}),
      appointment: {
        ...(filters.branchId ? { branchId: filters.branchId } : {}),
        status: filters.status ? { equals: filters.status } : { notIn: ['CANCELLED'] },
      },
    },
    orderBy: [{ startAt: 'asc' }],
    include: {
      service: {
        select: { id: true, name: true, slug: true, recordSchema: true, category: { select: { name: true, slug: true } } },
      },
      professional: { select: { id: true, displayName: true, avatarUrl: true } },
      procedure: { select: { id: true } },
      appointment: {
        select: {
          id: true,
          code: true,
          status: true,
          notes: true,
          readyByAt: true,
          totalPrice: true,
          branch: { select: { id: true, name: true } },
          event: { select: { id: true, name: true, readyByTime: true } },
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              totalVisits: true,
              lastVisitAt: true,
              notes: true,
              tags: true,
            },
          },
        },
      },
    },
  });
}

export type AgendaItem = Awaited<ReturnType<typeof getAgendaItems>>[number];

export async function getBlocksInRange(from: Date, to: Date, professionalId?: string | null) {
  return db.blockedSlot.findMany({
    where: {
      startAt: { lte: endOfDay(to) },
      endAt: { gte: startOfDay(from) },
      ...(professionalId ? { professionalId } : {}),
    },
    orderBy: { startAt: 'asc' },
    include: { professional: { select: { id: true, displayName: true } } },
  });
}

/** Clientes atendidas por uma profissional — base da agenda dela (seção 38). */
export async function getProfessionalClients(professionalId: string, take = 60) {
  const items = await db.appointmentItem.findMany({
    where: { professionalId },
    orderBy: { startAt: 'desc' },
    take: 400,
    select: {
      startAt: true,
      appointment: {
        select: {
          status: true,
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              totalVisits: true,
              lastVisitAt: true,
              tags: true,
            },
          },
        },
      },
      service: { select: { name: true } },
    },
  });

  const map = new Map<
    string,
    {
      customer: (typeof items)[number]['appointment']['customer'];
      lastAt: Date;
      lastService: string;
      visits: number;
    }
  >();

  for (const item of items) {
    const existing = map.get(item.appointment.customer.id);
    if (existing) {
      existing.visits += 1;
      continue;
    }
    map.set(item.appointment.customer.id, {
      customer: item.appointment.customer,
      lastAt: item.startAt,
      lastService: item.service.name,
      visits: 1,
    });
  }

  return Array.from(map.values())
    .sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime())
    .slice(0, take);
}

/** Ocupação do dia: usada no dashboard e no cabeçalho da agenda. */
export async function getOccupancy(date: Date, branchId?: string | null) {
  const from = startOfDay(date);
  const to = endOfDay(date);
  const weekday = date.getDay();

  const [items, hours] = await Promise.all([
    db.appointmentItem.findMany({
      where: {
        startAt: { gte: from, lte: to },
        appointment: {
          status: { in: BLOCKING_STATUSES.concat('COMPLETED') },
          ...(branchId ? { branchId } : {}),
        },
      },
      select: { duration: true, professionalId: true },
    }),
    db.professionalHours.findMany({
      where: {
        weekday,
        isOff: false,
        professional: {
          isActive: true,
          ...(branchId ? { branches: { some: { branchId } } } : {}),
        },
      },
      select: { professionalId: true, startTime: true, endTime: true, breakStart: true, breakEnd: true },
    }),
  ]);

  const capacity = hours.reduce((sum, shift) => {
    const [sh, sm] = shift.startTime.split(':').map(Number);
    const [eh, em] = shift.endTime.split(':').map(Number);
    let minutes = eh * 60 + em - (sh * 60 + sm);
    if (shift.breakStart && shift.breakEnd) {
      const [bsh, bsm] = shift.breakStart.split(':').map(Number);
      const [beh, bem] = shift.breakEnd.split(':').map(Number);
      minutes -= beh * 60 + bem - (bsh * 60 + bsm);
    }
    return sum + Math.max(minutes, 0);
  }, 0);

  const booked = items.reduce((sum, item) => sum + item.duration, 0);

  return {
    capacityMinutes: capacity,
    bookedMinutes: booked,
    rate: capacity > 0 ? Math.round((booked / capacity) * 100) : 0,
    workingProfessionals: new Set(hours.map((shift) => shift.professionalId)).size,
  };
}
