import Link from 'next/link';
import { Check, Clock, MapPin } from 'lucide-react';
import type { AgendaItem } from '@/lib/data/agenda';
import { formatDuration, formatTime } from '@/lib/datetime';
import { cn, formatCurrency, parseList } from '@/lib/utils';
import { Avatar, Badge } from '@/components/ui/primitives';
import { EmptyState } from '@/components/ui/states';

const STATUS_TONE: Record<string, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  IN_PROGRESS: 'info',
  COMPLETED: 'neutral',
  CANCELLED: 'danger',
  NO_SHOW: 'danger',
};

/**
 * Linha do tempo da agenda. Mesma peça para a profissional (sua própria agenda)
 * e para a gestão (todas as profissionais) — muda apenas o que é exibido.
 */
export function AgendaTimeline({
  items,
  basePath,
  showProfessional,
  showBranch,
  emptyLabel = 'Nenhum atendimento neste período.',
}: {
  items: AgendaItem[];
  basePath: string;
  showProfessional?: boolean;
  showBranch?: boolean;
  emptyLabel?: string;
}) {
  if (items.length === 0) {
    return <EmptyState compact title="Agenda livre" description={emptyLabel} />;
  }

  return (
    <ol className="relative space-y-2 border-l border-line pl-5 sm:pl-6">
      {items.map((item) => {
        const isDone = item.appointment.status === 'COMPLETED';
        const isCancelled = item.appointment.status === 'CANCELLED';

        return (
          <li key={item.id} className="relative">
            <span
              className={cn(
                'absolute -left-[26px] top-5 h-2 w-2 rounded-full ring-4 ring-canvas sm:-left-[30px]',
                isDone ? 'bg-muted' : isCancelled ? 'bg-red-300' : 'bg-accent',
              )}
              aria-hidden="true"
            />
            <Link
              href={`${basePath}/${item.id}`}
              className={cn(
                'flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-line bg-surface p-4 transition-colors hover:border-ink/25',
                isCancelled && 'opacity-55',
              )}
            >
              <span className="w-12 shrink-0 font-display text-lg tabular-nums text-ink/85">
                {formatTime(item.startAt)}
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-[14.5px] font-medium">
                    {item.appointment.customer.name}
                  </span>
                  {item.appointment.customer.totalVisits <= 1 ? (
                    <Badge tone="accent">1ª vez</Badge>
                  ) : null}
                  {item.appointment.event ? <Badge tone="info">Evento</Badge> : null}
                  {item.procedure ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                      <Check size={11} />
                      ficha registrada
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12.5px] text-muted">
                  <span>{item.service.name}</span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {formatDuration(item.duration)}
                  </span>
                  {showBranch ? (
                    <span className="flex items-center gap-1">
                      <MapPin size={11} />
                      {item.appointment.branch.name}
                    </span>
                  ) : null}
                  {item.appointment.readyByAt ? (
                    <span className="text-accent">
                      pronta às {formatTime(item.appointment.readyByAt)}
                    </span>
                  ) : null}
                </span>
              </span>

              {showProfessional ? (
                <span className="flex shrink-0 items-center gap-2">
                  <Avatar
                    name={item.professional.displayName}
                    src={item.professional.avatarUrl}
                    size="xs"
                  />
                  <span className="hidden text-[12.5px] text-muted sm:inline">
                    {item.professional.displayName.split(' ')[0]}
                  </span>
                </span>
              ) : null}

              <span className="shrink-0">
                <Badge tone={STATUS_TONE[item.appointment.status] ?? 'neutral'}>
                  {labelFor(item.appointment.status)}
                </Badge>
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

function labelFor(status: string) {
  switch (status) {
    case 'PENDING':
      return 'A confirmar';
    case 'CONFIRMED':
      return 'Confirmado';
    case 'IN_PROGRESS':
      return 'Em atendimento';
    case 'COMPLETED':
      return 'Concluído';
    case 'CANCELLED':
      return 'Cancelado';
    case 'NO_SHOW':
      return 'Não veio';
    default:
      return status;
  }
}
