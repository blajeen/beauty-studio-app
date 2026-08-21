import type { Metadata } from 'next';
import Link from 'next/link';
import { requireStaff } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { getAgendaItems, getBlocksInRange, getOccupancy } from '@/lib/data/agenda';
import {
  addDays,
  eachDay,
  formatDuration,
  formatTime,
  parseDateKey,
  startOfWeekMonday,
  toDateKey,
} from '@/lib/datetime';
import { cn, formatCurrency, pluralize } from '@/lib/utils';
import { APPOINTMENT_STATUSES, APPOINTMENT_STATUS_LABEL } from '@/lib/constants';
import { Badge, Card } from '@/components/ui/primitives';
import { AgendaTimeline } from '@/components/agenda-timeline';
import { AgendaDateNav } from '@/components/agenda-date-nav';
import { AgendaFilters } from './agenda-filters';

export const metadata: Metadata = { title: 'Agenda' };
export const dynamic = 'force-dynamic';

export default async function AdminAgendaPage({
  searchParams,
}: {
  searchParams: Promise<{
    data?: string;
    vista?: string;
    unidade?: string;
    profissional?: string;
    categoria?: string;
    status?: string;
  }>;
}) {
  await requireStaff();
  const params = await searchParams;

  const view = ['semana', 'lista'].includes(params.vista ?? '') ? params.vista! : 'dia';
  const dateKey = params.data ?? toDateKey(new Date());
  const date = parseDateKey(dateKey);

  const from = view === 'dia' ? date : startOfWeekMonday(date);
  const to = view === 'dia' ? date : addDays(from, view === 'lista' ? 29 : 6);

  const filters = {
    branchId: params.unidade || null,
    professionalId: params.profissional || null,
    categoryId: params.categoria || null,
    status: params.status || null,
  };

  const [items, blocks, occupancy, branches, professionals, categories] = await Promise.all([
    getAgendaItems(from, to, filters),
    getBlocksInRange(from, to, filters.professionalId),
    getOccupancy(date, filters.branchId),
    db.branch.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' }, select: { id: true, name: true } }),
    db.professional.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, displayName: true },
    }),
    db.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true },
    }),
  ]);

  const active = items.filter((item) => item.appointment.status !== 'CANCELLED');
  const revenue = active.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Agenda</p>
          <h1 className="mt-3 font-display text-[2.4rem] leading-none">
            {view === 'dia'
              ? date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
              : `${from.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – ${to.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`}
          </h1>
          <p className="mt-2 text-[13.5px] text-muted">
            {pluralize(active.length, 'atendimento', 'atendimentos')} · {formatCurrency(revenue)}
            {view === 'dia' ? ` · ${occupancy.rate}% de ocupação` : ''}
          </p>
        </div>
      </header>

      <div className="space-y-4">
        <AgendaDateNav
          dateKey={dateKey}
          view={view}
          views={[
            { id: 'dia', label: 'Dia' },
            { id: 'semana', label: 'Semana' },
            { id: 'lista', label: 'Lista' },
          ]}
        />
        <AgendaFilters
          branches={branches}
          professionals={professionals}
          categories={categories}
          statuses={APPOINTMENT_STATUSES.map((status) => ({
            id: status,
            label: APPOINTMENT_STATUS_LABEL[status],
          }))}
          current={{
            unidade: params.unidade ?? '',
            profissional: params.profissional ?? '',
            categoria: params.categoria ?? '',
            status: params.status ?? '',
          }}
        />
      </div>

      {blocks.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {blocks.map((block) => (
            <Badge key={block.id} tone="outline">
              {block.professional?.displayName ?? 'Unidade'} ·{' '}
              {block.startAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}{' '}
              {formatTime(block.startAt)}–{formatTime(block.endAt)}
              {block.reason ? ` · ${block.reason}` : ''}
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="mt-8">
        {view === 'dia' ? (
          <AgendaTimeline items={items} basePath="/admin/atendimento" showProfessional showBranch />
        ) : (
          <div className="space-y-8">
            {eachDay(from, view === 'lista' ? 30 : 7).map((day) => {
              const dayItems = items.filter((item) => toDateKey(item.startAt) === toDateKey(day));
              if (view === 'lista' && dayItems.length === 0) return null;
              const dayActive = dayItems.filter(
                (item) => item.appointment.status !== 'CANCELLED',
              );
              return (
                <section key={day.toISOString()}>
                  <h2 className="mb-3 flex items-baseline gap-3">
                    <span className="font-display text-xl">
                      {day.toLocaleDateString('pt-BR', { weekday: 'long' })}
                    </span>
                    <span className="text-[12.5px] text-muted">
                      {day.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ·{' '}
                      {pluralize(dayActive.length, 'atendimento', 'atendimentos')} ·{' '}
                      {formatDuration(dayActive.reduce((sum, item) => sum + item.duration, 0))}
                    </span>
                  </h2>
                  <AgendaTimeline
                    items={dayItems}
                    basePath="/admin/atendimento"
                    showProfessional
                    showBranch
                    emptyLabel="Dia livre."
                  />
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
