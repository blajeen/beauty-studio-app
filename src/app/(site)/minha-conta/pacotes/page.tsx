import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Gift } from 'lucide-react';
import { db } from '@/lib/db';
import { requireCustomer } from '@/lib/auth/guards';
import { getBrand } from '@/lib/brand/server';
import { getCustomerBenefits } from '@/lib/data/customer';
import { formatCurrency, percent } from '@/lib/utils';
import { Badge, Button, Card } from '@/components/ui/primitives';
import { EmptyState, Notice } from '@/components/ui/states';
import { BenefitActions } from './benefit-actions';

export const metadata: Metadata = { title: 'Pacotes e Beauty Club' };

export default async function BenefitsPage({
  searchParams,
}: {
  searchParams: Promise<{ plano?: string }>;
}) {
  const brand = await getBrand();
  if (!brand.features.packages && !brand.features.beautyClub) notFound();

  const user = await requireCustomer();
  const { plano } = await searchParams;

  const [benefits, plans] = await Promise.all([
    getCustomerBenefits(user.customerId),
    db.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { items: { include: { service: { select: { name: true } } } } },
    }),
  ]);

  const activeSubscription = benefits.subscriptions[0] ?? null;

  return (
    <div className="max-w-3xl space-y-12">
      {brand.features.packages ? (
        <section>
          <h2 className="font-display text-2xl">Seus pacotes</h2>
          <p className="mt-1.5 text-[13.5px] text-muted">
            O saldo é descontado automaticamente a cada atendimento.
          </p>

          <div className="mt-6 space-y-4">
            {benefits.packages.length === 0 ? (
              <EmptyState
                compact
                icon={<Gift size={20} />}
                title="Nenhum pacote ativo"
                description="Pacotes de sessões saem mais em conta do que o avulso e valem por até 120 dias."
                action={<Button href="/pacotes">Ver pacotes</Button>}
              />
            ) : (
              benefits.packages.map((item) => {
                const remaining = item.totalSessions - item.usedSessions;
                return (
                  <Card key={item.id} className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="font-display text-xl leading-tight">{item.package.name}</h3>
                        <p className="mt-1 text-[12.5px] text-muted">
                          Contratado em{' '}
                          {item.purchasedAt.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}{' '}
                          · {formatCurrency(item.pricePaid)}
                        </p>
                      </div>
                      <Badge tone={remaining > 0 ? 'success' : 'neutral'}>
                        {remaining > 0 ? `${remaining} restantes` : 'Esgotado'}
                      </Badge>
                    </div>

                    <div className="mt-5">
                      <div className="flex items-baseline justify-between text-[12.5px] text-muted">
                        <span>Utilização</span>
                        <span>
                          {item.usedSessions} de {item.totalSessions}
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-primary-soft">
                        <div
                          className="h-full rounded-full bg-accent transition-[width] duration-700"
                          style={{ width: `${percent(item.usedSessions, item.totalSessions)}%` }}
                        />
                      </div>
                      <p className="mt-2 text-[12.5px] text-muted">
                        Validade até{' '}
                        {item.expiresAt.toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                        {item.package.service ? ` · ${item.package.service.name}` : ''}
                      </p>
                    </div>

                    {remaining > 0 ? (
                      <Button
                        href={
                          item.package.service
                            ? `/agendar?servico=${item.package.service.slug}`
                            : '/agendar'
                        }
                        variant="secondary"
                        size="sm"
                        className="mt-5"
                      >
                        Usar uma sessão
                      </Button>
                    ) : null}
                  </Card>
                );
              })
            )}
          </div>
        </section>
      ) : null}

      {brand.features.beautyClub ? (
        <section>
          <h2 className="font-display text-2xl">Beauty Club</h2>
          <p className="mt-1.5 text-[13.5px] text-muted">
            Assinatura mensal com prioridade na agenda.
          </p>

          <div className="mt-6">
            {activeSubscription ? (
              <Card className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <Badge tone="success" className="mb-3">
                      Plano ativo
                    </Badge>
                    <h3 className="font-display text-2xl">{activeSubscription.plan.name}</h3>
                    <p className="mt-1 text-[13px] text-muted">
                      {formatCurrency(activeSubscription.plan.monthlyPrice)}/mês · ciclo até{' '}
                      {activeSubscription.cycleEnd.toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <dl className="mt-6 divide-y divide-line border-y border-line">
                  {activeSubscription.plan.items.map((item) => {
                    const used = activeSubscription.usages.filter(
                      (usage) => usage.serviceId === item.serviceId,
                    ).length;
                    const remaining = Math.max(item.quantityPerCycle - used, 0);
                    return (
                      <div key={item.id} className="flex items-center justify-between gap-4 py-3">
                        <dt className="text-[14px]">{item.service.name}</dt>
                        <dd className="flex items-center gap-3">
                          <span className="text-[12.5px] text-muted">
                            {used}/{item.quantityPerCycle} usados
                          </span>
                          <Badge tone={remaining > 0 ? 'accent' : 'outline'}>
                            {remaining > 0 ? `${remaining} disponível` : 'usado no ciclo'}
                          </Badge>
                        </dd>
                      </div>
                    );
                  })}
                </dl>

                <BenefitActions subscriptionId={activeSubscription.id} />
              </Card>
            ) : (
              <div className="space-y-4">
                <Notice tone="neutral">
                  Você ainda não tem um plano. Escolha abaixo — a cobrança é acertada no estúdio, sem
                  cartão cadastrado no app.
                </Notice>
                <div className="grid gap-4 sm:grid-cols-3">
                  {plans.map((plan) => (
                    <Card
                      key={plan.id}
                      className={`flex flex-col p-5 ${plan.slug === plano ? 'ring-1 ring-accent/50' : ''}`}
                    >
                      <h3 className="font-display text-xl">{plan.name}</h3>
                      <p className="mt-1 text-[12.5px] text-muted">{plan.tagline}</p>
                      <p className="mt-4 font-display text-3xl">
                        {formatCurrency(plan.monthlyPrice)}
                      </p>
                      <ul className="mt-4 flex-1 space-y-1.5 border-t border-line pt-4 text-[13px] text-ink/80">
                        {plan.items.map((item) => (
                          <li key={item.id} className="flex justify-between gap-3">
                            <span>{item.service.name}</span>
                            <span className="text-muted">{item.quantityPerCycle}×</span>
                          </li>
                        ))}
                      </ul>
                      <BenefitActions planSlug={plan.slug} className="mt-5" />
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
