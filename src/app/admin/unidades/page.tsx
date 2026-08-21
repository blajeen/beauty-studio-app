import type { Metadata } from 'next';
import { requireStaff } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { getOccupancy } from '@/lib/data/agenda';
import { WEEKDAYS } from '@/lib/constants';
import { pluralize } from '@/lib/utils';
import { Avatar, Badge, Button, Card } from '@/components/ui/primitives';
import { SmartImage } from '@/components/ui/media';

export const metadata: Metadata = { title: 'Unidades' };
export const dynamic = 'force-dynamic';

export default async function AdminBranchesPage() {
  await requireStaff();

  const branches = await db.branch.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      businessHours: { orderBy: { weekday: 'asc' } },
      professionals: {
        include: {
          professional: { select: { id: true, displayName: true, avatarUrl: true, isActive: true } },
        },
      },
      _count: { select: { appointments: true } },
    },
  });

  const occupancies = await Promise.all(
    branches.map((branch) => getOccupancy(new Date(), branch.id)),
  );

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <p className="eyebrow">Estrutura</p>
        <h1 className="mt-3 font-display text-[2.4rem] leading-none">Unidades</h1>
        <p className="mt-2 text-[13.5px] text-muted">
          {pluralize(branches.length, 'unidade', 'unidades')} · horários, equipe e ocupação de hoje.
        </p>
      </header>

      <div className="space-y-6">
        {branches.map((branch, index) => {
          const occupancy = occupancies[index];
          return (
            <Card key={branch.id} className="overflow-hidden">
              <div className="grid sm:grid-cols-[220px_1fr]">
                <SmartImage
                  src={branch.imageUrl}
                  alt={branch.name}
                  seed={branch.name}
                  className="h-full min-h-40"
                />
                <div className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-2xl">{branch.name}</h2>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                        {branch.address}
                        {branch.district ? ` · ${branch.district}` : ''}
                        <br />
                        {branch.city}
                        {branch.state ? `/${branch.state}` : ''}
                        {branch.zip ? ` · ${branch.zip}` : ''}
                        {branch.phone ? ` · ${branch.phone}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-[2rem] leading-none">{occupancy.rate}%</p>
                      <p className="mt-1 text-[11.5px] text-muted">ocupação hoje</p>
                    </div>
                  </div>

                  {branch.notes ? (
                    <p className="mt-3 text-[12.5px] text-muted">{branch.notes}</p>
                  ) : null}

                  <div className="mt-5">
                    <p className="eyebrow mb-2.5">Equipe</p>
                    <div className="flex flex-wrap gap-2">
                      {branch.professionals.map((link) => (
                        <span
                          key={link.professionalId}
                          className="flex items-center gap-2 rounded-full border border-line px-2.5 py-1 text-[12px]"
                        >
                          <Avatar
                            name={link.professional.displayName}
                            src={link.professional.avatarUrl}
                            size="xs"
                            className="-ml-1.5 h-5 w-5 text-[9px]"
                          />
                          {link.professional.displayName}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-x-8 gap-y-1 sm:grid-cols-2">
                    {branch.businessHours.map((hours) => (
                      <div
                        key={hours.id}
                        className="flex justify-between gap-4 border-b border-line/60 py-1.5 text-[12.5px]"
                      >
                        <span className="text-muted">{WEEKDAYS[hours.weekday]}</span>
                        <span className={hours.isClosed ? 'text-muted' : 'font-medium'}>
                          {hours.isClosed ? 'Fechado' : `${hours.openTime} – ${hours.closeTime}`}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <Badge tone={branch.isActive ? 'success' : 'danger'}>
                      {branch.isActive ? 'Ativa' : 'Inativa'}
                    </Badge>
                    <span className="text-[12px] text-muted">
                      {branch._count.appointments} agendamentos no histórico
                    </span>
                    <Button
                      href={`/admin/agenda?unidade=${branch.id}`}
                      variant="secondary"
                      size="sm"
                      className="ml-auto"
                    >
                      Ver agenda
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
