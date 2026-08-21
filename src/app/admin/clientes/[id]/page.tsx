import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth/guards';
import { getBrand } from '@/lib/brand/server';
import { getRecurrenceSuggestions } from '@/lib/data/customer';
import { formatDayDistance, formatDuration, formatTime } from '@/lib/datetime';
import { firstName, formatCurrency, formatPhone, parseList, percent, whatsappLink } from '@/lib/utils';
import { APPOINTMENT_STATUS_LABEL, type AppointmentStatus } from '@/lib/constants';
import { Avatar, Badge, Button, Card, DataRow } from '@/components/ui/primitives';
import { EmptyState } from '@/components/ui/states';
import { ProcedureDetails } from '@/components/procedure-record';
import { CustomerNoteEditor } from '@/app/pro/clientes/[id]/note-editor';

export const metadata: Metadata = { title: 'Ficha da cliente' };
export const dynamic = 'force-dynamic';

export default async function AdminCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireStaff();
  const brand = await getBrand();

  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      preferredProfessional: { select: { id: true, displayName: true, avatarUrl: true } },
      preferences: true,
      subscriptions: {
        where: { status: 'ACTIVE' },
        include: { plan: { select: { name: true, monthlyPrice: true } } },
      },
      packages: {
        where: { status: 'ACTIVE' },
        include: { package: { select: { name: true } } },
      },
      appointments: {
        orderBy: { startAt: 'desc' },
        take: 20,
        include: {
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
      procedures: {
        orderBy: { performedAt: 'desc' },
        take: 6,
        include: {
          service: { select: { name: true } },
          professional: { select: { displayName: true } },
        },
      },
    },
  });

  if (!customer) notFound();

  const recurrence = await getRecurrenceSuggestions(customer.id, 4);
  const upcoming = customer.appointments.filter(
    (appointment) =>
      appointment.startAt >= new Date() && ['PENDING', 'CONFIRMED'].includes(appointment.status),
  );
  const past = customer.appointments.filter((appointment) => !upcoming.includes(appointment));

  const favorites = new Map<string, { name: string; count: number }>();
  for (const appointment of customer.appointments) {
    for (const item of appointment.items) {
      const entry = favorites.get(item.professional.id) ?? {
        name: item.professional.displayName,
        count: 0,
      };
      entry.count += 1;
      favorites.set(item.professional.id, entry);
    }
  }
  const topProfessionals = Array.from(favorites.values()).sort((a, b) => b.count - a.count).slice(0, 3);

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/admin/clientes"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} />
        Clientes
      </Link>

      <header className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-5">
          <Avatar name={customer.name} size="xl" />
          <div>
            <h1 className="font-display text-[2.4rem] leading-none">{customer.name}</h1>
            <p className="mt-2 text-[13.5px] text-muted">
              {formatPhone(customer.phone)}
              {customer.email ? ` · ${customer.email}` : ''}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {parseList(customer.tags).map((tag) => (
                <Badge key={tag} tone="neutral">
                  {tag}
                </Badge>
              ))}
              {customer.subscriptions[0] ? (
                <Badge tone="accent">{customer.subscriptions[0].plan.name}</Badge>
              ) : null}
              <Badge tone={customer.consentPhotos ? 'success' : 'outline'}>
                {customer.consentPhotos ? 'Autoriza fotos' : 'Sem autorização de fotos'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={whatsappLink(
              customer.phone,
              `Olá, ${firstName(customer.name)}! Aqui é do ${brand.name}.`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-md border border-line px-4 text-[13.5px] transition-colors hover:bg-primary-soft"
          >
            <MessageCircle size={15} />
            WhatsApp
          </a>
          <Button href="/agendar">Agendar para ela</Button>
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section>
            <h2 className="font-display text-2xl">Próximos horários</h2>
            <div className="mt-4 space-y-2.5">
              {upcoming.length === 0 ? (
                <EmptyState compact title="Nada agendado" description="Esta cliente não tem horário marcado." />
              ) : (
                upcoming.map((appointment) => (
                  <Card key={appointment.id} className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-display text-lg">
                        {appointment.startAt.toLocaleDateString('pt-BR', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                        })}{' '}
                        · {formatTime(appointment.startAt)}
                      </p>
                      <Badge tone="success">
                        {APPOINTMENT_STATUS_LABEL[appointment.status as AppointmentStatus]}
                      </Badge>
                    </div>
                    <ul className="mt-3 space-y-1.5">
                      {appointment.items.map((item) => (
                        <li key={item.id} className="flex items-center gap-3 text-[13px]">
                          <span className="w-12 text-muted tabular-nums">
                            {formatTime(item.startAt)}
                          </span>
                          <span className="min-w-0 flex-1 truncate">{item.service.name}</span>
                          <span className="shrink-0 text-muted">
                            {item.professional.displayName}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 border-t border-line pt-2.5 text-[12.5px] text-muted">
                      {appointment.branch.name} · {formatCurrency(appointment.totalPrice)} · código{' '}
                      {appointment.code}
                    </p>
                  </Card>
                ))
              )}
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl">Histórico</h2>
            <div className="mt-4 divide-y divide-line border-y border-line">
              {past.length === 0 ? (
                <p className="py-6 text-[13px] text-muted">Sem atendimentos anteriores.</p>
              ) : (
                past.map((appointment) => (
                  <div key={appointment.id} className="flex flex-wrap items-center gap-4 py-3">
                    <span className="w-24 shrink-0 text-[12.5px] text-muted">
                      {appointment.startAt.toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                      })}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13.5px]">
                      {appointment.items.map((item) => item.service.name).join(' + ')}
                    </span>
                    <span className="shrink-0 text-[12.5px] text-muted">
                      {appointment.items[0]?.professional.displayName}
                    </span>
                    <Badge
                      tone={
                        appointment.status === 'COMPLETED'
                          ? 'neutral'
                          : appointment.status === 'CANCELLED' || appointment.status === 'NO_SHOW'
                            ? 'danger'
                            : 'outline'
                      }
                    >
                      {APPOINTMENT_STATUS_LABEL[appointment.status as AppointmentStatus]}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl">Fichas técnicas recentes</h2>
            <div className="mt-4 space-y-3">
              {customer.procedures.length === 0 ? (
                <p className="text-[13px] text-muted">Nenhuma ficha registrada.</p>
              ) : (
                customer.procedures.map((procedure) => (
                  <Card key={procedure.id} className="p-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <p className="text-[14px] font-medium">{procedure.service.name}</p>
                      <p className="text-[12px] text-muted">
                        {procedure.professional.displayName} ·{' '}
                        {formatDayDistance(procedure.performedAt)}
                      </p>
                    </div>
                    <ProcedureDetails record={procedure} className="mt-3.5" />
                  </Card>
                ))
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <Card className="p-5">
            <p className="eyebrow mb-3">Resumo</p>
            <dl className="divide-y divide-line">
              <DataRow label="Atendimentos" value={customer.totalVisits} />
              <DataRow
                label="Primeira visita"
                value={
                  customer.firstVisitAt
                    ? customer.firstVisitAt.toLocaleDateString('pt-BR')
                    : '—'
                }
              />
              <DataRow
                label="Última visita"
                value={
                  customer.lastVisitAt ? formatDayDistance(customer.lastVisitAt) : 'nunca'
                }
              />
              <DataRow label="Cancelamentos" value={customer.cancelCount} />
              <DataRow label="Faltas" value={customer.noShowCount} />
            </dl>
          </Card>

          {topProfessionals.length ? (
            <Card className="p-5">
              <p className="eyebrow mb-3">Profissionais favoritas</p>
              <ul className="space-y-2">
                {topProfessionals.map((professional) => (
                  <li key={professional.name} className="flex items-center justify-between gap-3">
                    <span className="text-[13.5px]">{professional.name}</span>
                    <span className="text-[12px] text-muted">{professional.count}×</span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {recurrence.length ? (
            <Card className="p-5">
              <p className="eyebrow mb-3">No ponto de retornar</p>
              <ul className="space-y-3">
                {recurrence.map((item) => (
                  <li key={item.serviceId}>
                    <p className="text-[13.5px] font-medium">{item.serviceName}</p>
                    <p className="mt-0.5 text-[12px] text-muted">
                      há {item.daysAgo} dias · intervalo de {item.intervalDays}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {customer.packages.length ? (
            <Card className="p-5">
              <p className="eyebrow mb-3">Pacotes ativos</p>
              <ul className="space-y-3">
                {customer.packages.map((item) => (
                  <li key={item.id}>
                    <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
                      <span>{item.package.name}</span>
                      <span className="text-muted">
                        {item.usedSessions}/{item.totalSessions}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-primary-soft">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${percent(item.usedSessions, item.totalSessions)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {customer.preferences.length ? (
            <Card className="p-5">
              <p className="eyebrow mb-3">Preferências</p>
              <dl className="space-y-2">
                {customer.preferences.map((preference) => (
                  <div key={preference.id} className="flex justify-between gap-4 text-[13px]">
                    <dt className="text-muted">{preference.key}</dt>
                    <dd className="text-right font-medium">{preference.value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          ) : null}

          <CustomerNoteEditor customerId={customer.id} notes={customer.notes ?? ''} />
        </aside>
      </div>
    </div>
  );
}
