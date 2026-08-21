import type { Metadata } from 'next';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { requireStaff } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { formatDayDistance } from '@/lib/datetime';
import { formatPhone, parseList, pluralize } from '@/lib/utils';
import { Avatar, Badge, Card } from '@/components/ui/primitives';
import { EmptyState } from '@/components/ui/states';
import { CustomerSearch } from './customer-search';

export const metadata: Metadata = { title: 'Clientes' };
export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filtro?: string }>;
}) {
  await requireStaff();
  const { q, filtro } = await searchParams;

  const where = {
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { phone: { contains: q.replace(/\D/g, '') || q } },
            { email: { contains: q } },
          ],
        }
      : {}),
    ...(filtro === 'vip' ? { tags: { contains: 'VIP' } } : {}),
    ...(filtro === 'novas' ? { totalVisits: { lte: 1 } } : {}),
    ...(filtro === 'clube' ? { subscriptions: { some: { status: 'ACTIVE' } } } : {}),
  };

  const [customers, total] = await Promise.all([
    db.customer.findMany({
      where,
      orderBy: [{ lastVisitAt: 'desc' }, { createdAt: 'desc' }],
      take: 60,
      include: {
        preferredProfessional: { select: { displayName: true } },
        subscriptions: { where: { status: 'ACTIVE' }, select: { plan: { select: { name: true } } } },
        packages: { where: { status: 'ACTIVE' }, select: { id: true } },
        appointments: {
          where: { startAt: { gte: new Date() }, status: { in: ['PENDING', 'CONFIRMED'] } },
          orderBy: { startAt: 'asc' },
          take: 1,
          select: { startAt: true },
        },
      },
    }),
    db.customer.count(),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <p className="eyebrow">Relacionamento</p>
        <h1 className="mt-3 font-display text-[2.4rem] leading-none">Clientes</h1>
        <p className="mt-2 text-[13.5px] text-muted">
          {pluralize(total, 'cliente cadastrada', 'clientes cadastradas')}
        </p>
      </header>

      <CustomerSearch defaultValue={q ?? ''} filter={filtro ?? ''} />

      <div className="mt-6 space-y-2.5">
        {customers.length === 0 ? (
          <EmptyState
            icon={<Users size={20} />}
            title="Nenhuma cliente encontrada"
            description={q ? `Nada corresponde a “${q}”.` : 'Ajuste os filtros para ver mais.'}
          />
        ) : (
          customers.map((customer) => (
            <Link key={customer.id} href={`/admin/clientes/${customer.id}`}>
              <Card className="flex flex-wrap items-center gap-4 p-4 transition-colors hover:border-ink/25">
                <Avatar name={customer.name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-baseline gap-x-2 text-[14.5px] font-medium">
                    {customer.name}
                    {parseList(customer.tags).map((tag) => (
                      <Badge key={tag} tone="neutral">
                        {tag}
                      </Badge>
                    ))}
                    {customer.subscriptions[0] ? (
                      <Badge tone="accent">{customer.subscriptions[0].plan.name}</Badge>
                    ) : null}
                    {customer.packages.length ? (
                      <Badge tone="outline">
                        {pluralize(customer.packages.length, 'pacote', 'pacotes')}
                      </Badge>
                    ) : null}
                  </p>
                  <p className="mt-0.5 truncate text-[12.5px] text-muted">
                    {formatPhone(customer.phone)}
                    {customer.preferredProfessional
                      ? ` · prefere ${customer.preferredProfessional.displayName}`
                      : ''}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-[13px]">
                    {customer.lastVisitAt
                      ? `Última ${formatDayDistance(customer.lastVisitAt)}`
                      : 'Sem atendimento'}
                  </p>
                  <p className="mt-0.5 text-[12px] text-muted">
                    {customer.appointments[0]
                      ? `Próximo ${customer.appointments[0].startAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`
                      : `${customer.totalVisits} atendimentos`}
                  </p>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
