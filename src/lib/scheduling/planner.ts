import 'server-only';
import { db } from '@/lib/db';
import { addMinutes } from '@/lib/datetime';
import type { ChainRequest } from './engine';

export type ServiceSelection = {
  serviceId: string;
  /** Profissional exigida pela cliente; ausente = o motor escolhe. */
  professionalId?: string | null;
};

/**
 * Traduz a seleção da cliente em requisições para o motor.
 * Aqui vivem as regras de preço/duração por profissional (ProfessionalService),
 * a filtragem por unidade e a exclusão de quem está inativa.
 */
export async function buildRequests(
  selections: ServiceSelection[],
  branchId: string,
): Promise<{ requests: ChainRequest[]; problems: string[] }> {
  const serviceIds = Array.from(new Set(selections.map((s) => s.serviceId)));

  const services = await db.service.findMany({
    where: { id: { in: serviceIds }, isActive: true },
    include: {
      professionals: {
        where: {
          professional: {
            isActive: true,
            branches: { some: { branchId } },
          },
        },
        include: { professional: { select: { id: true, displayName: true, sortOrder: true } } },
      },
    },
  });

  const byId = new Map(services.map((service) => [service.id, service]));
  const requests: ChainRequest[] = [];
  const problems: string[] = [];

  for (const selection of selections) {
    const service = byId.get(selection.serviceId);
    if (!service) {
      problems.push('Um dos serviços selecionados não está mais disponível.');
      continue;
    }

    const offers = [...service.professionals].sort(
      (a, b) => a.professional.sortOrder - b.professional.sortOrder,
    );

    if (offers.length === 0) {
      problems.push(`${service.name} não é oferecido nesta unidade.`);
      continue;
    }

    const chosen = selection.professionalId
      ? offers.find((offer) => offer.professionalId === selection.professionalId)
      : null;

    if (selection.professionalId && !chosen) {
      problems.push(`A profissional escolhida não realiza ${service.name} nesta unidade.`);
      continue;
    }

    requests.push({
      serviceId: service.id,
      serviceName: service.name,
      duration: chosen?.customDuration ?? service.duration,
      bufferAfter: service.bufferAfter,
      price: chosen?.customPrice ?? service.price,
      professionalId: chosen?.professionalId ?? null,
      candidates: offers.map((offer) => offer.professionalId),
    });
  }

  return { requests, problems };
}

/**
 * Ordem sugerida dos serviços quando a cliente escolhe vários.
 * Regra de salão: o que suja/molha primeiro, o rosto por último — a maquiagem
 * nunca vem antes da sobrancelha, e as unhas secam enquanto o resto acontece.
 */
const CATEGORY_ORDER: Record<string, number> = {
  unhas: 10,
  'estetica-facial': 20,
  'estetica-corporal': 15,
  sobrancelhas: 30,
  cilios: 40,
  maquiagem: 50,
};

export async function sortSelections(selections: ServiceSelection[]): Promise<ServiceSelection[]> {
  const services = await db.service.findMany({
    where: { id: { in: selections.map((s) => s.serviceId) } },
    select: { id: true, category: { select: { slug: true } } },
  });
  const weight = new Map(
    services.map((service) => [service.id, CATEGORY_ORDER[service.category.slug] ?? 25]),
  );
  return [...selections].sort(
    (a, b) => (weight.get(a.serviceId) ?? 25) - (weight.get(b.serviceId) ?? 25),
  );
}

// ── CRONOGRAMA REVERSO (seções 25, 63, 64) ───────────────────────────────────

export type TimelineStep = {
  label: string;
  minutes: number;
  start: Date;
  end: Date;
  kind: 'PREP' | 'SERVICE' | 'READY';
};

export type BackwardPlan = {
  /** Horário sugerido para o início dos atendimentos. */
  suggestedStart: Date;
  readyBy: Date;
  totalDuration: number;
  prepBuffer: number;
  steps: TimelineStep[];
};

/**
 * "Preciso estar pronta às 18:00" → a que horas começar.
 * Soma a duração de cada serviço e um buffer de preparo, e devolve o
 * cronograma completo para exibição.
 */
export function planBackward(
  readyBy: Date,
  services: { name: string; duration: number }[],
  prepBuffer: number,
): BackwardPlan {
  const totalDuration = services.reduce((sum, service) => sum + service.duration, 0);
  const suggestedStart = addMinutes(readyBy, -(totalDuration + prepBuffer));

  const steps: TimelineStep[] = [];
  let cursor = suggestedStart;

  if (prepBuffer > 0) {
    const end = addMinutes(cursor, prepBuffer);
    steps.push({ label: 'Chegada e preparo', minutes: prepBuffer, start: cursor, end, kind: 'PREP' });
    cursor = end;
  }

  for (const service of services) {
    const end = addMinutes(cursor, service.duration);
    steps.push({ label: service.name, minutes: service.duration, start: cursor, end, kind: 'SERVICE' });
    cursor = end;
  }

  steps.push({ label: 'Pronta', minutes: 0, start: readyBy, end: readyBy, kind: 'READY' });

  return { suggestedStart, readyBy, totalDuration, prepBuffer, steps };
}
