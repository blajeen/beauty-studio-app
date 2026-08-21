import type { Metadata } from 'next';
import Link from 'next/link';
import { Heart, MessageCircle } from 'lucide-react';
import { requireStaff } from '@/lib/auth/guards';
import { getBrand } from '@/lib/brand/server';
import { getInactiveCustomers } from '@/lib/data/dashboard';
import { db } from '@/lib/db';
import { firstName, formatPhone, pluralize, whatsappLink } from '@/lib/utils';
import { Avatar, Badge, Card } from '@/components/ui/primitives';
import { EmptyState, Notice } from '@/components/ui/states';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Retenção' };
export const dynamic = 'force-dynamic';

const RANGES = [
  { id: '30', label: 'Mais de 30 dias' },
  { id: '45', label: 'Mais de 45 dias' },
  { id: '60', label: 'Mais de 60 dias' },
  { id: '90', label: 'Mais de 90 dias' },
];

export default async function RetentionPage({
  searchParams,
}: {
  searchParams: Promise<{ dias?: string }>;
}) {
  await requireStaff();
  const params = await searchParams;
  const minDays = Number.parseInt(params.dias ?? '45', 10) || 45;

  const [brand, inactive, waitlist] = await Promise.all([
    getBrand(),
    getInactiveCustomers(minDays, 60),
    db.waitlistEntry.findMany({
      where: { status: 'WAITING' },
      orderBy: { createdAt: 'asc' },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        service: { select: { name: true } },
        professional: { select: { displayName: true } },
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6">
        <p className="eyebrow">Relacionamento</p>
        <h1 className="mt-3 font-display text-[2.4rem] leading-none">Retenção</h1>
        <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted">
          Clientes que passaram do intervalo de retorno e não têm nada marcado. A mensagem já vai
          pronta com o nome e o último serviço — é só revisar antes de enviar.
        </p>
      </header>

      <nav className="flex flex-wrap gap-2" aria-label="Período de inatividade">
        {RANGES.map((range) => (
          <Link
            key={range.id}
            href={`/admin/retencao?dias=${range.id}`}
            className={cn(
              'rounded-full border px-4 py-2 text-[12.5px] transition-colors',
              String(minDays) === range.id
                ? 'border-ink bg-primary text-primary-contrast'
                : 'border-line text-muted hover:border-ink/35 hover:text-ink',
            )}
          >
            {range.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6 space-y-2.5">
        {inactive.length === 0 ? (
          <EmptyState
            icon={<Heart size={20} />}
            title="Ninguém para reativar"
            description={`Nenhuma cliente está há mais de ${minDays} dias sem voltar. Continue assim.`}
          />
        ) : (
          <>
            <Notice tone="neutral">
              {pluralize(inactive.length, 'cliente', 'clientes')} sem retorno há mais de {minDays}{' '}
              dias.
            </Notice>
            {inactive.map((customer) => (
              <Card key={customer.id} className="flex flex-wrap items-center gap-4 p-4">
                <Avatar name={customer.name} size="md" />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/clientes/${customer.id}`}
                    className="text-[14.5px] font-medium underline-offset-4 hover:underline"
                  >
                    {customer.name}
                  </Link>
                  <p className="mt-0.5 truncate text-[12.5px] text-muted">
                    {customer.lastService ?? 'Último atendimento'}
                    {customer.professional ? ` com ${customer.professional.displayName}` : ''} ·{' '}
                    {formatPhone(customer.phone)}
                  </p>
                </div>

                <Badge tone={customer.daysAway > 90 ? 'danger' : 'warning'}>
                  {customer.daysAway} dias
                </Badge>

                <a
                  href={whatsappLink(
                    customer.phone,
                    `Olá, ${firstName(customer.name)}! Aqui é do ${brand.name}. Faz ${customer.daysAway} dias desde o seu último ${(customer.lastService ?? 'atendimento').toLowerCase()} e separei um horário para você. Quer que eu reserve?`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-line px-3.5 text-[12.5px] transition-colors hover:bg-primary-soft"
                >
                  <MessageCircle size={14} />
                  Falar com a cliente
                </a>
              </Card>
            ))}
          </>
        )}
      </div>

      {brand.features.waitlist ? (
        <section className="mt-12">
          <h2 className="font-display text-2xl">Lista de espera</h2>
          <p className="mt-1.5 text-[13.5px] text-muted">
            Quem não encontrou horário e pediu para ser avisada.
          </p>
          <div className="mt-5 space-y-2.5">
            {waitlist.length === 0 ? (
              <EmptyState compact title="Lista vazia" description="Ninguém aguardando vaga." />
            ) : (
              waitlist.map((entry) => (
                <Card key={entry.id} className="flex flex-wrap items-center gap-4 p-4">
                  <Avatar name={entry.customer.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium">{entry.customer.name}</p>
                    <p className="mt-0.5 truncate text-[12.5px] text-muted">
                      {entry.service?.name ?? 'Qualquer serviço'}
                      {entry.professional ? ` · ${entry.professional.displayName}` : ''}
                      {entry.preferredPeriod
                        ? ` · prefere ${entry.preferredPeriod === 'MORNING' ? 'manhã' : entry.preferredPeriod === 'AFTERNOON' ? 'tarde' : 'noite'}`
                        : ''}
                    </p>
                  </div>
                  <span className="text-[12px] text-muted">
                    desde {entry.createdAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                  <a
                    href={whatsappLink(
                      entry.customer.phone,
                      `Olá, ${firstName(entry.customer.name)}! Abriu um horário para ${(entry.service?.name ?? 'o seu atendimento').toLowerCase()}. Posso reservar para você?`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-line px-3.5 text-[12.5px] transition-colors hover:bg-primary-soft"
                  >
                    <MessageCircle size={14} />
                    Avisar
                  </a>
                </Card>
              ))
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
