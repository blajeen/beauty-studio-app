import type { Metadata } from 'next';
import Link from 'next/link';
import { requireStaff } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { endOfDay, formatDuration, startOfDay, addDays } from '@/lib/datetime';
import { parseList, pluralize } from '@/lib/utils';
import { WEEKDAYS_SHORT } from '@/lib/constants';
import { Avatar, Badge, Button, Card } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Profissionais' };
export const dynamic = 'force-dynamic';

export default async function AdminProfessionalsPage() {
  await requireStaff();
  const now = new Date();
  const weekAhead = addDays(now, 7);

  const professionals = await db.professional.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      user: { select: { email: true, isActive: true, lastLoginAt: true } },
      branches: { include: { branch: { select: { name: true } } } },
      hours: { orderBy: { weekday: 'asc' } },
      _count: {
        select: {
          services: true,
          portfolio: { where: { visibility: 'PUBLIC_PORTFOLIO' } },
        },
      },
      appointmentItems: {
        where: {
          startAt: { gte: startOfDay(now), lte: endOfDay(weekAhead) },
          appointment: { status: { notIn: ['CANCELLED'] } },
        },
        select: { duration: true, startAt: true },
      },
      blockedSlots: {
        where: { endAt: { gte: now } },
        orderBy: { startAt: 'asc' },
        take: 1,
      },
    },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <p className="eyebrow">Equipe</p>
        <h1 className="mt-3 font-display text-[2.4rem] leading-none">Profissionais</h1>
        <p className="mt-2 text-[13.5px] text-muted">
          {pluralize(professionals.length, 'profissional', 'profissionais')} · escala, serviços e
          carga da semana.
        </p>
      </header>

      <div className="space-y-4">
        {professionals.map((professional) => {
          const todayCount = professional.appointmentItems.filter(
            (item) => item.startAt <= endOfDay(now),
          ).length;
          const weekMinutes = professional.appointmentItems.reduce(
            (sum, item) => sum + item.duration,
            0,
          );
          const workingDays = professional.hours.filter((shift) => !shift.isOff);

          return (
            <Card key={professional.id} className="p-5">
              <div className="flex flex-wrap items-start gap-5">
                <Avatar
                  name={professional.displayName}
                  src={professional.avatarUrl}
                  size="lg"
                  className="shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h2 className="font-display text-xl">{professional.displayName}</h2>
                    <span className="text-[12.5px] text-muted">{professional.title}</span>
                    {!professional.isActive ? <Badge tone="danger">Inativa</Badge> : null}
                    {!professional.acceptsNewClients ? (
                      <Badge tone="warning">Agenda fechada</Badge>
                    ) : null}
                    {professional.blockedSlots[0] ? (
                      <Badge tone="outline">
                        Bloqueio a partir de{' '}
                        {professional.blockedSlots[0].startAt.toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </Badge>
                    ) : null}
                  </div>

                  <p className="mt-1.5 text-[12.5px] text-muted">
                    {professional.user.email}
                    {professional.user.lastLoginAt
                      ? ` · último acesso ${professional.user.lastLoginAt.toLocaleDateString('pt-BR')}`
                      : ' · nunca acessou'}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {parseList(professional.specialties).map((item) => (
                      <Badge key={item} tone="outline">
                        {item}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-[12.5px] text-muted">
                    <span>{professional._count.services} serviços</span>
                    <span>{professional._count.portfolio} no portfólio</span>
                    <span>
                      {professional.branches.map((link) => link.branch.name).join(' · ')}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {[0, 1, 2, 3, 4, 5, 6].map((weekday) => {
                      const shift = professional.hours.find((item) => item.weekday === weekday);
                      const works = shift && !shift.isOff;
                      return (
                        <span
                          key={weekday}
                          title={
                            works ? `${shift!.startTime} – ${shift!.endTime}` : 'Folga'
                          }
                          className={
                            works
                              ? 'rounded px-1.5 py-0.5 text-[11px] bg-primary-soft text-ink'
                              : 'rounded px-1.5 py-0.5 text-[11px] text-muted/50'
                          }
                        >
                          {WEEKDAYS_SHORT[weekday]}
                        </span>
                      );
                    })}
                    <span className="ml-2 text-[11.5px] text-muted">
                      {workingDays.length} dias por semana
                    </span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="font-display text-[2rem] leading-none">{todayCount}</p>
                  <p className="mt-1 text-[11.5px] text-muted">hoje</p>
                  <p className="mt-3 text-[12px] text-muted">
                    {formatDuration(weekMinutes)} na semana
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                <Button
                  href={`/admin/agenda?profissional=${professional.id}`}
                  variant="secondary"
                  size="sm"
                >
                  Ver agenda
                </Button>
                <Button href={`/profissionais/${professional.id}`} variant="ghost" size="sm">
                  Perfil público
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
