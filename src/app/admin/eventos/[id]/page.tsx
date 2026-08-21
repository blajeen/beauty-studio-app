import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, MapPin, Users } from 'lucide-react';
import { requireStaff } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { formatDuration, formatTime, minutesToTime, timeToMinutes } from '@/lib/datetime';
import { formatCurrency, formatPhone } from '@/lib/utils';
import {
  EVENT_STATUS_LABEL,
  EVENT_TYPE_LABEL,
  PARTICIPANT_ROLE_LABEL,
  type EventStatus,
  type EventType,
  type ParticipantRole,
} from '@/lib/constants';
import { Avatar, Badge, Button, Card, DataRow } from '@/components/ui/primitives';
import { EmptyState, Notice } from '@/components/ui/states';

export const metadata: Metadata = { title: 'Evento' };
export const dynamic = 'force-dynamic';

export default async function AdminEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireStaff();

  const event = await db.event.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      participants: { include: { customer: { select: { id: true, name: true } } } },
      appointments: {
        orderBy: { startAt: 'asc' },
        include: {
          customer: { select: { id: true, name: true } },
          branch: { select: { name: true } },
          items: {
            orderBy: { sortOrder: 'asc' },
            include: {
              service: { select: { name: true } },
              professional: { select: { id: true, displayName: true, avatarUrl: true } },
            },
          },
        },
      },
    },
  });

  if (!event) notFound();

  const total = event.appointments.reduce((sum, appointment) => sum + appointment.totalPrice, 0);
  const readyByMinutes = timeToMinutes(event.readyByTime);

  // Cronograma do dia: quem começa quando e quanto sobra até a hora combinada.
  const dayAppointments = event.appointments.filter(
    (appointment) => appointment.startAt.toDateString() === event.eventDate.toDateString(),
  );
  const preparation = event.appointments.filter(
    (appointment) => !dayAppointments.includes(appointment),
  );

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin/eventos"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} />
        Eventos
      </Link>

      <header className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">{EVENT_TYPE_LABEL[event.type as EventType]}</p>
          <h1 className="mt-3 font-display text-[2.4rem] leading-none">{event.name}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13.5px] text-muted">
            <span>
              {event.eventDate.toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={13} />
              pronta às {event.readyByTime}
            </span>
            {event.venue ? (
              <span className="flex items-center gap-1.5">
                <MapPin size={13} />
                {event.venue}
              </span>
            ) : null}
          </p>
        </div>
        <Badge tone={event.status === 'CONFIRMED' ? 'success' : 'outline'}>
          {EVENT_STATUS_LABEL[event.status as EventStatus]}
        </Badge>
      </header>

      {event.notes ? (
        <Notice tone="neutral" className="mt-6" title="Observações">
          {event.notes}
        </Notice>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-8">
          <section>
            <h2 className="font-display text-2xl">Cronograma do dia</h2>
            <p className="mt-1.5 text-[13px] text-muted">
              Todos precisam estar prontos às {event.readyByTime}.
            </p>

            <div className="mt-5 space-y-3">
              {dayAppointments.length === 0 ? (
                <EmptyState
                  compact
                  title="Nenhum atendimento no dia"
                  description="Os agendamentos do dia do evento aparecem aqui."
                />
              ) : (
                dayAppointments.map((appointment) => {
                  const endMinutes =
                    appointment.endAt.getHours() * 60 + appointment.endAt.getMinutes();
                  const slack = readyByMinutes - endMinutes;
                  return (
                    <Card key={appointment.id} className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <Link
                            href={`/admin/clientes/${appointment.customer.id}`}
                            className="text-[15px] font-medium underline-offset-4 hover:underline"
                          >
                            {appointment.customer.name}
                          </Link>
                          <p className="mt-0.5 text-[12.5px] text-muted">
                            {formatTime(appointment.startAt)} – {formatTime(appointment.endAt)} ·{' '}
                            {formatDuration(appointment.totalDuration)} · {appointment.branch.name}
                          </p>
                        </div>
                        <Badge tone={slack >= 0 ? 'success' : 'danger'}>
                          {slack >= 0
                            ? `${minutesToTime(slack)} de folga`
                            : `${minutesToTime(Math.abs(slack))} de atraso`}
                        </Badge>
                      </div>

                      <ul className="mt-4 divide-y divide-line/70">
                        {appointment.items.map((item) => (
                          <li key={item.id} className="flex items-center gap-4 py-2.5">
                            <span className="w-12 shrink-0 font-display text-lg tabular-nums text-ink/80">
                              {formatTime(item.startAt)}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-[13.5px]">
                              {item.service.name}
                            </span>
                            <span className="flex shrink-0 items-center gap-2 text-[12.5px] text-muted">
                              <Avatar
                                name={item.professional.displayName}
                                src={item.professional.avatarUrl}
                                size="xs"
                              />
                              {item.professional.displayName}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  );
                })
              )}
            </div>
          </section>

          {preparation.length > 0 ? (
            <section>
              <h2 className="font-display text-2xl">Antes do evento</h2>
              <p className="mt-1.5 text-[13px] text-muted">
                Testes e preparações agendados para outras datas.
              </p>
              <Card className="mt-5 divide-y divide-line">
                {preparation.map((appointment) => (
                  <div key={appointment.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
                    <span className="w-24 shrink-0 text-[12.5px] text-muted">
                      {appointment.startAt.toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                      })}{' '}
                      {formatTime(appointment.startAt)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13.5px]">
                      {appointment.customer.name} ·{' '}
                      {appointment.items.map((item) => item.service.name).join(' + ')}
                    </span>
                    <span className="shrink-0 text-[12.5px] text-muted">
                      {appointment.items[0]?.professional.displayName}
                    </span>
                  </div>
                ))}
              </Card>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4">
          <Card className="p-5">
            <p className="eyebrow mb-3">Resumo</p>
            <dl className="divide-y divide-line">
              <DataRow label="Organizadora" value={event.customer.name} />
              <DataRow label="Contato" value={formatPhone(event.customer.phone)} />
              <DataRow label="Participantes" value={event.participants.length} />
              <DataRow label="Atendimentos" value={event.appointments.length} />
              <DataRow label="Valor total" value={formatCurrency(total)} />
            </dl>
          </Card>

          <Card className="p-5">
            <p className="eyebrow mb-3 flex items-center gap-2">
              <Users size={13} />
              Participantes
            </p>
            <ul className="space-y-3">
              {event.participants.map((participant) => (
                <li key={participant.id} className="flex items-center gap-3">
                  <Avatar name={participant.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    {participant.customer ? (
                      <Link
                        href={`/admin/clientes/${participant.customer.id}`}
                        className="block truncate text-[13.5px] font-medium underline-offset-4 hover:underline"
                      >
                        {participant.name}
                      </Link>
                    ) : (
                      <p className="truncate text-[13.5px] font-medium">{participant.name}</p>
                    )}
                    <p className="text-[11.5px] text-muted">
                      {PARTICIPANT_ROLE_LABEL[participant.role as ParticipantRole] ??
                        participant.role}
                      {participant.phone ? ` · ${formatPhone(participant.phone)}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Button href="/agendar?ocasiao=1" variant="secondary" fullWidth>
            Adicionar atendimento
          </Button>
        </aside>
      </div>
    </div>
  );
}
