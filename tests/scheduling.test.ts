/**
 * Testes do motor de agendamento (seção 89).
 *
 * Rodam contra o banco de desenvolvimento populado pelo seed: criam dados
 * próprios em um horário isolado, verificam o comportamento e limpam o que
 * criaram. Executar com `npm test`.
 */
import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import { PrismaClient } from '@prisma/client';
import {
  buildChain,
  loadScheduleContext,
  slotsForDay,
  collectProfessionals,
  type ChainRequest,
} from '../src/lib/scheduling/engine';
import { planBackward } from '../src/lib/scheduling/planner';
import { createBooking } from '../src/lib/scheduling/booking';
import { timeToMinutes, minutesToTime, overlaps, atTime, formatDuration } from '../src/lib/datetime';

const db = new PrismaClient();

/** Um dia útil futuro, longe dos dados do seed. */
function testDay(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 45);
  date.setHours(0, 0, 0, 0);
  while (date.getDay() === 0 || date.getDay() === 1) date.setDate(date.getDate() + 1);
  return date;
}

type Fixture = {
  branchId: string;
  customerId: string;
  manicure: { id: string; name: string; duration: number; price: number; bufferAfter: number };
  brow: { id: string; name: string; duration: number; price: number; bufferAfter: number };
  nailPro: string;
  browPro: string;
  createdAppointments: string[];
};

let fx: Fixture;

before(async () => {
  const branch = await db.branch.findFirstOrThrow({ orderBy: { sortOrder: 'asc' } });
  const manicure = await db.service.findFirstOrThrow({ where: { slug: 'manicure-tradicional' } });
  const brow = await db.service.findFirstOrThrow({ where: { slug: 'design-sobrancelhas' } });
  const customer = await db.customer.findFirstOrThrow();

  const nailOffer = await db.professionalService.findFirstOrThrow({
    where: { serviceId: manicure.id, professional: { branches: { some: { branchId: branch.id } } } },
  });
  const browOffer = await db.professionalService.findFirstOrThrow({
    where: { serviceId: brow.id, professional: { branches: { some: { branchId: branch.id } } } },
  });

  fx = {
    branchId: branch.id,
    customerId: customer.id,
    manicure,
    brow,
    nailPro: nailOffer.professionalId,
    browPro: browOffer.professionalId,
    createdAppointments: [],
  };
});

after(async () => {
  if (fx?.createdAppointments.length) {
    await db.appointment.deleteMany({ where: { id: { in: fx.createdAppointments } } });
  }
  await db.blockedSlot.deleteMany({ where: { reason: 'TESTE_AUTOMATIZADO' } });
  await db.$disconnect();
});

function requestFor(
  service: { id: string; name: string; duration: number; price: number; bufferAfter: number },
  professionalId?: string,
): ChainRequest {
  return {
    serviceId: service.id,
    serviceName: service.name,
    duration: service.duration,
    bufferAfter: service.bufferAfter,
    price: service.price,
    professionalId: professionalId ?? null,
    candidates: professionalId ? [professionalId] : [],
  };
}

async function contextFor(requests: ChainRequest[], day: Date) {
  return loadScheduleContext(fx.branchId, day, day, collectProfessionals(requests));
}

// ── utilidades de tempo ──────────────────────────────────────────────────────

test('conversão de horário ida e volta', () => {
  assert.equal(timeToMinutes('09:30'), 570);
  assert.equal(minutesToTime(570), '09:30');
  assert.equal(minutesToTime(0), '00:00');
  assert.equal(minutesToTime(1439), '23:59');
});

test('intervalos que apenas encostam não conflitam', () => {
  const a1 = new Date('2026-09-01T10:00:00');
  const a2 = new Date('2026-09-01T11:00:00');
  const b1 = new Date('2026-09-01T11:00:00');
  const b2 = new Date('2026-09-01T12:00:00');
  assert.equal(overlaps(a1, a2, b1, b2), false);
  assert.equal(overlaps(a1, a2, new Date('2026-09-01T10:59:00'), b2), true);
});

test('duração é formatada de forma legível', () => {
  assert.equal(formatDuration(40), '40 min');
  assert.equal(formatDuration(60), '1h');
  assert.equal(formatDuration(150), '2h30');
});

// ── disponibilidade ──────────────────────────────────────────────────────────

test('gera horários dentro do expediente', async () => {
  const day = testDay();
  const requests = [requestFor(fx.manicure, fx.nailPro)];
  const ctx = await contextFor(requests, day);
  const slots = slotsForDay(day, requests, ctx, { step: 15, minLeadTimeHours: 0 });

  assert.ok(slots.length > 0, 'deveria haver horários livres em um dia futuro');

  for (const slot of slots) {
    const minutes = slot.start.getHours() * 60 + slot.start.getMinutes();
    assert.ok(minutes >= timeToMinutes('09:00'), 'nenhum horário antes da abertura');
    const endMinutes = slot.end.getHours() * 60 + slot.end.getMinutes();
    assert.ok(endMinutes <= timeToMinutes('20:00'), 'nenhum horário depois do fechamento');
  }
});

test('respeita o intervalo de almoço da profissional', async () => {
  const day = testDay();
  const requests = [requestFor(fx.manicure, fx.nailPro)];
  const ctx = await contextFor(requests, day);
  const slots = slotsForDay(day, requests, ctx, { step: 15, minLeadTimeHours: 0 });

  const crossingLunch = slots.filter((slot) => {
    const start = slot.start.getHours() * 60 + slot.start.getMinutes();
    const end = start + fx.manicure.duration;
    return start < timeToMinutes('14:00') && timeToMinutes('13:00') < end;
  });

  assert.equal(crossingLunch.length, 0, 'nenhum atendimento pode invadir a pausa');
});

test('antecedência mínima remove horários próximos demais', async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (today.getDay() === 0) return; // domingo é fechado

  const requests = [requestFor(fx.manicure, fx.nailPro)];
  const ctx = await contextFor(requests, today);
  const withLead = slotsForDay(today, requests, ctx, { step: 15, minLeadTimeHours: 4 });
  const limit = new Date(Date.now() + 4 * 60 * 60 * 1000);

  for (const slot of withLead) {
    assert.ok(slot.start >= limit, 'nenhum horário dentro da janela de antecedência');
  }
});

// ── cadeia multi-serviço ─────────────────────────────────────────────────────

test('encadeia dois serviços com profissionais diferentes', async () => {
  const day = testDay();
  const requests = [requestFor(fx.manicure, fx.nailPro), requestFor(fx.brow, fx.browPro)];
  const ctx = await contextFor(requests, day);
  const slot = buildChain(requests, atTime(day, '10:00'), ctx, { step: 15 });

  assert.ok(slot, 'a cadeia deveria caber às 10:00');
  assert.equal(slot!.items.length, 2);
  assert.equal(slot!.items[0].professionalId, fx.nailPro);
  assert.equal(slot!.items[1].professionalId, fx.browPro);
  assert.ok(
    slot!.items[1].start >= slot!.items[0].end,
    'o segundo serviço começa depois do primeiro terminar',
  );
  assert.equal(slot!.totalPrice, fx.manicure.price + fx.brow.price);
});

test('a mesma profissional não é escalada para dois serviços ao mesmo tempo', async () => {
  const day = testDay();
  // Ambos os serviços exigem a mesma pessoa: ela precisa fazer um depois do outro.
  const shared = await db.professionalService.findFirst({
    where: {
      serviceId: fx.brow.id,
      professionalId: fx.nailPro,
    },
  });
  if (!shared) return; // esta profissional não acumula as duas especialidades

  const requests = [requestFor(fx.manicure, fx.nailPro), requestFor(fx.brow, fx.nailPro)];
  const ctx = await contextFor(requests, day);
  const slot = buildChain(requests, atTime(day, '10:00'), ctx, { step: 15, maxSlack: 60 });

  assert.ok(slot);
  assert.ok(
    slot!.items[1].start >= new Date(slot!.items[0].end.getTime() + fx.manicure.bufferAfter * 60000),
    'o buffer da primeira sessão precisa ser respeitado',
  );
});

// ── prevenção de conflito ────────────────────────────────────────────────────

test('reserva confirmada bloqueia o mesmo horário na segunda tentativa', async () => {
  const day = testDay();
  const requests = [requestFor(fx.manicure, fx.nailPro)];
  const ctx = await contextFor(requests, day);
  const slot = buildChain(requests, atTime(day, '15:00'), ctx, { step: 15 });
  assert.ok(slot, 'o horário de teste deveria estar livre');

  const first = await createBooking({
    customerId: fx.customerId,
    branchId: fx.branchId,
    slot: slot!,
  });
  assert.equal(first.ok, true);
  if (first.ok) fx.createdAppointments.push(first.appointmentId);

  // Segunda tentativa no mesmo horário — a transação precisa recusar.
  const second = await createBooking({
    customerId: fx.customerId,
    branchId: fx.branchId,
    slot: slot!,
  });
  assert.equal(second.ok, false);
  if (!second.ok) {
    assert.equal(second.conflict, true);
    if (second.ok === false && 'appointmentId' in second) {
      assert.fail('não deveria devolver id em caso de conflito');
    }
  }

  // E o horário some da grade.
  const after = await contextFor(requests, day);
  const remaining = slotsForDay(day, requests, after, { step: 15, minLeadTimeHours: 0 });
  assert.equal(
    remaining.some((item) => item.start.getTime() === slot!.start.getTime()),
    false,
    'o horário reservado não pode mais aparecer disponível',
  );
});

test('bloqueio da profissional remove o horário da grade', async () => {
  const day = testDay();
  const requests = [requestFor(fx.manicure, fx.nailPro)];

  const before = await contextFor(requests, day);
  const beforeSlots = slotsForDay(day, requests, before, { step: 15, minLeadTimeHours: 0 });
  const target = beforeSlots.find(
    (slot) => slot.start.getHours() === 17 && slot.start.getMinutes() === 0,
  );
  if (!target) return;

  await db.blockedSlot.create({
    data: {
      professionalId: fx.nailPro,
      startAt: atTime(day, '16:45'),
      endAt: atTime(day, '18:30'),
      reason: 'TESTE_AUTOMATIZADO',
    },
  });

  const after = await contextFor(requests, day);
  const afterSlots = slotsForDay(day, requests, after, { step: 15, minLeadTimeHours: 0 });

  assert.equal(
    afterSlots.some((slot) => slot.start.getTime() === target.start.getTime()),
    false,
    'horário bloqueado não pode ser oferecido',
  );
});

test('não é possível reservar no passado', async () => {
  const past = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const result = await createBooking({
    customerId: fx.customerId,
    branchId: fx.branchId,
    slot: {
      start: past,
      end: new Date(past.getTime() + 40 * 60000),
      totalDuration: 40,
      totalPrice: fx.manicure.price,
      items: [
        {
          serviceId: fx.manicure.id,
          serviceName: fx.manicure.name,
          professionalId: fx.nailPro,
          start: past,
          end: new Date(past.getTime() + 40 * 60000),
          duration: 40,
          price: fx.manicure.price,
        },
      ],
    },
  });

  assert.equal(result.ok, false);
});

// ── cronograma reverso ───────────────────────────────────────────────────────

test('cronograma reverso calcula o horário de início a partir do "pronta às"', () => {
  const readyBy = new Date('2026-09-15T18:00:00');
  const plan = planBackward(
    readyBy,
    [
      { name: 'Maquiagem', duration: 90 },
      { name: 'Cabelo', duration: 90 },
      { name: 'Sobrancelha', duration: 30 },
    ],
    15,
  );

  assert.equal(plan.totalDuration, 210);
  assert.equal(plan.suggestedStart.getHours(), 14);
  assert.equal(plan.suggestedStart.getMinutes(), 15);
  assert.equal(plan.steps[0].kind, 'PREP');
  assert.equal(plan.steps.at(-1)!.kind, 'READY');
  assert.equal(plan.steps.at(-1)!.start.getTime(), readyBy.getTime());

  // As etapas precisam formar uma linha contínua.
  const services = plan.steps.filter((step) => step.kind !== 'READY');
  for (let index = 1; index < services.length; index += 1) {
    assert.equal(services[index].start.getTime(), services[index - 1].end.getTime());
  }
});

test('cronograma reverso do exemplo da especificação: 18:00 menos 90 + 15 = 16:15', () => {
  const plan = planBackward(
    new Date('2026-09-15T18:00:00'),
    [{ name: 'Maquiagem', duration: 90 }],
    15,
  );
  assert.equal(plan.suggestedStart.getHours(), 16);
  assert.equal(plan.suggestedStart.getMinutes(), 15);
});
