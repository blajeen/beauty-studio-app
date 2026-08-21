import 'server-only';
import { db } from '@/lib/db';
import { BLOCKING_STATUSES } from '@/lib/constants';
import { addDays, daysSince } from '@/lib/datetime';

/** Agendamentos futuros da cliente, com o roteiro completo. */
export async function getUpcomingAppointments(customerId: string, take = 10) {
  return db.appointment.findMany({
    where: {
      customerId,
      status: { in: BLOCKING_STATUSES },
      startAt: { gte: new Date() },
    },
    orderBy: { startAt: 'asc' },
    take,
    include: {
      branch: { select: { name: true, address: true } },
      event: { select: { id: true, name: true } },
      items: {
        orderBy: { sortOrder: 'asc' },
        include: {
          service: { select: { id: true, name: true, slug: true } },
          professional: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      },
    },
  });
}

export async function getPastAppointments(customerId: string, take = 30) {
  return db.appointment.findMany({
    where: {
      customerId,
      OR: [{ startAt: { lt: new Date() } }, { status: { in: ['COMPLETED', 'CANCELLED', 'NO_SHOW'] } }],
    },
    orderBy: { startAt: 'desc' },
    take,
    include: {
      branch: { select: { name: true } },
      items: {
        orderBy: { sortOrder: 'asc' },
        include: {
          service: { select: { id: true, name: true, slug: true } },
          professional: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      },
    },
  });
}

export type RecurrenceSuggestion = {
  serviceId: string;
  serviceSlug: string;
  serviceName: string;
  lastAt: Date;
  daysAgo: number;
  intervalDays: number;
  dueIn: number;
  professional: { id: string; displayName: string; avatarUrl: string | null } | null;
};

/**
 * RECORRÊNCIA (seções 15, 48 e 80)
 *
 * Cada serviço carrega o próprio intervalo sugerido. Comparamos com a última
 * vez que a cliente fez aquele serviço e devolvemos o que está no ponto —
 * ordenado pelo mais atrasado. Nada de aviso genérico.
 */
export async function getRecurrenceSuggestions(
  customerId: string,
  limit = 4,
): Promise<RecurrenceSuggestion[]> {
  const items = await db.appointmentItem.findMany({
    where: {
      appointment: { customerId, status: 'COMPLETED' },
      service: { returnIntervalDays: { not: null }, isActive: true },
    },
    orderBy: { startAt: 'desc' },
    include: {
      service: { select: { id: true, name: true, slug: true, returnIntervalDays: true } },
      professional: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  });

  // Já existe agendamento futuro para o serviço? Então não há o que sugerir.
  const upcoming = await db.appointmentItem.findMany({
    where: {
      appointment: { customerId, status: { in: BLOCKING_STATUSES } },
      startAt: { gte: new Date() },
    },
    select: { serviceId: true },
  });
  const scheduled = new Set(upcoming.map((item) => item.serviceId));

  const seen = new Set<string>();
  const suggestions: RecurrenceSuggestion[] = [];

  for (const item of items) {
    if (seen.has(item.serviceId) || scheduled.has(item.serviceId)) continue;
    seen.add(item.serviceId);

    const interval = item.service.returnIntervalDays!;
    const ago = daysSince(item.startAt);
    // Aparece a partir de 70% do intervalo — antes disso é cedo demais.
    if (ago < interval * 0.7) continue;

    suggestions.push({
      serviceId: item.serviceId,
      serviceSlug: item.service.slug,
      serviceName: item.service.name,
      lastAt: item.startAt,
      daysAgo: ago,
      intervalDays: interval,
      dueIn: interval - ago,
      professional: item.professional,
    });
  }

  return suggestions.sort((a, b) => a.dueIn - b.dueIn).slice(0, limit);
}

/** Pacotes com saldo e assinaturas ativas. */
export async function getCustomerBenefits(customerId: string) {
  const now = new Date();

  const [packages, subscriptions] = await Promise.all([
    db.customerPackage.findMany({
      where: { customerId, status: 'ACTIVE', expiresAt: { gte: now } },
      orderBy: { expiresAt: 'asc' },
      include: {
        package: {
          select: {
            name: true,
            sessions: true,
            service: { select: { name: true, slug: true } },
            items: { include: { service: { select: { name: true } } } },
          },
        },
      },
    }),
    db.subscription.findMany({
      where: { customerId, status: 'ACTIVE' },
      include: {
        plan: {
          include: { items: { include: { service: { select: { id: true, name: true, slug: true } } } } },
        },
        usages: { where: { cycleStart: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } } },
      },
    }),
  ]);

  return { packages, subscriptions };
}

/** Ficha técnica: o que foi feito, por quem e com quais parâmetros. */
export async function getProcedureHistory(customerId: string, take = 20) {
  return db.procedureRecord.findMany({
    where: { customerId },
    orderBy: { performedAt: 'desc' },
    take,
    include: {
      service: { select: { name: true, slug: true, recordSchema: true } },
      professional: { select: { id: true, displayName: true, avatarUrl: true } },
      photos: { where: { visibility: { in: ['CLIENT_VISIBLE', 'PUBLIC_PORTFOLIO'] } } },
    },
  });
}

/** Profissionais e serviços favoritos, derivados do próprio histórico. */
export async function getCustomerFavorites(customerId: string) {
  const items = await db.appointmentItem.findMany({
    where: { appointment: { customerId, status: 'COMPLETED' } },
    include: {
      service: { select: { id: true, name: true, slug: true, category: { select: { name: true } } } },
      professional: { select: { id: true, displayName: true, avatarUrl: true, title: true } },
    },
  });

  const byProfessional = new Map<
    string,
    { professional: (typeof items)[number]['professional']; services: Map<string, number>; count: number }
  >();

  for (const item of items) {
    const entry = byProfessional.get(item.professionalId) ?? {
      professional: item.professional,
      services: new Map<string, number>(),
      count: 0,
    };
    entry.count += 1;
    entry.services.set(item.service.name, (entry.services.get(item.service.name) ?? 0) + 1);
    byProfessional.set(item.professionalId, entry);
  }

  return Array.from(byProfessional.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
    .map((entry) => ({
      professional: entry.professional,
      count: entry.count,
      topService: Array.from(entry.services.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
    }));
}

export async function getCustomerNotifications(customerId: string, take = 8) {
  return db.notification.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    take,
  });
}

/** Regra de cancelamento: aplica a janela configurada pelo estúdio. */
export function cancellationWindow(startAt: Date, cancellationHours: number) {
  const limit = addDays(startAt, 0);
  limit.setHours(limit.getHours() - cancellationHours);
  return { withinPolicy: new Date() < limit, limit };
}
