import 'server-only';
import { db } from '@/lib/db';
import { BLOCKING_STATUSES } from '@/lib/constants';
import {
  addDays,
  addMinutes,
  atTime,
  endOfDay,
  minutesToTime,
  overlaps,
  startOfDay,
  timeToMinutes,
} from '@/lib/datetime';

/**
 * MOTOR DE DISPONIBILIDADE
 *
 * Um único algoritmo atende todos os caminhos de agendamento da seção 10:
 * serviço → profissional, profissional → serviço, primeiro disponível, pacote e
 * evento. A diferença entre eles é apenas a montagem da lista de requisições.
 *
 * Conceitos:
 *  - duration      → tempo que a cliente vê e ocupa a cadeira
 *  - bufferAfter   → higienização/preparo; ocupa a profissional, some da UI
 *  - cadeia        → serviços em sequência, possivelmente com profissionais diferentes
 */

export type Interval = { start: Date; end: Date };

export type ChainRequest = {
  serviceId: string;
  serviceName: string;
  duration: number;
  bufferAfter: number;
  price: number;
  /** Profissional exigida pela cliente. Vazio = o motor escolhe. */
  professionalId?: string | null;
  /** Profissionais habilitadas para o serviço na unidade. */
  candidates: string[];
};

export type ChainItem = {
  serviceId: string;
  serviceName: string;
  professionalId: string;
  start: Date;
  end: Date;
  duration: number;
  price: number;
};

export type ChainSlot = {
  start: Date;
  end: Date;
  totalDuration: number;
  totalPrice: number;
  items: ChainItem[];
};

export type ScheduleContext = {
  branchId: string;
  businessHours: Map<number, { open: number; close: number; isClosed: boolean }>;
  proHours: Map<string, Map<number, { start: number; end: number; breakStart: number | null; breakEnd: number | null; isOff: boolean }>>;
  busyByPro: Map<string, Interval[]>;
  branchBlocks: Interval[];
  /** Nº de atendimentos por profissional no período — usado para distribuir a carga. */
  loadByPro: Map<string, number>;
};

export type SlotOptions = {
  /** Passo da grade, em minutos. */
  step?: number;
  /** Antecedência mínima, em horas. */
  minLeadTimeHours?: number;
  /** Quanto a cadeia pode deslizar para acomodar buffers, em minutos. */
  maxSlack?: number;
  /** Profissional preferida da cliente — entra primeiro na ordem de escolha. */
  preferredProfessionalId?: string | null;
  /** Ignora um agendamento (usado ao remarcar). */
  excludeAppointmentId?: string | null;
  /** Limita a quantidade de horários devolvidos por dia. */
  limit?: number;
  now?: Date;
};

const DEFAULTS = { step: 15, minLeadTimeHours: 2, maxSlack: 45 };

// ── CARREGAMENTO DE CONTEXTO ─────────────────────────────────────────────────

/**
 * Uma única leitura cobre todo o intervalo consultado. Evita N+1 ao varrer
 * vários dias procurando o primeiro horário disponível.
 */
export async function loadScheduleContext(
  branchId: string,
  from: Date,
  to: Date,
  professionalIds: string[],
  excludeAppointmentId?: string | null,
): Promise<ScheduleContext> {
  const rangeStart = startOfDay(from);
  const rangeEnd = endOfDay(to);
  const pros = Array.from(new Set(professionalIds));

  const [hours, proHourRows, items, blocks] = await Promise.all([
    db.businessHours.findMany({ where: { branchId } }),
    db.professionalHours.findMany({ where: { professionalId: { in: pros } } }),
    db.appointmentItem.findMany({
      where: {
        professionalId: { in: pros },
        startAt: { lt: rangeEnd },
        endAt: { gt: rangeStart },
        appointment: {
          status: { in: BLOCKING_STATUSES },
          ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
        },
      },
      select: {
        professionalId: true,
        startAt: true,
        endAt: true,
        service: { select: { bufferAfter: true } },
      },
    }),
    db.blockedSlot.findMany({
      where: {
        startAt: { lt: rangeEnd },
        endAt: { gt: rangeStart },
        OR: [{ professionalId: { in: pros } }, { professionalId: null, branchId }],
      },
      select: { professionalId: true, startAt: true, endAt: true },
    }),
  ]);

  const businessHours = new Map<number, { open: number; close: number; isClosed: boolean }>();
  for (const h of hours) {
    businessHours.set(h.weekday, {
      open: timeToMinutes(h.openTime),
      close: timeToMinutes(h.closeTime),
      isClosed: h.isClosed,
    });
  }

  const proHours: ScheduleContext['proHours'] = new Map();
  for (const h of proHourRows) {
    if (!proHours.has(h.professionalId)) proHours.set(h.professionalId, new Map());
    proHours.get(h.professionalId)!.set(h.weekday, {
      start: timeToMinutes(h.startTime),
      end: timeToMinutes(h.endTime),
      breakStart: h.breakStart ? timeToMinutes(h.breakStart) : null,
      breakEnd: h.breakEnd ? timeToMinutes(h.breakEnd) : null,
      isOff: h.isOff,
    });
  }

  const busyByPro = new Map<string, Interval[]>();
  const loadByPro = new Map<string, number>();
  const push = (proId: string, start: Date, end: Date) => {
    if (!busyByPro.has(proId)) busyByPro.set(proId, []);
    busyByPro.get(proId)!.push({ start, end });
  };

  for (const item of items) {
    push(item.professionalId, item.startAt, addMinutes(item.endAt, item.service.bufferAfter));
    loadByPro.set(item.professionalId, (loadByPro.get(item.professionalId) ?? 0) + 1);
  }

  const branchBlocks: Interval[] = [];
  for (const block of blocks) {
    if (block.professionalId) push(block.professionalId, block.startAt, block.endAt);
    else branchBlocks.push({ start: block.startAt, end: block.endAt });
  }

  return { branchId, businessHours, proHours, busyByPro, branchBlocks, loadByPro };
}

// ── VERIFICAÇÕES ─────────────────────────────────────────────────────────────

function withinWorkingHours(ctx: ScheduleContext, proId: string, start: Date, end: Date): boolean {
  const weekday = start.getDay();
  const shift = ctx.proHours.get(proId)?.get(weekday);
  if (!shift || shift.isOff) return false;

  const s = start.getHours() * 60 + start.getMinutes();
  const e = s + Math.round((end.getTime() - start.getTime()) / 60000);
  if (s < shift.start || e > shift.end) return false;

  if (shift.breakStart !== null && shift.breakEnd !== null) {
    if (s < shift.breakEnd && shift.breakStart < e) return false;
  }
  return true;
}

function isBranchOpen(ctx: ScheduleContext, start: Date, end: Date): boolean {
  const weekday = start.getDay();
  const hours = ctx.businessHours.get(weekday);
  if (!hours || hours.isClosed) return false;

  const s = start.getHours() * 60 + start.getMinutes();
  const e = s + Math.round((end.getTime() - start.getTime()) / 60000);
  if (s < hours.open || e > hours.close) return false;

  return !ctx.branchBlocks.some((block) => overlaps(start, end, block.start, block.end));
}

function isProFree(
  ctx: ScheduleContext,
  proId: string,
  start: Date,
  end: Date,
  chainBusy: Map<string, Interval[]>,
): boolean {
  const existing = ctx.busyByPro.get(proId);
  if (existing?.some((slot) => overlaps(start, end, slot.start, slot.end))) return false;
  const pending = chainBusy.get(proId);
  if (pending?.some((slot) => overlaps(start, end, slot.start, slot.end))) return false;
  return true;
}

/** Ordem de escolha: preferida da cliente → menor carga no dia → ordem cadastrada. */
function orderCandidates(
  candidates: string[],
  ctx: ScheduleContext,
  preferredProfessionalId?: string | null,
): string[] {
  return [...candidates].sort((a, b) => {
    if (a === preferredProfessionalId) return -1;
    if (b === preferredProfessionalId) return 1;
    return (ctx.loadByPro.get(a) ?? 0) - (ctx.loadByPro.get(b) ?? 0);
  });
}

// ── MONTAGEM DA CADEIA ───────────────────────────────────────────────────────

/**
 * Tenta encaixar a sequência inteira a partir de `startAt`.
 * Cada serviço pode deslizar até `maxSlack` para acomodar buffers e trocas de
 * profissional — é o que produz roteiros como 14:00 / 14:45 / 15:15.
 */
export function buildChain(
  requests: ChainRequest[],
  startAt: Date,
  ctx: ScheduleContext,
  options: SlotOptions = {},
): ChainSlot | null {
  const step = options.step ?? DEFAULTS.step;
  const maxSlack = options.maxSlack ?? DEFAULTS.maxSlack;
  const chainBusy = new Map<string, Interval[]>();
  const items: ChainItem[] = [];
  let cursor = startAt;

  for (const request of requests) {
    let placed: ChainItem | null = null;

    for (let shift = 0; shift <= maxSlack && !placed; shift += step) {
      const start = addMinutes(cursor, shift);
      const end = addMinutes(start, request.duration);
      if (!isBranchOpen(ctx, start, end)) continue;

      const pool = request.professionalId
        ? [request.professionalId]
        : orderCandidates(request.candidates, ctx, options.preferredProfessionalId);

      for (const proId of pool) {
        const occupiedEnd = addMinutes(end, request.bufferAfter);
        if (!withinWorkingHours(ctx, proId, start, end)) continue;
        if (!isProFree(ctx, proId, start, occupiedEnd, chainBusy)) continue;

        placed = {
          serviceId: request.serviceId,
          serviceName: request.serviceName,
          professionalId: proId,
          start,
          end,
          duration: request.duration,
          price: request.price,
        };
        if (!chainBusy.has(proId)) chainBusy.set(proId, []);
        chainBusy.get(proId)!.push({ start, end: occupiedEnd });
        break;
      }
    }

    if (!placed) return null;
    items.push(placed);
    cursor = placed.end;
  }

  const start = items[0].start;
  const end = items[items.length - 1].end;
  return {
    start,
    end,
    totalDuration: Math.round((end.getTime() - start.getTime()) / 60000),
    totalPrice: items.reduce((sum, item) => sum + item.price, 0),
    items,
  };
}

/** Todos os horários viáveis para a cadeia em um único dia. */
export function slotsForDay(
  date: Date,
  requests: ChainRequest[],
  ctx: ScheduleContext,
  options: SlotOptions = {},
): ChainSlot[] {
  const step = options.step ?? DEFAULTS.step;
  const now = options.now ?? new Date();
  const weekday = date.getDay();
  const hours = ctx.businessHours.get(weekday);
  if (!hours || hours.isClosed) return [];

  const leadTime = addMinutes(now, (options.minLeadTimeHours ?? DEFAULTS.minLeadTimeHours) * 60);
  const dayOpen = atTime(date, minutesToTime(hours.open));
  const dayClose = atTime(date, minutesToTime(hours.close));

  let cursor = dayOpen > leadTime ? dayOpen : ceilToStep(leadTime, step);
  const slots: ChainSlot[] = [];
  const limit = options.limit ?? Number.POSITIVE_INFINITY;

  while (cursor < dayClose && slots.length < limit) {
    const slot = buildChain(requests, cursor, ctx, options);
    // Só aceitamos a cadeia que começa exatamente no horário oferecido: caso
    // contrário a grade repetiria o mesmo roteiro em várias linhas.
    if (slot && slot.start.getTime() === cursor.getTime() && slot.end <= dayClose) {
      slots.push(slot);
    }
    cursor = addMinutes(cursor, step);
  }

  return slots;
}

function ceilToStep(date: Date, step: number): Date {
  const result = new Date(date);
  result.setSeconds(0, 0);
  const minutes = result.getMinutes();
  const rest = minutes % step;
  if (rest !== 0) result.setMinutes(minutes + (step - rest));
  return result;
}

/** Primeiro horário disponível a partir de uma data (seção 11). */
export async function findFirstAvailable(
  branchId: string,
  requests: ChainRequest[],
  from: Date,
  maxDays: number,
  options: SlotOptions = {},
): Promise<ChainSlot | null> {
  const pros = collectProfessionals(requests);
  if (pros.length === 0) return null;

  const to = addDays(from, maxDays);
  const ctx = await loadScheduleContext(branchId, from, to, pros, options.excludeAppointmentId);

  for (let offset = 0; offset <= maxDays; offset += 1) {
    const day = addDays(startOfDay(from), offset);
    const [slot] = slotsForDay(day, requests, ctx, { ...options, limit: 1 });
    if (slot) return slot;
  }
  return null;
}

/** Grade de vários dias — alimenta o calendário do fluxo de agendamento. */
export async function availabilityCalendar(
  branchId: string,
  requests: ChainRequest[],
  from: Date,
  days: number,
  options: SlotOptions = {},
): Promise<{ date: Date; slots: ChainSlot[] }[]> {
  const pros = collectProfessionals(requests);
  if (pros.length === 0) return [];

  const to = addDays(from, days);
  const ctx = await loadScheduleContext(branchId, from, to, pros, options.excludeAppointmentId);

  return Array.from({ length: days }, (_, offset) => {
    const date = addDays(startOfDay(from), offset);
    return { date, slots: slotsForDay(date, requests, ctx, options) };
  });
}

export function collectProfessionals(requests: ChainRequest[]): string[] {
  const set = new Set<string>();
  for (const request of requests) {
    if (request.professionalId) set.add(request.professionalId);
    else request.candidates.forEach((id) => set.add(id));
  }
  return Array.from(set);
}
