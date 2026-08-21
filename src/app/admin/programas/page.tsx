import type { Metadata } from 'next';
import Link from 'next/link';
import { requireStaff } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { getBrand } from '@/lib/brand/server';
import { formatCurrency, percent, pluralize } from '@/lib/utils';
import { Avatar, Badge, Card } from '@/components/ui/primitives';
import { EmptyState } from '@/components/ui/states';
import { DashboardCard } from '@/components/cards';

export const metadata: Metadata = { title: 'Pacotes e Beauty Club' };
export const dynamic = 'force-dynamic';

export default async function ProgramsPage() {
  await requireStaff();
  const brand = await getBrand();
  const now = new Date();

  const [packages, plans, activePackages, subscriptions] = await Promise.all([
    db.package.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { purchases: true } } },
    }),
    db.plan.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        items: { include: { service: { select: { name: true } } } },
        _count: { select: { subscriptions: { where: { status: 'ACTIVE' } } } },
      },
    }),
    db.customerPackage.findMany({
      where: { status: 'ACTIVE', expiresAt: { gte: now } },
      orderBy: { expiresAt: 'asc' },
      include: {
        customer: { select: { id: true, name: true } },
        package: { select: { name: true } },
      },
    }),
    db.subscription.findMany({
      where: { status: 'ACTIVE' },
      include: {
        customer: { select: { id: true, name: true } },
        plan: { select: { name: true, monthlyPrice: true } },
      },
    }),
  ]);

  const monthlyRecurring = subscriptions.reduce(
    (sum, subscription) => sum + subscription.plan.monthlyPrice,
    0,
  );
  const expiringSoon = activePackages.filter(
    (item) => item.expiresAt.getTime() - now.getTime() < 15 * 24 * 60 * 60 * 1000,
  );

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <p className="eyebrow">Programas</p>
        <h1 className="mt-3 font-display text-[2.4rem] leading-none">Pacotes e Beauty Club</h1>
        <p className="mt-2 text-[13.5px] text-muted">
          Recorrência contratada e saldo em aberto no estúdio.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          tone="dark"
          label="Assinaturas ativas"
          value={subscriptions.length}
          hint={`${formatCurrency(monthlyRecurring)} por mês`}
        />
        <DashboardCard
          label="Pacotes em uso"
          value={activePackages.length}
          hint={`${expiringSoon.length} vencem em 15 dias`}
        />
        <DashboardCard
          label="Sessões em aberto"
          value={activePackages.reduce(
            (sum, item) => sum + (item.totalSessions - item.usedSessions),
            0,
          )}
          hint="já pagas, ainda não usadas"
        />
        <DashboardCard
          label="Pacotes vendidos"
          value={packages.reduce((sum, item) => sum + item._count.purchases, 0)}
          hint="total histórico"
        />
      </section>

      {brand.features.beautyClub ? (
        <section className="mt-10">
          <h2 className="font-display text-2xl">Beauty Club</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className="p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-display text-xl">{plan.name}</p>
                  {plan.highlight ? <Badge tone="accent">Destaque</Badge> : null}
                </div>
                <p className="mt-1 text-[12.5px] text-muted">{plan.tagline}</p>
                <p className="mt-4 font-display text-3xl">
                  {formatCurrency(plan.monthlyPrice)}
                  <span className="text-[13px] text-muted">/mês</span>
                </p>
                <p className="mt-2 text-[13px] text-muted">
                  {pluralize(plan._count.subscriptions, 'assinante', 'assinantes')} ·{' '}
                  {formatCurrency(plan._count.subscriptions * plan.monthlyPrice)}/mês
                </p>
                <ul className="mt-4 space-y-1 border-t border-line pt-3 text-[12.5px] text-muted">
                  {plan.items.map((item) => (
                    <li key={item.id}>
                      {item.quantityPerCycle}× {item.service.name}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          <div className="mt-5">
            <p className="eyebrow mb-3">Assinantes</p>
            {subscriptions.length === 0 ? (
              <EmptyState compact title="Nenhuma assinante ainda" description="O clube ainda não teve adesões." />
            ) : (
              <Card className="divide-y divide-line">
                {subscriptions.map((subscription) => (
                  <Link
                    key={subscription.id}
                    href={`/admin/clientes/${subscription.customer.id}`}
                    className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-primary-soft"
                  >
                    <Avatar name={subscription.customer.name} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-[13.5px]">
                      {subscription.customer.name}
                    </span>
                    <Badge tone="outline">{subscription.plan.name}</Badge>
                    <span className="shrink-0 text-[12.5px] text-muted">
                      ciclo até{' '}
                      {subscription.cycleEnd.toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </span>
                  </Link>
                ))}
              </Card>
            )}
          </div>
        </section>
      ) : null}

      {brand.features.packages ? (
        <section className="mt-12">
          <h2 className="font-display text-2xl">Pacotes</h2>

          <Card className="mt-5 divide-y divide-line">
            {packages.map((pack) => (
              <div key={pack.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-baseline gap-x-2 text-[14px] font-medium">
                    {pack.name}
                    {pack.isCombo ? <Badge tone="outline">Combo</Badge> : null}
                    {!pack.isActive ? <Badge tone="danger">Inativo</Badge> : null}
                  </p>
                  <p className="mt-0.5 text-[12px] text-muted">
                    {pack.tagline} · validade de {pack.validityDays} dias
                  </p>
                </div>
                <span className="shrink-0 text-[13.5px]">{formatCurrency(pack.price)}</span>
                <span className="w-24 shrink-0 text-right text-[12.5px] text-muted">
                  {pack._count.purchases} vendidos
                </span>
              </div>
            ))}
          </Card>

          <div className="mt-8">
            <p className="eyebrow mb-3">Utilização em aberto</p>
            {activePackages.length === 0 ? (
              <EmptyState compact title="Nenhum pacote em uso" description="Sem saldo em aberto no momento." />
            ) : (
              <div className="space-y-2.5">
                {activePackages.map((item) => (
                  <Card key={item.id} className="flex flex-wrap items-center gap-4 p-4">
                    <Avatar name={item.customer.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/clientes/${item.customer.id}`}
                        className="text-[14px] font-medium underline-offset-4 hover:underline"
                      >
                        {item.customer.name}
                      </Link>
                      <p className="mt-0.5 text-[12px] text-muted">{item.package.name}</p>
                    </div>
                    <div className="w-40 shrink-0">
                      <div className="flex justify-between text-[11.5px] text-muted">
                        <span>
                          {item.usedSessions}/{item.totalSessions}
                        </span>
                        <span>
                          até{' '}
                          {item.expiresAt.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-primary-soft">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${percent(item.usedSessions, item.totalSessions)}%` }}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
