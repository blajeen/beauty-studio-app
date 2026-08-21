import * as React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Clock, MapPin } from 'lucide-react';
import { SmartImage } from '@/components/ui/media';
import { Avatar, Badge, Card } from '@/components/ui/primitives';
import { cn, formatPriceShort, parseList } from '@/lib/utils';
import { formatDuration, formatRelativeDay, formatTime } from '@/lib/datetime';
import { APPOINTMENT_STATUS_LABEL, type AppointmentStatus } from '@/lib/constants';

/* ── CATEGORIA ──────────────────────────────────────────────────────────────
 * Vitrine editorial da Home: foto grande, título serifado e o mínimo de texto.
 */
export function CategoryCard({
  href,
  title,
  tagline,
  imageUrl,
  count,
  large,
  wide,
}: {
  href: string;
  title: string;
  tagline?: string | null;
  imageUrl?: string | null;
  count?: number;
  /** Destaque editorial: ocupa 2x2 na grade. */
  large?: boolean;
  /** Fecha a última linha da grade ocupando duas colunas. */
  wide?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group relative block overflow-hidden rounded-lg',
        large && 'sm:col-span-2 sm:row-span-2',
        wide && !large && 'sm:col-span-2',
      )}
    >
      <SmartImage
        src={imageUrl}
        alt={title}
        seed={title}
        ratio={large || wide ? 'landscape' : 'portrait'}
        overlay
        imgClassName="group-hover:scale-[1.04]"
        className="h-full"
      />
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        <h3 className={cn('font-display text-white', large ? 'text-4xl' : 'text-2xl')}>{title}</h3>
        {tagline ? (
          <p className="mt-1.5 max-w-xs text-[12.5px] leading-relaxed text-white/70">{tagline}</p>
        ) : null}
        <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-white/85">
          {count ? `${count} serviços` : 'Ver serviços'}
          <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  );
}

/* ── SERVIÇO ──────────────────────────────────────────────────────────────── */

export function ServiceCard({
  service,
  href,
  action,
  compact,
}: {
  service: {
    name: string;
    slug: string;
    shortDescription?: string | null;
    price: number;
    priceType: string;
    duration: number;
    imageUrl?: string | null;
    isFeatured?: boolean;
    returnIntervalDays?: number | null;
  };
  href?: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  const body = (
    <>
      {!compact ? (
        <SmartImage
          src={service.imageUrl}
          alt={service.name}
          seed={service.name}
          ratio="landscape"
          imgClassName="group-hover:scale-[1.03]"
        />
      ) : null}
      <div className={cn('flex flex-1 flex-col p-5', compact && 'p-4')}>
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-[1.35rem] leading-tight">{service.name}</h3>
          {service.isFeatured && !compact ? <Badge tone="accent">Popular</Badge> : null}
        </div>
        {service.shortDescription ? (
          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted">
            {service.shortDescription}
          </p>
        ) : null}
        <div className="mt-4 flex items-end justify-between gap-4 pt-1">
          <div>
            <p className="text-[15px] font-medium text-ink">
              {formatPriceShort(service.price, service.priceType)}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[12px] text-muted">
              <Clock size={12} />
              {formatDuration(service.duration)}
            </p>
          </div>
          {action}
        </div>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="group">
        <Card className="flex h-full flex-col overflow-hidden transition-colors duration-300 hover:border-ink/25">
          {body}
        </Card>
      </Link>
    );
  }

  return <Card className="flex h-full flex-col overflow-hidden">{body}</Card>;
}

/* ── PROFISSIONAL ─────────────────────────────────────────────────────────── */

export function ProfessionalCard({
  professional,
  href,
}: {
  professional: {
    id: string;
    displayName: string;
    title?: string | null;
    avatarUrl?: string | null;
    coverUrl?: string | null;
    specialties?: string | null;
  };
  href: string;
}) {
  const specialties = parseList(professional.specialties).slice(0, 3);

  return (
    <Link href={href} className="group block">
      <Card className="h-full overflow-hidden transition-colors duration-300 hover:border-ink/25">
        <SmartImage
          src={professional.coverUrl ?? professional.avatarUrl}
          alt={professional.displayName}
          seed={professional.displayName}
          ratio="portrait"
          imgClassName="group-hover:scale-[1.03]"
        />
        <div className="p-5">
          <h3 className="font-display text-[1.4rem] leading-tight">{professional.displayName}</h3>
          {professional.title ? (
            <p className="mt-1 text-[12.5px] text-muted">{professional.title}</p>
          ) : null}
          {specialties.length ? (
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {specialties.map((item) => (
                <Badge key={item} tone="outline">
                  {item}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </Card>
    </Link>
  );
}

/* ── PORTFÓLIO ────────────────────────────────────────────────────────────── */

export function PortfolioCard({
  item,
  onClick,
}: {
  item: {
    title: string;
    imageUrl: string;
    styleTags?: string | null;
    professional?: { displayName: string; avatarUrl?: string | null } | null;
  };
  onClick?: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="group block w-full text-left">
      <SmartImage
        src={item.imageUrl}
        alt={item.title}
        seed={item.title}
        ratio="square"
        className="rounded-lg"
        imgClassName="group-hover:scale-[1.05]"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-medium text-ink">{item.title}</p>
          {item.professional ? (
            <p className="mt-0.5 truncate text-[12px] text-muted">{item.professional.displayName}</p>
          ) : null}
        </div>
        {item.professional ? (
          <Avatar
            name={item.professional.displayName}
            src={item.professional.avatarUrl}
            size="xs"
          />
        ) : null}
      </div>
    </button>
  );
}

/* ── PACOTE / COMBO ───────────────────────────────────────────────────────── */

export function PackageCard({
  pack,
  action,
}: {
  pack: {
    name: string;
    tagline?: string | null;
    description?: string | null;
    price: number;
    sessions: number;
    imageUrl?: string | null;
    highlight?: boolean;
    items?: { service: { name: string }; quantity: number }[];
  };
  action?: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        'flex h-full flex-col overflow-hidden',
        pack.highlight && 'ring-1 ring-accent/40',
      )}
    >
      <SmartImage src={pack.imageUrl} alt={pack.name} seed={pack.name} ratio="landscape" />
      <div className="flex flex-1 flex-col p-6">
        {pack.highlight ? (
          <Badge tone="accent" className="mb-3 self-start">
            Mais escolhido
          </Badge>
        ) : null}
        <h3 className="font-display text-2xl leading-tight">{pack.name}</h3>
        {pack.tagline ? <p className="mt-1.5 text-[13px] text-muted">{pack.tagline}</p> : null}
        {pack.items?.length ? (
          <ul className="mt-4 space-y-1.5 border-t border-line pt-4">
            {pack.items.map((item) => (
              <li key={item.service.name} className="flex justify-between text-[13px]">
                <span className="text-ink/80">{item.service.name}</span>
                {item.quantity > 1 ? <span className="text-muted">{item.quantity}×</span> : null}
              </li>
            ))}
          </ul>
        ) : null}
        {pack.sessions > 1 ? (
          <p className="mt-4 text-[13px] text-muted">{pack.sessions} sessões</p>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-4 pt-6">
          <p className="font-display text-3xl">{formatPriceShort(pack.price, 'FIXED')}</p>
          {action}
        </div>
      </div>
    </Card>
  );
}

/* ── PLANO (BEAUTY CLUB) ──────────────────────────────────────────────────── */

export function PlanCard({
  plan,
  action,
}: {
  plan: {
    name: string;
    tagline?: string | null;
    monthlyPrice: number;
    benefits?: string | null;
    highlight?: boolean;
    items?: { service: { name: string }; quantityPerCycle: number }[];
  };
  action?: React.ReactNode;
}) {
  const benefits = parseList(plan.benefits);

  return (
    <Card
      className={cn(
        'flex h-full flex-col p-7',
        plan.highlight && 'bg-secondary text-white border-secondary',
      )}
    >
      {plan.highlight ? (
        <span className="mb-4 self-start rounded-full bg-white/12 px-2.5 py-1 text-[11px] text-white/90">
          Recomendado
        </span>
      ) : null}
      <h3 className={cn('font-display text-2xl', plan.highlight && 'text-white')}>{plan.name}</h3>
      {plan.tagline ? (
        <p className={cn('mt-1.5 text-[13px]', plan.highlight ? 'text-white/65' : 'text-muted')}>
          {plan.tagline}
        </p>
      ) : null}

      <p className="mt-6 flex items-baseline gap-1.5">
        <span className="font-display text-4xl">{formatPriceShort(plan.monthlyPrice, 'FIXED')}</span>
        <span className={cn('text-[13px]', plan.highlight ? 'text-white/55' : 'text-muted')}>
          /mês
        </span>
      </p>

      <ul
        className={cn(
          'mt-6 space-y-2 border-t pt-6 text-[13.5px]',
          plan.highlight ? 'border-white/15 text-white/85' : 'border-line text-ink/80',
        )}
      >
        {plan.items?.map((item) => (
          <li key={item.service.name} className="flex justify-between gap-4">
            <span>{item.service.name}</span>
            <span className={plan.highlight ? 'text-white/55' : 'text-muted'}>
              {item.quantityPerCycle}×
            </span>
          </li>
        ))}
        {benefits.map((benefit) => (
          <li
            key={benefit}
            className={cn('flex gap-2', plan.highlight ? 'text-white/65' : 'text-muted')}
          >
            <span aria-hidden="true">·</span>
            {benefit}
          </li>
        ))}
      </ul>

      {action ? <div className="mt-auto pt-7">{action}</div> : null}
    </Card>
  );
}

/* ── AGENDAMENTO ──────────────────────────────────────────────────────────── */

export type AppointmentCardData = {
  id: string;
  code: string;
  status: string;
  startAt: Date;
  endAt: Date;
  totalPrice: number;
  branch: { name: string };
  items: {
    id: string;
    startAt: Date;
    duration: number;
    service: { name: string };
    professional: { displayName: string; avatarUrl: string | null };
  }[];
};

const STATUS_TONE: Record<string, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  IN_PROGRESS: 'info',
  COMPLETED: 'neutral',
  CANCELLED: 'danger',
  NO_SHOW: 'danger',
};

/**
 * O roteiro da cliente (seção 66): mesmo que a reserva envolva três
 * profissionais, ela lê uma coluna simples de horários.
 */
export function AppointmentCard({
  appointment,
  href,
  action,
  showStatus = true,
}: {
  appointment: AppointmentCardData;
  href?: string;
  action?: React.ReactNode;
  showStatus?: boolean;
}) {
  const multi = appointment.items.length > 1;

  const content = (
    <Card className="overflow-hidden transition-colors duration-300 hover:border-ink/25">
      <div className="flex items-start justify-between gap-4 border-b border-line bg-primary-soft/40 px-5 py-4">
        <div>
          <p className="font-display text-xl leading-tight">
            {formatRelativeDay(appointment.startAt)} · {formatTime(appointment.startAt)}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-muted">
            <MapPin size={12} />
            {appointment.branch.name}
            <span aria-hidden="true">·</span>
            <span className="tracking-wider">{appointment.code}</span>
          </p>
        </div>
        {showStatus ? (
          <Badge tone={STATUS_TONE[appointment.status] ?? 'neutral'}>
            {APPOINTMENT_STATUS_LABEL[appointment.status as AppointmentStatus] ?? appointment.status}
          </Badge>
        ) : null}
      </div>

      <ul className={cn('divide-y divide-line/70', multi && 'relative')}>
        {appointment.items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 px-5 py-3.5">
            <span className="w-12 shrink-0 font-display text-lg tabular-nums text-ink/80">
              {formatTime(item.startAt)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-medium text-ink">
                {item.service.name}
              </span>
              <span className="mt-0.5 block truncate text-[12.5px] text-muted">
                {item.professional.displayName} · {formatDuration(item.duration)}
              </span>
            </span>
            <Avatar
              name={item.professional.displayName}
              src={item.professional.avatarUrl}
              size="sm"
            />
          </li>
        ))}
      </ul>

      {action ? <div className="border-t border-line px-5 py-3.5">{action}</div> : null}
    </Card>
  );

  return href ? (
    <Link href={href} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}

/* ── MÉTRICA DO DASHBOARD ─────────────────────────────────────────────────── */

export function DashboardCard({
  label,
  value,
  hint,
  trend,
  icon,
  href,
  tone = 'default',
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  trend?: { value: string; positive?: boolean };
  icon?: React.ReactNode;
  href?: string;
  tone?: 'default' | 'dark';
}) {
  const inner = (
    <Card
      className={cn(
        'flex h-full flex-col justify-between p-5 transition-colors duration-300',
        tone === 'dark' ? 'bg-secondary text-white border-secondary' : 'hover:border-ink/25',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className={cn(
            'text-[12px] uppercase tracking-[0.12em]',
            tone === 'dark' ? 'text-white/55' : 'text-muted',
          )}
        >
          {label}
        </p>
        {icon ? (
          <span className={tone === 'dark' ? 'text-white/40' : 'text-muted/60'}>{icon}</span>
        ) : null}
      </div>
      <p className={cn('mt-5 font-display text-[2.4rem] leading-none', tone === 'dark' && 'text-white')}>
        {value}
      </p>
      <div className="mt-2.5 flex items-center gap-2">
        {hint ? (
          <span className={cn('text-[12px]', tone === 'dark' ? 'text-white/55' : 'text-muted')}>
            {hint}
          </span>
        ) : null}
        {trend ? (
          <span
            className={cn(
              'text-[12px] font-medium',
              trend.positive === false ? 'text-red-600' : 'text-emerald-700',
            )}
          >
            {trend.value}
          </span>
        ) : null}
      </div>
    </Card>
  );

  return href ? (
    <Link href={href} className="block h-full">
      {inner}
    </Link>
  ) : (
    inner
  );
}

/* ── EVENTO ───────────────────────────────────────────────────────────────── */

export function EventCard({
  event,
  href,
}: {
  event: {
    id: string;
    name: string;
    type: string;
    eventDate: Date;
    readyByTime: string;
    venue?: string | null;
    status: string;
    _count?: { appointments: number; participants: number };
  };
  href: string;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="p-5 transition-colors duration-300 hover:border-ink/25">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-display text-xl leading-tight">{event.name}</h3>
            <p className="mt-1.5 text-[12.5px] text-muted">
              {formatRelativeDay(event.eventDate)} · pronta às {event.readyByTime}
            </p>
            {event.venue ? (
              <p className="mt-1 truncate text-[12.5px] text-muted">{event.venue}</p>
            ) : null}
          </div>
          <Badge tone={event.status === 'CONFIRMED' ? 'success' : 'outline'}>
            {event.status === 'CONFIRMED' ? 'Confirmado' : 'Em planejamento'}
          </Badge>
        </div>
        {event._count ? (
          <p className="mt-4 border-t border-line pt-3.5 text-[12.5px] text-muted">
            {event._count.participants} participantes · {event._count.appointments} atendimentos
          </p>
        ) : null}
      </Card>
    </Link>
  );
}
