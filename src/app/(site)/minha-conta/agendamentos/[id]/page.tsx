import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CalendarClock, MapPin, Phone } from 'lucide-react';
import { db } from '@/lib/db';
import { requireCustomer } from '@/lib/auth/guards';
import { getBrand } from '@/lib/brand/server';
import { formatDuration, formatTime } from '@/lib/datetime';
import { formatCurrency, whatsappLink } from '@/lib/utils';
import { APPOINTMENT_STATUS_LABEL, type AppointmentStatus } from '@/lib/constants';
import { Avatar, Badge, Button, Card, DataRow } from '@/components/ui/primitives';
import { Notice } from '@/components/ui/states';
import { AppointmentActions } from './appointment-actions';

export const metadata: Metadata = { title: 'Agendamento' };

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireCustomer();
  const brand = await getBrand();

  const appointment = await db.appointment.findFirst({
    where: { id, customerId: user.customerId },
    include: {
      branch: true,
      event: { select: { id: true, name: true, eventDate: true, readyByTime: true } },
      items: {
        orderBy: { sortOrder: 'asc' },
        include: {
          service: { select: { id: true, name: true, slug: true } },
          professional: { select: { id: true, displayName: true, avatarUrl: true, title: true } },
        },
      },
    },
  });

  if (!appointment) notFound();

  const isOpen = ['PENDING', 'CONFIRMED'].includes(appointment.status);
  const hoursAhead = (appointment.startAt.getTime() - Date.now()) / 3_600_000;
  const withinPolicy = hoursAhead >= brand.policies.cancellationHours;

  const whatsappMessage = `Olá! Sobre o meu agendamento ${appointment.code} do dia ${appointment.startAt.toLocaleDateString('pt-BR')} às ${formatTime(appointment.startAt)}:`;

  return (
    <div className="max-w-3xl">
      <Link
        href="/minha-conta/agendamentos"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} />
        Meus horários
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Código {appointment.code}</p>
          <h1 className="mt-3 font-display text-[2.4rem] leading-none">
            {appointment.startAt.toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </h1>
          <p className="mt-2 text-[14px] text-muted">
            Início às {formatTime(appointment.startAt)} · {formatDuration(appointment.totalDuration)}
          </p>
        </div>
        <Badge
          tone={
            appointment.status === 'CONFIRMED'
              ? 'success'
              : appointment.status === 'CANCELLED' || appointment.status === 'NO_SHOW'
                ? 'danger'
                : 'neutral'
          }
        >
          {APPOINTMENT_STATUS_LABEL[appointment.status as AppointmentStatus]}
        </Badge>
      </div>

      {appointment.readyByAt ? (
        <Notice
          tone="accent"
          className="mt-6"
          title={`Você precisa estar pronta às ${formatTime(appointment.readyByAt)}`}
        >
          Por isso o início ficou às {formatTime(appointment.startAt)} — o tempo de cada serviço e o
          preparo já estão contados.
        </Notice>
      ) : null}

      {appointment.event ? (
        <Notice tone="neutral" className="mt-6" title={appointment.event.name}>
          Este atendimento faz parte de um evento. Pronta às {appointment.event.readyByTime} no dia{' '}
          {appointment.event.eventDate.toLocaleDateString('pt-BR')}.
        </Notice>
      ) : null}

      <Card className="mt-8 overflow-hidden">
        <div className="border-b border-line px-6 py-4">
          <p className="eyebrow">Seu roteiro</p>
        </div>
        <ul className="divide-y divide-line/70">
          {appointment.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 px-6 py-4">
              <span className="w-12 shrink-0 font-display text-lg tabular-nums text-ink/80">
                {formatTime(item.startAt)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium">{item.service.name}</span>
                <Link
                  href={`/profissionais/${item.professional.id}`}
                  className="mt-0.5 block truncate text-[12.5px] text-muted underline-offset-4 hover:underline"
                >
                  {item.professional.displayName} · {formatDuration(item.duration)}
                </Link>
              </span>
              <Avatar
                name={item.professional.displayName}
                src={item.professional.avatarUrl}
                size="sm"
              />
              <span className="w-20 shrink-0 text-right text-[13.5px] text-muted">
                {formatCurrency(item.price)}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex items-baseline justify-between border-t border-line px-6 py-4">
          <span className="text-[13.5px] text-muted">Total</span>
          <span className="font-display text-2xl">{formatCurrency(appointment.totalPrice)}</span>
        </div>
      </Card>

      <Card className="mt-5 p-6">
        <p className="eyebrow mb-4">Onde</p>
        <p className="flex items-start gap-2 text-[14px]">
          <MapPin size={15} className="mt-0.5 shrink-0 text-muted" />
          <span>
            <span className="block font-medium">{appointment.branch.name}</span>
            <span className="block text-[13px] text-muted">
              {appointment.branch.address}
              {appointment.branch.district ? ` · ${appointment.branch.district}` : ''}
            </span>
          </span>
        </p>
        {appointment.branch.phone ? (
          <p className="mt-3 flex items-center gap-2 text-[13px] text-muted">
            <Phone size={14} />
            {appointment.branch.phone}
          </p>
        ) : null}
        {appointment.notes ? (
          <div className="mt-5 border-t border-line pt-4">
            <p className="eyebrow mb-2">Sua observação</p>
            <p className="text-[13.5px] leading-relaxed text-ink/80">{appointment.notes}</p>
          </div>
        ) : null}
      </Card>

      {isOpen ? (
        <>
          <div className="mt-6">
            <AppointmentActions
              appointmentId={appointment.id}
              withinPolicy={withinPolicy}
              cancellationHours={brand.policies.cancellationHours}
              cancellationText={brand.policies.cancellationText}
            />
          </div>

          <p className="mt-6 text-[12.5px] text-muted">
            Prefere falar com alguém?{' '}
            <a
              href={whatsappLink(brand.contact.whatsapp, whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
            >
              Chame a equipe no WhatsApp
            </a>
            .
          </p>
        </>
      ) : appointment.status === 'CANCELLED' ? (
        <Notice tone="neutral" className="mt-6">
          Este agendamento foi cancelado
          {appointment.cancelReason ? ` — motivo informado: ${appointment.cancelReason}` : ''}.{' '}
          <Link href="/agendar" className="underline underline-offset-4">
            Agendar novamente
          </Link>
        </Notice>
      ) : (
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/agendar">Agendar novamente</Button>
          <Button href="/minha-conta/historico" variant="secondary">
            Ver ficha do atendimento
          </Button>
        </div>
      )}
    </div>
  );
}
