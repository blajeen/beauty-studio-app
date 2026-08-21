import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { getBrand } from '@/lib/brand/server';
import { formatDayDistance, formatDuration, formatTime } from '@/lib/datetime';
import { firstName, formatCurrency, parseList, whatsappLink } from '@/lib/utils';
import { RECORD_SCHEMAS, type RecordSchemaKey } from '@/lib/constants';
import { Avatar, Badge, Card } from '@/components/ui/primitives';
import { Notice } from '@/components/ui/states';
import { SmartImage } from '@/components/ui/media';
import { ProcedureDetails } from '@/components/procedure-record';
import { ProcedureForm } from './procedure-form';

export const metadata: Metadata = { title: 'Atendimento' };
export const dynamic = 'force-dynamic';

export default async function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/entrar');

  const isStaff = user.role === 'OWNER' || user.role === 'MANAGER';

  const item = await db.appointmentItem.findUnique({
    where: { id },
    include: {
      service: true,
      professional: { select: { id: true, displayName: true, avatarUrl: true } },
      procedure: { include: { photos: true } },
      appointment: {
        include: {
          branch: { select: { name: true } },
          event: { select: { name: true, readyByTime: true, eventDate: true } },
          customer: {
            include: {
              preferences: true,
              inspirations: { orderBy: { createdAt: 'desc' }, take: 4 },
            },
          },
        },
      },
    },
  });

  if (!item) notFound();
  if (!isStaff && item.professionalId !== user.professionalId) redirect('/sem-acesso');

  const brand = await getBrand();
  const customer = item.appointment.customer;

  const previous = await db.procedureRecord.findFirst({
    where: {
      customerId: customer.id,
      serviceId: item.serviceId,
      appointmentItemId: { not: item.id },
    },
    orderBy: { performedAt: 'desc' },
    include: { professional: { select: { displayName: true } } },
  });

  const schemaKey = (item.service.recordSchema ?? 'nail') as RecordSchemaKey;
  const schema = RECORD_SCHEMAS[schemaKey] ?? RECORD_SCHEMAS.nail;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/pro"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} />
        Voltar
      </Link>

      <header className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">
            {item.startAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} ·{' '}
            {formatTime(item.startAt)} – {formatTime(item.endAt)}
          </p>
          <h1 className="mt-3 font-display text-[2.4rem] leading-none">{customer.name}</h1>
          <p className="mt-2 text-[14px] text-muted">
            {item.service.name} · {formatDuration(item.duration)} ·{' '}
            {formatCurrency(item.price)} · {item.appointment.branch.name}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={customer.totalVisits <= 1 ? 'accent' : 'outline'}>
            {customer.totalVisits <= 1 ? 'Primeira vez' : `${customer.totalVisits} atendimentos`}
          </Badge>
          {parseList(customer.tags).map((tag) => (
            <Badge key={tag} tone="neutral">
              {tag}
            </Badge>
          ))}
        </div>
      </header>

      {item.appointment.readyByAt || item.appointment.event ? (
        <Notice tone="accent" className="mt-6" title="Horário de entrega">
          {item.appointment.event ? `${item.appointment.event.name} — ` : ''}a cliente precisa estar
          pronta às{' '}
          {item.appointment.readyByAt
            ? formatTime(item.appointment.readyByAt)
            : item.appointment.event?.readyByTime}
          .
        </Notice>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {item.appointment.notes ? (
          <Card className="p-5">
            <p className="eyebrow mb-2">Recado da cliente</p>
            <p className="text-[13.5px] leading-relaxed text-ink/85">{item.appointment.notes}</p>
          </Card>
        ) : null}

        {customer.preferences.length > 0 || customer.notes ? (
          <Card className="p-5">
            <p className="eyebrow mb-3">Preferências e alertas</p>
            {customer.notes ? (
              <p className="mb-3 text-[13.5px] leading-relaxed text-ink/85">{customer.notes}</p>
            ) : null}
            <dl className="space-y-1.5">
              {customer.preferences.map((preference) => (
                <div key={preference.id} className="flex justify-between gap-4 text-[13px]">
                  <dt className="text-muted">{preference.key}</dt>
                  <dd className="text-right font-medium">{preference.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        ) : null}
      </div>

      {previous ? (
        <Card className="mt-4 p-5">
          <p className="eyebrow mb-3">
            Atendimento anterior · {item.service.name} ·{' '}
            {formatDayDistance(previous.performedAt)} · {previous.professional.displayName}
          </p>
          <ProcedureDetails record={previous} />
        </Card>
      ) : null}

      {customer.inspirations.length > 0 ? (
        <Card className="mt-4 p-5">
          <p className="eyebrow mb-3">Referências da cliente</p>
          <div className="grid grid-cols-4 gap-2">
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
          {customer.inspirations[0]?.note ? (
            <p className="mt-2.5 text-[12.5px] text-muted">
              “{customer.inspirations[0].note}”
            </p>
          ) : null}
        </Card>
      ) : null}

      <div className="mt-8">
        <ProcedureForm
          itemId={item.id}
          appointmentId={item.appointmentId}
          serviceName={item.service.name}
          schemaLabel={schema.label}
          fields={[...schema.fields]}
          defaultInterval={item.service.returnIntervalDays ?? 0}
          allowsPhotos={item.service.allowsPhotos}
          consentPhotos={customer.consentPhotos}
          status={item.appointment.status}
          record={
            item.procedure
              ? {
                  technique: item.procedure.technique ?? '',
                  shape: item.procedure.shape ?? '',
                  lengthSpec: item.procedure.lengthSpec ?? '',
                  color: item.procedure.color ?? '',
                  style: item.procedure.style ?? '',
                  decoration: item.procedure.decoration ?? '',
                  curvature: item.procedure.curvature ?? '',
                  effect: item.procedure.effect ?? '',
                  volume: item.procedure.volume ?? '',
                  product: item.procedure.product ?? '',
                  materials: item.procedure.materials ?? '',
                  observations: item.procedure.observations ?? '',
                }
              : null
          }
          previous={
            previous
              ? {
                  technique: previous.technique ?? '',
                  shape: previous.shape ?? '',
                  lengthSpec: previous.lengthSpec ?? '',
                  color: previous.color ?? '',
                  style: previous.style ?? '',
                  decoration: previous.decoration ?? '',
                  curvature: previous.curvature ?? '',
                  effect: previous.effect ?? '',
                  volume: previous.volume ?? '',
                  product: previous.product ?? '',
                  materials: previous.materials ?? '',
                  observations: previous.observations ?? '',
                }
              : null
          }
          photos={item.procedure?.photos.map((photo) => ({
            id: photo.id,
            imageUrl: photo.imageUrl,
            caption: photo.caption,
            visibility: photo.visibility,
          })) ?? []}
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-6">
        <Link
          href={`/pro/clientes/${customer.id}`}
          className="text-[13px] underline underline-offset-4"
        >
          Ficha completa de {firstName(customer.name)}
        </Link>
        {customer.phone ? (
          <a
            href={whatsappLink(
              customer.phone,
              `Olá, ${firstName(customer.name)}! Aqui é do ${brand.name}.`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[13px] text-muted underline underline-offset-4 hover:text-ink"
          >
            <MessageCircle size={14} />
            WhatsApp
          </a>
        ) : null}
      </div>
    </div>
  );
}
