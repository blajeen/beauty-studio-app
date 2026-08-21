import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CalendarCheck,
  CalendarX,
  Gauge,
  Gift,
  PartyPopper,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { requireStaff, can } from '@/lib/auth/guards';
import { getDashboard, getInactiveCustomers, getTopServices } from '@/lib/data/dashboard';
import { getAgendaItems } from '@/lib/data/agenda';
import { formatDuration } from '@/lib/datetime';
import { firstName, formatCurrency, percent, pluralize } from '@/lib/utils';
import { Avatar, Badge, Button, Card } from '@/components/ui/primitives';
import { DashboardCard } from '@/components/cards';
import { AgendaTimeline } from '@/components/agenda-timeline';

export const metadata: Metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const user = await requireStaff();
  const now = new Date();

  const [data, topServices, inactive, agenda] = await Promise.all([
    getDashboard(),
    getTopServices(5),
    getInactiveCustomers(45, 5),
    getAgendaItems(now, now),
  ]);

  const showFinance = can(user.role, 'finance.view');
  const next = agenda.filter(
    (item) => item.endAt >= now && item.appointment.status !== 'CANCELLED',
  );

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8">
        <p className="eyebrow">
          {now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="mt-3 font-display text-[2.6rem] leading-none">
          Bom dia, {firstName(user.name)}
        </h1>
        <p className="mt-3 text-[14px] text-muted">
          {data.today.total === 0
            ? 'Nenhum atendimento marcado para hoje.'
            : `${pluralize(data.today.total, 'atendimento', 'atendimentos')} hoje · ${data.today.occupancy.rate}% de ocupação · ${pluralize(data.today.occupancy.workingProfessionals, 'profissional em escala', 'profissionais em escala')}`}
        </p>
      </header>

      {/* Hoje */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          tone="dark"
          label="Atendimentos hoje"
          value={data.today.total}
          hint={`${data.today.completed} concluídos · ${data.today.remaining} a fazer`}
          icon={<CalendarCheck size={17} />}
          href="/admin/agenda"
        />
        <DashboardCard
          label="Ocupação"
          value={`${data.today.occupancy.rate}%`}
          hint={`${formatDuration(data.today.occupancy.bookedMinutes)} de ${formatDuration(data.today.occupancy.capacityMinutes)}`}
          icon={<Gauge size={17} />}
        />
        <DashboardCard
          label="Clientes novas no mês"
          value={data.month.newCustomers}
          hint={`${data.month.returningCustomers} recorrentes`}
          icon={<UserPlus size={17} />}
          href="/admin/clientes"
        />
        <DashboardCard
          label="Cancelamentos no mês"
          value={data.month.cancellations}
          hint={`${data.month.cancelRate}% do total · ${data.month.noShows} faltas`}
          icon={<CalendarX size={17} />}
        />
      </section>

      {/* Distribuição do dia */}
      <section className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card className="p-6">
          <p className="eyebrow mb-5">Hoje por categoria</p>
          {data.today.categories.length === 0 ? (
            <p className="text-[13px] text-muted">Nenhum atendimento hoje.</p>
          ) : (
            <ul className="space-y-3.5">
              {data.today.categories.map((category) => (
                <li key={category.slug}>
                  <div className="flex items-baseline justify-between gap-4 text-[13.5px]">
                    <span>{category.name}</span>
                    <span className="text-muted">
                      {category.count} · {percent(category.count, data.today.total)}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-primary-soft">
                    <div
                      className="h-full rounded-full bg-accent transition-[width] duration-700"
                      style={{ width: `${percent(category.count, data.today.total)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <p className="eyebrow mb-5">Profissionais mais ocupadas hoje</p>
          {data.today.professionals.length === 0 ? (
            <p className="text-[13px] text-muted">Ninguém com atendimento hoje.</p>
          ) : (
            <ul className="space-y-3">
              {data.today.professionals.map((professional) => (
                <li key={professional.id}>
                  <Link
                    href={`/admin/agenda?profissional=${professional.id}`}
                    className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-primary-soft"
                  >
                    <Avatar name={professional.name} src={professional.avatarUrl} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium">
                        {professional.name}
                      </span>
                      <span className="block text-[12px] text-muted">
                        {professional.count} atendimentos · {formatDuration(professional.minutes)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {/* Mês */}
      <section className="mt-8">
        <h2 className="font-display text-2xl">Este mês</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            label="Atendimentos"
            value={data.month.appointments}
            hint={`${data.month.completed} concluídos`}
            icon={<TrendingUp size={17} />}
          />
          {showFinance ? (
            <DashboardCard
              label="Serviços concluídos"
              value={formatCurrency(data.month.revenue)}
              hint="soma dos atendimentos realizados"
            />
          ) : null}
          <DashboardCard
            label="Pacotes ativos"
            value={data.programs.activePackages}
            hint={`${data.programs.activeSubscriptions} assinaturas`}
            icon={<Gift size={17} />}
            href="/admin/programas"
          />
          <DashboardCard
            label="Eventos futuros"
            value={data.programs.upcomingEvents}
            hint="noivas e produções"
            icon={<PartyPopper size={17} />}
            href="/admin/eventos"
          />
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <p className="eyebrow mb-5">Serviços mais vendidos no mês</p>
          {topServices.length === 0 ? (
            <p className="text-[13px] text-muted">Ainda sem dados neste mês.</p>
          ) : (
            <ol className="space-y-3">
              {topServices.map((service, index) => (
                <li key={service.name} className="flex items-center gap-4">
                  <span className="w-5 shrink-0 font-display text-lg text-muted">{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-[13.5px]">{service.name}</span>
                  <span className="shrink-0 text-[12.5px] text-muted">
                    {service.count}×{showFinance ? ` · ${formatCurrency(service.revenue)}` : ''}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card className="p-6">
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <p className="eyebrow">Clientes para reativar</p>
            <Link href="/admin/retencao" className="text-[12.5px] underline underline-offset-4">
              Ver todas
            </Link>
          </div>
          {inactive.length === 0 ? (
            <p className="text-[13px] text-muted">
              Ninguém fora do intervalo de retorno. Boa notícia.
            </p>
          ) : (
            <ul className="space-y-3">
              {inactive.map((customer) => (
                <li key={customer.id}>
                  <Link
                    href={`/admin/clientes/${customer.id}`}
                    className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-primary-soft"
                  >
                    <Avatar name={customer.name} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium">
                        {customer.name}
                      </span>
                      <span className="block text-[12px] text-muted">
                        {customer.lastService ?? 'Último atendimento'} · há {customer.daysAway} dias
                      </span>
                    </span>
                    <Badge tone={customer.daysAway > 90 ? 'danger' : 'warning'}>
                      {customer.daysAway}d
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl">Próximos atendimentos</h2>
          <Button href="/admin/agenda" variant="link" className="text-[13px]">
            Abrir agenda
          </Button>
        </div>
        <div className="mt-5">
          <AgendaTimeline
            items={next.slice(0, 8)}
            basePath="/admin/atendimento"
            showProfessional
            showBranch
            emptyLabel="Nada mais para hoje."
          />
        </div>
      </section>
    </div>
  );
}
