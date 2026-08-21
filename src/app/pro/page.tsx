import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarDays, Clock, MessageCircle, Sparkles } from 'lucide-react';
import { requireProfessional } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { getAgendaItems } from '@/lib/data/agenda';
import { endOfDay, formatDayDistance, formatDuration, formatTime, startOfDay } from '@/lib/datetime';
import { firstName, formatCurrency, parseList, whatsappLink } from '@/lib/utils';
import { getBrand } from '@/lib/brand/server';
import { Avatar, Badge, Button, Card } from '@/components/ui/primitives';
import { EmptyState, Notice } from '@/components/ui/states';
import { SmartImage } from '@/components/ui/media';
import { ProcedureDetails } from '@/components/procedure-record';
import { AgendaTimeline } from '@/components/agenda-timeline';

export const metadata: Metadata = { title: 'Hoje' };
export const dynamic = 'force-dynamic';

export default async function ProTodayPage() {
  const user = await requireProfessional();
  const brand = await getBrand();
  const now = new Date();

  const items = await getAgendaItems(now, now, { professionalId: user.professionalId });
  const active = items.filter((item) => item.appointment.status !== 'CANCELLED');
  const next = active.find((item) => item.endAt >= now) ?? null;

  const done = active.filter((item) => item.appointment.status === 'COMPLETED').length;
  const minutes = active.reduce((sum, item) => sum + item.duration, 0);
  const revenue = active.reduce((sum, item) => sum + item.price, 0);

  // Contexto da próxima cliente: último atendimento e inspirações enviadas.
  const [lastRecord, inspirations] = next
    ? await Promise.all([
        db.procedureRecord.findFirst({
          where: { customerId: next.appointment.customer.id, serviceId: next.serviceId },
          orderBy: { performedAt: 'desc' },
          include: { professional: { select: { displayName: true } } },
        }),
        db.inspirationImage.findMany({
          where: {
            customerId: next.appointment.customer.id,
            OR: [{ sharedWithId: user.professionalId }, { sharedWithId: null }],
          },
          orderBy: { createdAt: 'desc' },
          take: 4,
        }),
      ])
    : [null, []];

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <p className="eyebrow">
          {now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="mt-3 font-display text-[2.6rem] leading-none">
          Bom dia, {firstName(user.name)}
        </h1>
        <p className="mt-3 text-[14px] text-muted">
          {active.length === 0
            ? 'Nenhum atendimento marcado para hoje.'
            : `${active.length} atendimentos hoje · ${formatDuration(minutes)} de agenda · ${done} concluídos`}
        </p>
      </header>

      {next ? (
        <section>
          <h2 className="eyebrow mb-4">Próxima cliente</h2>
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line bg-primary-soft/40 px-6 py-5">
              <div className="flex items-center gap-4">
                <span className="font-display text-[2.6rem] leading-none tabular-nums">
                  {formatTime(next.startAt)}
                </span>
                <div>
                  <p className="text-[17px] font-medium">{next.appointment.customer.name}</p>
                  <p className="mt-0.5 text-[13px] text-muted">
                    {next.service.name} · {formatDuration(next.duration)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {next.appointment.customer.totalVisits <= 1 ? (
                  <Badge tone="accent">Primeira vez</Badge>
                ) : (
                  <Badge tone="outline">
                    {next.appointment.customer.totalVisits} atendimentos
                  </Badge>
                )}
                {parseList(next.appointment.customer.tags).map((tag) => (
                  <Badge key={tag} tone="neutral">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-5 p-6">
              {next.appointment.readyByAt || next.appointment.event ? (
                <Notice tone="accent" title="Atendimento com horário de entrega">
                  {next.appointment.event ? `${next.appointment.event.name} — ` : ''}
                  precisa estar pronta às{' '}
                  {next.appointment.readyByAt
                    ? formatTime(next.appointment.readyByAt)
                    : next.appointment.event?.readyByTime}
                  .
                </Notice>
              ) : null}

              {next.appointment.notes ? (
                <div>
                  <p className="eyebrow mb-2">Recado da cliente</p>
                  <p className="text-[14px] leading-relaxed text-ink/85">
                    {next.appointment.notes}
                  </p>
                </div>
              ) : null}

              {next.appointment.customer.notes ? (
                <div>
                  <p className="eyebrow mb-2">Ficha da cliente</p>
                  <p className="text-[13.5px] leading-relaxed text-ink/85">
                    {next.appointment.customer.notes}
                  </p>
                </div>
              ) : null}

              {lastRecord ? (
                <div>
                  {/* Sem "último/última": o nome do serviço define o gênero e a
                      frase precisa funcionar para todo o catálogo. */}
                  <p className="eyebrow mb-3">
                    Atendimento anterior · {next.service.name} ·{' '}
                    {formatDayDistance(lastRecord.performedAt)}
                  </p>
                  <ProcedureDetails record={lastRecord} />
                </div>
              ) : (
                <p className="text-[13px] text-muted">
                  Primeira vez com este serviço. Vale registrar tudo ao final para facilitar a
                  próxima.
                </p>
              )}

              {inspirations.length > 0 ? (
                <div>
                  <p className="eyebrow mb-3">Referências enviadas</p>
                  <div className="grid grid-cols-4 gap-2">
                    {inspirations.map((item) => (
                      <SmartImage
                        key={item.id}
                        src={item.imageUrl}
                        alt={item.note ?? 'Inspiração'}
                        seed="Inspiração"
                        ratio="square"
                        className="rounded-md"
                      />
                    ))}
                  </div>
                  {inspirations[0]?.note ? (
                    <p className="mt-2 text-[12.5px] text-muted">“{inspirations[0].note}”</p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3 border-t border-line px-6 py-4">
              <Button href={`/pro/atendimento/${next.id}`}>
                <Sparkles size={15} />
                Registrar atendimento
              </Button>
              <Button
                href={`/pro/clientes/${next.appointment.customer.id}`}
                variant="secondary"
              >
                Ver ficha completa
              </Button>
              <a
                href={whatsappLink(
                  next.appointment.customer.phone || brand.contact.whatsapp,
                  `Olá, ${firstName(next.appointment.customer.name)}! Aqui é ${firstName(user.name)}, do ${brand.name}.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-md border border-line px-4 text-[13.5px] text-ink/75 transition-colors hover:bg-primary-soft"
              >
                <MessageCircle size={15} />
                WhatsApp
              </a>
            </div>
          </Card>
        </section>
      ) : (
        <EmptyState
          icon={<CalendarDays size={20} />}
          title={active.length ? 'Dia concluído' : 'Nenhum atendimento hoje'}
          description={
            active.length
              ? 'Você atendeu todas as clientes de hoje. Bom descanso.'
              : 'Aproveite para atualizar seu portfólio ou revisar as fichas das próximas clientes.'
          }
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button href="/pro/agenda" variant="secondary">
                Ver agenda
              </Button>
              <Button href="/pro/portfolio">Atualizar portfólio</Button>
            </div>
          }
        />
      )}

      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl">Seu dia</h2>
          <Button href="/pro/agenda" variant="link" className="text-[13px]">
            Ver agenda completa
          </Button>
        </div>
        <div className="mt-5">
          <AgendaTimeline items={active} basePath="/pro/atendimento" emptyLabel="Sem atendimentos hoje." />
        </div>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="eyebrow">Atendimentos</p>
          <p className="mt-3 font-display text-[2.2rem] leading-none">{active.length}</p>
          <p className="mt-1.5 text-[12.5px] text-muted">{done} já concluídos</p>
        </Card>
        <Card className="p-5">
          <p className="eyebrow">Tempo em cadeira</p>
          <p className="mt-3 font-display text-[2.2rem] leading-none">{formatDuration(minutes)}</p>
          <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-muted">
            <Clock size={12} />
            somando todos os serviços
          </p>
        </Card>
        <Card className="p-5">
          <p className="eyebrow">Serviços do dia</p>
          <p className="mt-3 font-display text-[2.2rem] leading-none">
            {formatCurrency(revenue)}
          </p>
          <p className="mt-1.5 text-[12.5px] text-muted">valor dos atendimentos</p>
        </Card>
      </section>
    </div>
  );
}
