import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { getBrand } from '@/lib/brand/server';
import { formatDayDistance, formatDuration, formatTime } from '@/lib/datetime';
import { firstName, parseList, whatsappLink } from '@/lib/utils';
import { Avatar, Badge, Button, Card } from '@/components/ui/primitives';
import { EmptyState } from '@/components/ui/states';
import { SmartImage } from '@/components/ui/media';
import { ProcedureDetails } from '@/components/procedure-record';
import { CustomerNoteEditor } from './note-editor';

export const metadata: Metadata = { title: 'Ficha da cliente' };
export const dynamic = 'force-dynamic';

export default async function ProCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/entrar');

  const isStaff = user.role === 'OWNER' || user.role === 'MANAGER';
  const professionalId = user.professionalId;
  if (!professionalId && !isStaff) redirect('/sem-acesso');

  // A profissional só abre a ficha de quem ela já atendeu (seção 38).
  if (!isStaff) {
    const attended = await db.appointmentItem.findFirst({
      where: { professionalId: professionalId!, appointment: { customerId: id } },
      select: { id: true },
    });
    if (!attended) redirect('/sem-acesso');
  }

  const [customer, brand] = await Promise.all([
    db.customer.findUnique({
      where: { id },
      include: {
        preferences: true,
        preferredProfessional: { select: { displayName: true } },
        inspirations: {
          where: isStaff ? {} : { OR: [{ sharedWithId: professionalId }, { sharedWithId: null }] },
          orderBy: { createdAt: 'desc' },
          take: 6,
        },
        procedures: {
          where: isStaff ? {} : { professionalId: professionalId! },
          orderBy: { performedAt: 'desc' },
          take: 12,
          include: {
            service: { select: { name: true } },
            professional: { select: { displayName: true, avatarUrl: true } },
            photos: true,
          },
        },
        appointments: {
          where: { startAt: { gte: new Date() }, status: { in: ['PENDING', 'CONFIRMED'] } },
          orderBy: { startAt: 'asc' },
          take: 4,
          include: {
            items: {
              include: {
                service: { select: { name: true } },
                professional: { select: { displayName: true } },
              },
            },
          },
        },
      },
    }),
    getBrand(),
  ]);

  if (!customer) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/pro/clientes"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} />
        Minhas clientes
      </Link>

      <header className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={customer.name} size="xl" />
          <div>
            <h1 className="font-display text-[2.2rem] leading-none">{customer.name}</h1>
            <p className="mt-2 text-[13px] text-muted">
              {customer.totalVisits} atendimentos
              {customer.lastVisitAt ? ` · último ${formatDayDistance(customer.lastVisitAt)}` : ''}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {parseList(customer.tags).map((tag) => (
                <Badge key={tag} tone="neutral">
                  {tag}
                </Badge>
              ))}
              {customer.consentPhotos ? (
                <Badge tone="success">Autoriza fotos</Badge>
              ) : (
                <Badge tone="outline">Sem autorização de fotos</Badge>
              )}
            </div>
          </div>
        </div>
        {customer.phone ? (
          <a
            href={whatsappLink(
              customer.phone,
              `Olá, ${firstName(customer.name)}! Aqui é do ${brand.name}.`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-md border border-line px-4 text-[13.5px] transition-colors hover:bg-primary-soft"
          >
            <MessageCircle size={15} />
            WhatsApp
          </a>
        ) : null}
      </header>

      {customer.appointments.length > 0 ? (
        <Card className="mt-8 p-5">
          <p className="eyebrow mb-3">Próximos horários</p>
          <ul className="space-y-2.5">
            {customer.appointments.map((appointment) => (
              <li key={appointment.id} className="flex items-center gap-4 text-[13.5px]">
                <span className="w-28 shrink-0 text-muted">
                  {appointment.startAt.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                  })}{' '}
                  {formatTime(appointment.startAt)}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {appointment.items.map((item) => item.service.name).join(' + ')}
                </span>
                <span className="shrink-0 text-[12.5px] text-muted">
                  {appointment.items[0]?.professional.displayName}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {customer.preferences.length > 0 ? (
        <Card className="mt-4 p-5">
          <p className="eyebrow mb-3">Preferências</p>
          <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {customer.preferences.map((preference) => (
              <div key={preference.id} className="flex justify-between gap-4 text-[13px]">
                <dt className="text-muted">{preference.key}</dt>
                <dd className="text-right font-medium">{preference.value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      ) : null}

      <div className="mt-4">
        <CustomerNoteEditor customerId={customer.id} notes={customer.notes ?? ''} />
      </div>

      {customer.inspirations.length > 0 ? (
        <Card className="mt-4 p-5">
          <p className="eyebrow mb-3">Referências enviadas</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {customer.inspirations.map((inspiration) => (
              <SmartImage
                key={inspiration.id}
                src={inspiration.imageUrl}
                alt={inspiration.note ?? 'Inspiração'}
                seed="Inspiração"
                ratio="square"
                className="rounded-md"
              />
            ))}
          </div>
        </Card>
      ) : null}

      <section className="mt-10">
        <h2 className="font-display text-2xl">Histórico técnico</h2>
        <p className="mt-1.5 text-[13px] text-muted">
          {isStaff
            ? 'Todos os atendimentos registrados desta cliente.'
            : 'Os atendimentos que você realizou com esta cliente.'}
        </p>

        <div className="mt-5 space-y-3">
          {customer.procedures.length === 0 ? (
            <EmptyState compact title="Sem fichas registradas" description="Registre ao final do próximo atendimento." />
          ) : (
            customer.procedures.map((procedure) => (
              <Card key={procedure.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[14.5px] font-medium">{procedure.service.name}</p>
                    <p className="mt-0.5 text-[12.5px] text-muted">
                      {procedure.performedAt.toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}{' '}
                      · {formatDayDistance(procedure.performedAt)}
                    </p>
                  </div>
                  <span className="flex items-center gap-2 text-[12.5px] text-muted">
                    <Avatar
                      name={procedure.professional.displayName}
                      src={procedure.professional.avatarUrl}
                      size="xs"
                    />
                    {procedure.professional.displayName}
                  </span>
                </div>

                <ProcedureDetails record={procedure} className="mt-4" />

                {procedure.photos.length ? (
                  <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {procedure.photos.map((photo) => (
                      <SmartImage
                        key={photo.id}
                        src={photo.imageUrl}
                        alt={photo.caption ?? procedure.service.name}
                        seed={procedure.service.name}
                        ratio="square"
                        className="rounded-md"
                      />
                    ))}
                  </div>
                ) : null}
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
