import 'server-only';
import { db } from '@/lib/db';
import { addDays, daysSince, endOfDay, startOfDay } from '@/lib/datetime';
import { getOccupancy } from './agenda';

/**
 * MÉTRICAS DA DONA (seções 39 e 78)
 *
 * Números que mudam decisão: quanto do dia está vendido, quem está ocupada,
 * o que sai mais, quem parou de voltar. Nada de gráfico decorativo.
 */
export async function getDashboard(branchId?: string | null) {
  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const branchFilter = branchId ? { branchId } : {};

  const [todayItems, occupancy, monthAppointments, newCustomers, cancellations, noShows, activePackages, activeSubscriptions, upcomingEvents] =
    await Promise.all([
      db.appointmentItem.findMany({
        where: {
          startAt: { gte: dayStart, lte: dayEnd },
          appointment: { status: { notIn: ['CANCELLED'] }, ...branchFilter },
        },
        include: {
          service: { select: { id: true, name: true, category: { select: { id: true, name: true, slug: true } } } },
          professional: { select: { id: true, displayName: true, avatarUrl: true } },
          appointment: { select: { status: true, customerId: true } },
        },
      }),
      getOccupancy(now, branchId),
      db.appointment.findMany({
        where: { startAt: { gte: monthStart, lte: dayEnd }, ...branchFilter },
        select: { id: true, status: true, totalPrice: true, customerId: true, createdAt: true },
      }),
      db.customer.count({ where: { createdAt: { gte: monthStart } } }),
      db.appointment.count({
        where: { status: 'CANCELLED', startAt: { gte: monthStart }, ...branchFilter },
      }),
      db.appointment.count({
        where: { status: 'NO_SHOW', startAt: { gte: monthStart }, ...branchFilter },
      }),
      db.customerPackage.count({ where: { status: 'ACTIVE', expiresAt: { gte: now } } }),
      db.subscription.count({ where: { status: 'ACTIVE' } }),
      db.event.count({ where: { eventDate: { gte: now }, status: { not: 'CANCELLED' } } }),
    ]);

  const byCategory = new Map<string, { name: string; slug: string; count: number }>();
  const byProfessional = new Map<
    string,
    { id: string; name: string; avatarUrl: string | null; count: number; minutes: number }
  >();

  for (const item of todayItems) {
    const category = byCategory.get(item.service.category.id) ?? {
      name: item.service.category.name,
      slug: item.service.category.slug,
      count: 0,
    };
    category.count += 1;
    byCategory.set(item.service.category.id, category);

    const professional = byProfessional.get(item.professionalId) ?? {
      id: item.professionalId,
      name: item.professional.displayName,
      avatarUrl: item.professional.avatarUrl,
      count: 0,
      minutes: 0,
    };
    professional.count += 1;
    professional.minutes += item.duration;
    byProfessional.set(item.professionalId, professional);
  }

  const completedMonth = monthAppointments.filter((item) => item.status === 'COMPLETED');
  const monthRevenue = completedMonth.reduce((sum, item) => sum + item.totalPrice, 0);
  const uniqueCustomers = new Set(monthAppointments.map((item) => item.customerId));

  const returning = await db.customer.count({
    where: { id: { in: Array.from(uniqueCustomers) }, totalVisits: { gt: 1 } },
  });

  return {
    today: {
      total: todayItems.length,
      completed: todayItems.filter((item) => item.appointment.status === 'COMPLETED').length,
      remaining: todayItems.filter(
        (item) => item.appointment.status !== 'COMPLETED' && item.endAt >= now,
      ).length,
      categories: Array.from(byCategory.values()).sort((a, b) => b.count - a.count),
      professionals: Array.from(byProfessional.values()).sort((a, b) => b.count - a.count),
      occupancy,
    },
    month: {
      appointments: monthAppointments.length,
      completed: completedMonth.length,
      revenue: monthRevenue,
      newCustomers,
      returningCustomers: returning,
      cancellations,
      noShows,
      cancelRate:
        monthAppointments.length > 0
          ? Math.round((cancellations / monthAppointments.length) * 100)
          : 0,
    },
    programs: { activePackages, activeSubscriptions, upcomingEvents },
  };
}

/** Ranking de serviços do mês — alimenta decisões de preço e escala. */
export async function getTopServices(limit = 6, branchId?: string | null) {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const items = await db.appointmentItem.findMany({
    where: {
      startAt: { gte: monthStart },
      appointment: {
        status: { notIn: ['CANCELLED'] },
        ...(branchId ? { branchId } : {}),
      },
    },
    select: { serviceId: true, price: true, service: { select: { name: true } } },
  });

  const map = new Map<string, { name: string; count: number; revenue: number }>();
  for (const item of items) {
    const entry = map.get(item.serviceId) ?? { name: item.service.name, count: 0, revenue: 0 };
    entry.count += 1;
    entry.revenue += item.price;
    map.set(item.serviceId, entry);
  }

  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export type InactiveCustomer = {
  id: string;
  name: string;
  phone: string;
  lastVisitAt: Date;
  daysAway: number;
  lastService: string | null;
  professional: { id: string; displayName: string } | null;
  totalVisits: number;
};

/**
 * RETENÇÃO (seção 79)
 *
 * Clientes que passaram do próprio intervalo de retorno e não têm nada
 * marcado. É a lista que a dona usa para trabalhar reativação.
 */
export async function getInactiveCustomers(minDays = 45, limit = 20): Promise<InactiveCustomer[]> {
  const cutoff = addDays(new Date(), -minDays);

  const customers = await db.customer.findMany({
    where: {
      lastVisitAt: { lt: cutoff, not: null },
      appointments: { none: { startAt: { gte: new Date() }, status: { in: ['PENDING', 'CONFIRMED'] } } },
    },
    orderBy: { lastVisitAt: 'desc' },
    take: limit,
    include: {
      appointments: {
        where: { status: 'COMPLETED' },
        orderBy: { startAt: 'desc' },
        take: 1,
        include: {
          items: {
            take: 1,
            include: {
              service: { select: { name: true } },
              professional: { select: { id: true, displayName: true } },
            },
          },
        },
      },
    },
  });

  return customers
    .filter((customer) => customer.lastVisitAt)
    .map((customer) => {
      const last = customer.appointments[0]?.items[0];
      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        lastVisitAt: customer.lastVisitAt!,
        daysAway: daysSince(customer.lastVisitAt!),
        lastService: last?.service.name ?? null,
        professional: last?.professional ?? null,
        totalVisits: customer.totalVisits,
      };
    })
    .sort((a, b) => b.daysAway - a.daysAway);
}
