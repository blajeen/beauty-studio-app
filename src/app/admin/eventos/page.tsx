import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PartyPopper } from 'lucide-react';
import { requireStaff } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { getBrand } from '@/lib/brand/server';
import { pluralize } from '@/lib/utils';
import { Container } from '@/components/ui/primitives';
import { EmptyState } from '@/components/ui/states';
import { EventCard } from '@/components/cards';

export const metadata: Metadata = { title: 'Eventos e noivas' };
export const dynamic = 'force-dynamic';

export default async function AdminEventsPage() {
  await requireStaff();
  const brand = await getBrand();
  if (!brand.features.events) notFound();

  const now = new Date();

  const [upcoming, past] = await Promise.all([
    db.event.findMany({
      where: { eventDate: { gte: now }, status: { not: 'CANCELLED' } },
      orderBy: { eventDate: 'asc' },
      include: { _count: { select: { appointments: true, participants: true } } },
    }),
    db.event.findMany({
      where: { eventDate: { lt: now } },
      orderBy: { eventDate: 'desc' },
      take: 10,
      include: { _count: { select: { appointments: true, participants: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <p className="eyebrow">Produções</p>
        <h1 className="mt-3 font-display text-[2.4rem] leading-none">Eventos e noivas</h1>
        <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted">
          Cada evento reúne a noiva, as convidadas e todos os atendimentos relacionados — com o
          horário em que cada uma precisa estar pronta.
        </p>
      </header>

      <section>
        <h2 className="font-display text-2xl">Próximos</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {upcoming.length === 0 ? (
            <div className="sm:col-span-2">
              <EmptyState
                icon={<PartyPopper size={20} />}
                title="Nenhum evento marcado"
                description="Quando uma cliente iniciar um fluxo de noiva ou evento, ele aparece aqui."
              />
            </div>
          ) : (
            upcoming.map((event) => (
              <EventCard key={event.id} event={event} href={`/admin/eventos/${event.id}`} />
            ))
          )}
        </div>
      </section>

      {past.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-display text-2xl">Realizados</h2>
          <p className="mt-1.5 text-[13px] text-muted">
            {pluralize(past.length, 'evento', 'eventos')} nas últimas semanas.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {past.map((event) => (
              <EventCard key={event.id} event={event} href={`/admin/eventos/${event.id}`} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
