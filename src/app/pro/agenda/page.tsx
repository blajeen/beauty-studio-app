import type { Metadata } from 'next';
import { requireProfessional } from '@/lib/auth/guards';
import { getAgendaItems, getBlocksInRange } from '@/lib/data/agenda';
import {
  addDays,
  eachDay,
  formatDuration,
  formatTime,
  parseDateKey,
  startOfWeekMonday,
  toDateKey,
} from '@/lib/datetime';
import { formatCurrency, pluralize } from '@/lib/utils';
import { Badge, Card } from '@/components/ui/primitives';
import { AgendaTimeline } from '@/components/agenda-timeline';
import { AgendaDateNav } from '@/components/agenda-date-nav';

export const metadata: Metadata = { title: 'Minha agenda' };
export const dynamic = 'force-dynamic';

export default async function ProAgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string; vista?: string }>;
}) {
  const user = await requireProfessional();
  const params = await searchParams;

  const view = params.vista === 'semana' ? 'semana' : 'dia';
  const dateKey = params.data ?? toDateKey(new Date());
  const date = parseDateKey(dateKey);

  const from = view === 'semana' ? startOfWeekMonday(date) : date;
  const to = view === 'semana' ? addDays(from, 6) : date;

  const [items, blocks] = await Promise.all([
    getAgendaItems(from, to, { professionalId: user.professionalId }),
    getBlocksInRange(from, to, user.professionalId),
  ]);

  const active = items.filter((item) => item.appointment.status !== 'CANCELLED');
  const minutes = active.reduce((sum, item) => sum + item.duration, 0);
  const revenue = active.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6">
        <p className="eyebrow">Minha agenda</p>
        <h1 className="mt-3 font-display text-[2.4rem] leading-none">
          {view === 'semana'
            ? `${from.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – ${to.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
            : date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h1>
        <p className="mt-2 text-[13.5px] text-muted">
          {pluralize(active.length, 'atendimento', 'atendimentos')} · {formatDuration(minutes)} ·{' '}
          {formatCurrency(revenue)}
        </p>
      </header>

      <AgendaDateNav
        dateKey={dateKey}
        view={view}
        views={[
          { id: 'dia', label: 'Dia' },
          { id: 'semana', label: 'Semana' },
        ]}
      />

      {blocks.length > 0 ? (
        <div className="mt-6 space-y-2">
          {blocks.map((block) => (
            <Card key={block.id} className="flex items-center gap-3 border-dashed p-3.5">
              <Badge tone="outline">
                {block.type === 'VACATION' ? 'Férias' : block.type === 'BREAK' ? 'Pausa' : 'Bloqueio'}
              </Badge>
              <span className="text-[13px] text-muted">
                {block.startAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}{' '}
                {formatTime(block.startAt)} – {formatTime(block.endAt)}
                {block.reason ? ` · ${block.reason}` : ''}
              </span>
            </Card>
          ))}
        </div>
      ) : null}

      <div className="mt-8">
        {view === 'semana' ? (
          <div className="space-y-8">
            {eachDay(from, 7).map((day) => {
              const dayItems = items.filter(
                (item) => toDateKey(item.startAt) === toDateKey(day),
              );
              return (
                <section key={day.toISOString()}>
                  <h2 className="mb-3 flex items-baseline gap-3">
                    <span className="font-display text-xl">
                      {day.toLocaleDateString('pt-BR', { weekday: 'long' })}
                    </span>
                    <span className="text-[12.5px] text-muted">
                      {day.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ·{' '}
                      {pluralize(
                        dayItems.filter((item) => item.appointment.status !== 'CANCELLED').length,
                        'atendimento',
                        'atendimentos',
                      )}
                    </span>
                  </h2>
                  <AgendaTimeline
                    items={dayItems}
                    basePath="/pro/atendimento"
                    emptyLabel="Dia livre."
                  />
                </section>
              );
            })}
          </div>
        ) : (
          <AgendaTimeline items={items} basePath="/pro/atendimento" />
        )}
      </div>
    </div>
  );
}
