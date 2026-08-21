import type { Metadata } from 'next';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { requireProfessional } from '@/lib/auth/guards';
import { getProfessionalClients } from '@/lib/data/agenda';
import { formatDayDistance } from '@/lib/datetime';
import { parseList, pluralize } from '@/lib/utils';
import { Avatar, Badge, Card } from '@/components/ui/primitives';
import { EmptyState } from '@/components/ui/states';

export const metadata: Metadata = { title: 'Minhas clientes' };
export const dynamic = 'force-dynamic';

export default async function ProClientsPage() {
  const user = await requireProfessional();
  const clients = await getProfessionalClients(user.professionalId);

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8">
        <p className="eyebrow">Relacionamento</p>
        <h1 className="mt-3 font-display text-[2.4rem] leading-none">Minhas clientes</h1>
        <p className="mt-2 text-[13.5px] text-muted">
          {pluralize(clients.length, 'cliente atendida', 'clientes atendidas')} por você. Você vê
          apenas quem passou pelas suas mãos.
        </p>
      </header>

      {clients.length === 0 ? (
        <EmptyState
          icon={<Users size={20} />}
          title="Nenhuma cliente ainda"
          description="Assim que você concluir o primeiro atendimento, a ficha dela aparece aqui."
        />
      ) : (
        <div className="space-y-2.5">
          {clients.map((entry) => (
            <Link key={entry.customer.id} href={`/pro/clientes/${entry.customer.id}`}>
              <Card className="flex items-center gap-4 p-4 transition-colors hover:border-ink/25">
                <Avatar name={entry.customer.name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-baseline gap-x-2 text-[14.5px] font-medium">
                    {entry.customer.name}
                    {parseList(entry.customer.tags).map((tag) => (
                      <Badge key={tag} tone="neutral">
                        {tag}
                      </Badge>
                    ))}
                  </p>
                  <p className="mt-0.5 truncate text-[12.5px] text-muted">
                    {entry.lastService} · {formatDayDistance(entry.lastAt)}
                  </p>
                </div>
                <span className="shrink-0 text-right">
                  <span className="block font-display text-xl leading-none">{entry.visits}</span>
                  <span className="block text-[11px] text-muted">com você</span>
                </span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
