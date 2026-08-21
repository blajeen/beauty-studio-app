'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  MapPin,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Container,
  Field,
  Input,
  OptionCard,
  Select,
  Textarea,
} from '@/components/ui/primitives';
import { EmptyState, Notice, Spinner } from '@/components/ui/states';
import { useToast } from '@/components/ui/overlay';
import { cn, formatCurrency, formatPriceShort, parseList } from '@/lib/utils';
import { formatDuration } from '@/lib/datetime';
import { EVENT_TYPES, EVENT_TYPE_LABEL, type EventType } from '@/lib/constants';
import {
  confirmBooking,
  firstAvailable,
  joinWaitlist,
  searchAvailability,
  type AvailabilityResult,
  type BackwardPlanDTO,
  type SlotDTO,
} from './actions';

/* ── TIPOS ──────────────────────────────────────────────────────────────────── */

export type BookingCatalog = {
  branches: {
    id: string;
    name: string;
    slug: string;
    address: string;
    district: string | null;
    city: string;
  }[];
  categories: {
    id: string;
    name: string;
    slug: string;
    tagline: string | null;
    services: {
      id: string;
      name: string;
      slug: string;
      shortDescription: string | null;
      price: number;
      priceType: string;
      duration: number;
      isFeatured: boolean;
    }[];
  }[];
  professionals: {
    id: string;
    displayName: string;
    title: string | null;
    avatarUrl: string | null;
    specialties: string | null;
    serviceIds: string[];
    branchIds: string[];
  }[];
};

export type BookingIntent = {
  serviceIds: string[];
  professionalId: string | null;
  branchId: string | null;
  isEvent: boolean;
  eventType: string | null;
  packageName: string | null;
  rescheduleId: string | null;
  rescheduleCode: string | null;
  lockedProfessionals: Record<string, string>;
};

type Step = 'entry' | 'branch' | 'pro-first' | 'services' | 'pros' | 'event' | 'time' | 'review' | 'done';

type Selection = { serviceId: string; professionalId: string | null };

/* ── COMPONENTE ─────────────────────────────────────────────────────────────── */

export function BookingWizard({
  catalog,
  intent,
  isAuthenticated,
  multiBranch,
  eventsEnabled,
  waitlistEnabled,
  cancellationText,
  prepBuffer,
}: {
  catalog: BookingCatalog;
  intent: BookingIntent;
  isAuthenticated: boolean;
  multiBranch: boolean;
  eventsEnabled: boolean;
  waitlistEnabled: boolean;
  cancellationText: string;
  prepBuffer: number;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const services = React.useMemo(
    () => new Map(catalog.categories.flatMap((c) => c.services.map((s) => [s.id, s]))),
    [catalog],
  );
  const professionals = React.useMemo(
    () => new Map(catalog.professionals.map((p) => [p.id, p])),
    [catalog],
  );

  const [branchId, setBranchId] = React.useState<string | null>(
    intent.branchId ?? (catalog.branches.length === 1 ? catalog.branches[0].id : null),
  );
  const [selected, setSelected] = React.useState<Selection[]>(() =>
    intent.serviceIds.map((serviceId) => ({
      serviceId,
      professionalId: intent.lockedProfessionals[serviceId] ?? intent.professionalId ?? null,
    })),
  );
  const [proFirst, setProFirst] = React.useState<string | null>(intent.professionalId);
  const [isEvent, setIsEvent] = React.useState(intent.isEvent);
  const [eventInfo, setEventInfo] = React.useState({
    type: (intent.eventType as EventType) ?? 'WEDDING',
    dateKey: '',
    readyBy: '18:00',
    venue: '',
  });

  const [step, setStep] = React.useState<Step>(() => {
    if (intent.rescheduleId) return 'time';
    if (intent.isEvent) return multiBranch && !intent.branchId ? 'branch' : 'services';
    if (intent.serviceIds.length > 0) return multiBranch && !intent.branchId ? 'branch' : 'pros';
    if (intent.professionalId) return multiBranch && !intent.branchId ? 'branch' : 'services';
    return 'entry';
  });

  const [availability, setAvailability] = React.useState<AvailabilityResult | null>(null);
  const [dateKey, setDateKey] = React.useState<string | null>(null);
  const [slot, setSlot] = React.useState<SlotDTO | null>(null);
  const [plan, setPlan] = React.useState<BackwardPlanDTO | null>(null);
  const [notes, setNotes] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{ code: string; appointmentId: string } | null>(null);

  const topRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step]);

  const totalDuration = selected.reduce(
    (sum, item) => sum + (services.get(item.serviceId)?.duration ?? 0),
    0,
  );
  const totalPrice = selected.reduce(
    (sum, item) => sum + (services.get(item.serviceId)?.price ?? 0),
    0,
  );
  const hasVariablePrice = selected.some(
    (item) => (services.get(item.serviceId)?.priceType ?? 'FIXED') !== 'FIXED',
  );

  /* ── busca de horários ─────────────────────────────────────────────────── */

  const load = React.useCallback(
    async (targetDate?: string | null) => {
      if (!branchId || selected.length === 0) return;
      setLoading(true);
      setError(null);
      const response = await searchAvailability({
        branchId,
        selections: selected,
        dateKey: targetDate ?? undefined,
        readyBy: isEvent && eventInfo.readyBy ? eventInfo.readyBy : undefined,
        excludeAppointmentId: intent.rescheduleId ?? undefined,
      });
      setLoading(false);

      if (!response.ok) {
        setError(response.error);
        setAvailability(null);
        return;
      }
      setAvailability(response);
      setDateKey(response.selectedDate);
      setPlan(response.plan);
      setSlot(null);
    },
    [branchId, selected, isEvent, eventInfo.readyBy, intent.rescheduleId],
  );

  React.useEffect(() => {
    if (step === 'time') void load(isEvent && eventInfo.dateKey ? eventInfo.dateKey : dateKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function pickFirstAvailable() {
    if (!branchId) return;
    setLoading(true);
    const response = await firstAvailable({ branchId, selections: selected });
    setLoading(false);
    if (!response.ok || !response.slot) {
      toast('Não encontramos horários nos próximos dias.', 'error');
      return;
    }
    setSlot(response.slot);
    setDateKey(response.slot.start.slice(0, 10));
    setStep('review');
  }

  async function confirm() {
    if (!slot || !branchId) return;
    setConfirming(true);
    setError(null);
    const response = await confirmBooking({
      branchId,
      selections: selected,
      start: slot.start,
      notes: notes.trim() || undefined,
      readyBy:
        isEvent && eventInfo.dateKey && eventInfo.readyBy
          ? new Date(`${eventInfo.dateKey}T${eventInfo.readyBy}:00`).toISOString()
          : undefined,
      rescheduleId: intent.rescheduleId ?? undefined,
    });
    setConfirming(false);

    if (!response.ok) {
      setError(response.error);
      if (response.conflict) {
        setStep('time');
        void load(dateKey);
      }
      return;
    }

    setResult(response);
    setStep('done');
    router.refresh();
  }

  /* ── navegação ─────────────────────────────────────────────────────────── */

  const flow: Step[] = React.useMemo(() => {
    const steps: Step[] = [];
    if (multiBranch) steps.push('branch');
    if (proFirst && !intent.serviceIds.length) steps.push('pro-first');
    steps.push('services');
    steps.push('pros');
    if (isEvent) steps.push('event');
    steps.push('time', 'review');
    return steps;
  }, [multiBranch, proFirst, isEvent, intent.serviceIds.length]);

  function goNext() {
    const index = flow.indexOf(step);
    if (index >= 0 && index < flow.length - 1) setStep(flow[index + 1]);
  }
  function goBack() {
    const index = flow.indexOf(step);
    if (step === 'entry') return;
    if (index > 0) setStep(flow[index - 1]);
    else setStep('entry');
  }

  const canContinue = (() => {
    switch (step) {
      case 'branch':
        return Boolean(branchId);
      case 'pro-first':
        return Boolean(proFirst);
      case 'services':
        return selected.length > 0;
      case 'pros':
        return selected.length > 0;
      case 'event':
        return Boolean(eventInfo.dateKey && eventInfo.readyBy);
      case 'time':
        return Boolean(slot);
      default:
        return true;
    }
  })();

  /* ── render ────────────────────────────────────────────────────────────── */

  if (step === 'done' && result) {
    return <BookingSuccess result={result} slot={slot} isReschedule={Boolean(intent.rescheduleId)} />;
  }

  const stepIndex = flow.indexOf(step);

  return (
    <Container size="default" className="py-8 sm:py-12">
      <div ref={topRef} className="scroll-mt-24" />

      <header className="mb-8">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={goBack}
            className={cn(
              'inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink',
              step === 'entry' && 'invisible',
            )}
          >
            <ArrowLeft size={15} />
            Voltar
          </button>
          {stepIndex >= 0 ? (
            <span className="text-[12px] text-muted">
              Passo {stepIndex + 1} de {flow.length}
            </span>
          ) : null}
        </div>

        {stepIndex >= 0 ? (
          <div className="mt-4 flex gap-1.5" aria-hidden="true">
            {flow.map((item, index) => (
              <span
                key={item}
                className={cn(
                  'h-0.5 flex-1 rounded-full transition-colors duration-500',
                  index <= stepIndex ? 'bg-primary' : 'bg-line',
                )}
              />
            ))}
          </div>
        ) : null}
      </header>

      {intent.rescheduleId ? (
        <Notice tone="accent" className="mb-6" title="Remarcação">
          Você está alterando o agendamento {intent.rescheduleCode}. Os serviços e as profissionais
          são mantidos — escolha apenas o novo horário.
        </Notice>
      ) : null}

      {intent.packageName ? (
        <Notice tone="neutral" className="mb-6" title={`Pacote ${intent.packageName}`}>
          Os serviços do pacote já vieram selecionados. Você pode ajustar antes de continuar.
        </Notice>
      ) : null}

      {error ? (
        <Notice tone="danger" className="mb-6">
          {error}
        </Notice>
      ) : null}

      {step === 'entry' ? (
        <EntryStep
          eventsEnabled={eventsEnabled}
          onChoose={(mode) => {
            if (mode === 'event') {
              setIsEvent(true);
              setStep(multiBranch ? 'branch' : 'services');
            } else if (mode === 'professional') {
              setProFirst('');
              setStep(multiBranch ? 'branch' : 'pro-first');
            } else {
              setStep(multiBranch ? 'branch' : 'services');
            }
          }}
        />
      ) : null}

      {step === 'branch' ? (
        <BranchStep branches={catalog.branches} value={branchId} onChange={setBranchId} />
      ) : null}

      {step === 'pro-first' ? (
        <ProFirstStep
          professionals={catalog.professionals.filter(
            (professional) => !branchId || professional.branchIds.includes(branchId),
          )}
          value={proFirst}
          onChange={(id) => {
            setProFirst(id);
            setSelected((current) =>
              current.map((item) => ({ ...item, professionalId: id })),
            );
          }}
        />
      ) : null}

      {step === 'services' ? (
        <ServicesStep
          catalog={catalog}
          branchId={branchId}
          restrictToProfessional={proFirst || null}
          selected={selected}
          onToggle={(serviceId) =>
            setSelected((current) =>
              current.some((item) => item.serviceId === serviceId)
                ? current.filter((item) => item.serviceId !== serviceId)
                : [...current, { serviceId, professionalId: proFirst || null }],
            )
          }
        />
      ) : null}

      {step === 'pros' ? (
        <ProfessionalsStep
          selected={selected}
          services={services}
          catalog={catalog}
          branchId={branchId}
          locked={Boolean(intent.rescheduleId)}
          onChange={(serviceId, professionalId) =>
            setSelected((current) =>
              current.map((item) =>
                item.serviceId === serviceId ? { ...item, professionalId } : item,
              ),
            )
          }
        />
      ) : null}

      {step === 'event' ? (
        <EventStep
          value={eventInfo}
          onChange={setEventInfo}
          totalDuration={totalDuration}
          prepBuffer={prepBuffer}
        />
      ) : null}

      {step === 'time' ? (
        <TimeStep
          availability={availability}
          loading={loading}
          dateKey={dateKey}
          slot={slot}
          plan={plan}
          multi={selected.length > 1}
          isEvent={isEvent}
          waitlistEnabled={waitlistEnabled}
          branchId={branchId}
          firstServiceId={selected[0]?.serviceId}
          onPickDate={(key) => {
            setDateKey(key);
            void load(key);
          }}
          onPickSlot={setSlot}
          onFirstAvailable={pickFirstAvailable}
        />
      ) : null}

      {step === 'review' ? (
        <ReviewStep
          slot={slot}
          branch={catalog.branches.find((branch) => branch.id === branchId) ?? null}
          notes={notes}
          onNotes={setNotes}
          isAuthenticated={isAuthenticated}
          cancellationText={cancellationText}
          hasVariablePrice={hasVariablePrice}
          isReschedule={Boolean(intent.rescheduleId)}
        />
      ) : null}

      {/* Barra de ação: total sempre visível, como num checkout. */}
      {step !== 'entry' && step !== 'done' ? (
        <div className="safe-bottom sticky bottom-0 z-30 -mx-5 mt-10 border-t border-line bg-canvas/95 px-5 py-4 backdrop-blur-md sm:mx-0 sm:rounded-lg sm:border sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              {selected.length > 0 ? (
                <>
                  <p className="truncate text-[13px] text-muted">
                    {selected.length === 1
                      ? services.get(selected[0].serviceId)?.name
                      : `${selected.length} serviços`}
                    {totalDuration ? ` · ${formatDuration(totalDuration)}` : ''}
                  </p>
                  <p className="font-display text-xl leading-tight">
                    {hasVariablePrice ? 'a partir de ' : ''}
                    {formatCurrency(totalPrice)}
                  </p>
                </>
              ) : (
                <p className="text-[13px] text-muted">Escolha ao menos um serviço</p>
              )}
            </div>

            {step === 'review' ? (
              isAuthenticated ? (
                <Button onClick={confirm} size="lg" disabled={confirming || !slot}>
                  {confirming ? <Spinner /> : null}
                  {confirming ? 'Confirmando…' : intent.rescheduleId ? 'Confirmar remarcação' : 'Confirmar agendamento'}
                </Button>
              ) : (
                <Button href="/entrar?redirect=/agendar" size="lg">
                  Entrar para confirmar
                </Button>
              )
            ) : (
              <Button onClick={goNext} size="lg" disabled={!canContinue || loading}>
                Continuar
                <ChevronRight size={16} />
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </Container>
  );
}

/* ── PASSO: ENTRADA ─────────────────────────────────────────────────────────── */

function EntryStep({
  eventsEnabled,
  onChoose,
}: {
  eventsEnabled: boolean;
  onChoose: (mode: 'services' | 'professional' | 'event') => void;
}) {
  const options = [
    {
      mode: 'services' as const,
      icon: Sparkles,
      title: 'Sei o que quero fazer',
      body: 'Escolha um ou vários serviços e nós montamos a sequência.',
    },
    {
      mode: 'professional' as const,
      icon: Users,
      title: 'Quero uma profissional específica',
      body: 'Comece pela pessoa e veja tudo o que ela faz.',
    },
    ...(eventsEnabled
      ? [
          {
            mode: 'event' as const,
            icon: Calendar,
            title: 'Tenho um evento',
            body: 'Diga a que horas precisa estar pronta e calculamos o horário de início.',
          },
        ]
      : []),
  ];

  return (
    <div>
      <h1 className="font-display text-[2.4rem] leading-[1.05] sm:text-[3rem]">
        Como você quer começar?
      </h1>
      <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted">
        Qualquer caminho leva ao mesmo lugar. Escolha o que for mais natural para você.
      </p>

      <div className="stagger mt-9 space-y-3">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.mode}
              type="button"
              onClick={() => onChoose(option.mode)}
              className="group flex w-full items-center gap-5 rounded-lg border border-line bg-surface p-5 text-left transition-all duration-200 hover:border-ink/30 active:scale-[0.995]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-ink/70">
                <Icon size={19} strokeWidth={1.6} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-xl">{option.title}</span>
                <span className="mt-0.5 block text-[13px] leading-relaxed text-muted">
                  {option.body}
                </span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── PASSO: UNIDADE ─────────────────────────────────────────────────────────── */

function BranchStep({
  branches,
  value,
  onChange,
}: {
  branches: BookingCatalog['branches'];
  value: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <div>
      <h1 className="font-display text-[2.2rem] leading-tight sm:text-[2.8rem]">
        Onde você quer ser atendida?
      </h1>
      <p className="mt-3 text-[15px] text-muted">
        Seu histórico e seus pacotes valem nas duas unidades.
      </p>

      <div className="mt-8 space-y-3">
        {branches.map((branch) => (
          <OptionCard
            key={branch.id}
            selected={value === branch.id}
            onClick={() => onChange(branch.id)}
            className="flex items-center gap-4"
          >
            <MapPin size={18} className="shrink-0 text-muted" />
            <span className="min-w-0 flex-1">
              <span className="block font-display text-xl">{branch.name}</span>
              <span className="mt-0.5 block text-[13px] text-muted">
                {branch.address}
                {branch.district ? ` · ${branch.district}` : ''}
              </span>
            </span>
            {value === branch.id ? <Check size={18} className="shrink-0" /> : null}
          </OptionCard>
        ))}
      </div>
    </div>
  );
}

/* ── PASSO: PROFISSIONAL PRIMEIRO (caminho B) ──────────────────────────────── */

function ProFirstStep({
  professionals,
  value,
  onChange,
}: {
  professionals: BookingCatalog['professionals'];
  value: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <div>
      <h1 className="font-display text-[2.2rem] leading-tight sm:text-[2.8rem]">
        Com quem você quer marcar?
      </h1>
      <p className="mt-3 text-[15px] text-muted">
        Depois mostramos apenas os serviços que ela realiza.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {professionals.map((professional) => (
          <OptionCard
            key={professional.id}
            selected={value === professional.id}
            onClick={() => onChange(professional.id)}
            className="flex items-center gap-4"
          >
            <Avatar name={professional.displayName} src={professional.avatarUrl} size="md" />
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-medium">{professional.displayName}</span>
              <span className="mt-0.5 block truncate text-[12.5px] text-muted">
                {professional.title}
              </span>
            </span>
            {value === professional.id ? <Check size={18} className="shrink-0" /> : null}
          </OptionCard>
        ))}
      </div>
    </div>
  );
}

/* ── PASSO: SERVIÇOS ────────────────────────────────────────────────────────── */

function ServicesStep({
  catalog,
  branchId,
  restrictToProfessional,
  selected,
  onToggle,
}: {
  catalog: BookingCatalog;
  branchId: string | null;
  restrictToProfessional: string | null;
  selected: Selection[];
  onToggle: (serviceId: string) => void;
}) {
  const [activeCategory, setActiveCategory] = React.useState<string>(catalog.categories[0]?.slug ?? '');

  const allowed = React.useMemo(() => {
    const available = new Set<string>();
    for (const professional of catalog.professionals) {
      if (branchId && !professional.branchIds.includes(branchId)) continue;
      if (restrictToProfessional && professional.id !== restrictToProfessional) continue;
      professional.serviceIds.forEach((id) => available.add(id));
    }
    return available;
  }, [catalog.professionals, branchId, restrictToProfessional]);

  const categories = catalog.categories
    .map((category) => ({
      ...category,
      services: category.services.filter((service) => allowed.has(service.id)),
    }))
    .filter((category) => category.services.length > 0);

  const active = categories.find((category) => category.slug === activeCategory) ?? categories[0];
  const selectedIds = new Set(selected.map((item) => item.serviceId));

  return (
    <div>
      <h1 className="font-display text-[2.2rem] leading-tight sm:text-[2.8rem]">
        O que você quer fazer?
      </h1>
      <p className="mt-3 text-[15px] text-muted">
        Pode escolher mais de um. Montamos a ordem e encaixamos as profissionais.
      </p>

      <div className="scrollbar-none -mx-5 mt-7 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveCategory(category.slug)}
            className={cn(
              'shrink-0 rounded-full border px-4 py-2 text-[13px] transition-colors',
              active?.slug === category.slug
                ? 'border-ink bg-primary text-primary-contrast'
                : 'border-line bg-surface text-ink/70 hover:border-ink/35',
            )}
          >
            {category.name}
          </button>
        ))}
      </div>

      {active ? (
        <div className="mt-6 space-y-2.5">
          {active.services.map((service) => {
            const isSelected = selectedIds.has(service.id);
            return (
              <OptionCard
                key={service.id}
                selected={isSelected}
                onClick={() => onToggle(service.id)}
                className="flex items-start gap-4"
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border transition-colors',
                    isSelected ? 'border-ink bg-primary text-primary-contrast' : 'border-line',
                  )}
                  aria-hidden="true"
                >
                  {isSelected ? <Check size={13} strokeWidth={3} /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[15px] font-medium">{service.name}</span>
                    {service.isFeatured ? <Badge tone="accent">Popular</Badge> : null}
                  </span>
                  {service.shortDescription ? (
                    <span className="mt-1 block text-[13px] leading-relaxed text-muted">
                      {service.shortDescription}
                    </span>
                  ) : null}
                  <span className="mt-1.5 block text-[12.5px] text-muted">
                    {formatDuration(service.duration)}
                  </span>
                </span>
                <span className="shrink-0 whitespace-nowrap text-[14px] font-medium">
                  {formatPriceShort(service.price, service.priceType)}
                </span>
              </OptionCard>
            );
          })}
        </div>
      ) : (
        <EmptyState
          className="mt-8"
          title="Nenhum serviço disponível"
          description="Escolha outra unidade ou outra profissional."
        />
      )}

      {selected.length > 1 ? (
        <Notice tone="neutral" className="mt-6">
          {selected.length} serviços selecionados. Você verá um roteiro com o horário de cada um
          antes de confirmar.
        </Notice>
      ) : null}
    </div>
  );
}

/* ── PASSO: PROFISSIONAIS ───────────────────────────────────────────────────── */

function ProfessionalsStep({
  selected,
  services,
  catalog,
  branchId,
  locked,
  onChange,
}: {
  selected: Selection[];
  services: Map<string, BookingCatalog['categories'][number]['services'][number]>;
  catalog: BookingCatalog;
  branchId: string | null;
  locked: boolean;
  onChange: (serviceId: string, professionalId: string | null) => void;
}) {
  return (
    <div>
      <h1 className="font-display text-[2.2rem] leading-tight sm:text-[2.8rem]">
        Com quem?
      </h1>
      <p className="mt-3 text-[15px] text-muted">
        Sem preferência? Encaixamos quem estiver disponível no melhor horário para você.
      </p>

      <div className="mt-8 space-y-8">
        {selected.map((item) => {
          const service = services.get(item.serviceId);
          const candidates = catalog.professionals.filter(
            (professional) =>
              professional.serviceIds.includes(item.serviceId) &&
              (!branchId || professional.branchIds.includes(branchId)),
          );

          return (
            <div key={item.serviceId}>
              <div className="mb-3 flex items-baseline justify-between gap-4">
                <p className="text-[15px] font-medium">{service?.name}</p>
                <span className="text-[12.5px] text-muted">
                  {service ? formatDuration(service.duration) : null}
                </span>
              </div>

              <div className="scrollbar-none -mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
                {!locked ? (
                  <ProChip
                    selected={item.professionalId === null}
                    onClick={() => onChange(item.serviceId, null)}
                    label="Sem preferência"
                    hint="mais horários"
                    icon={<Zap size={15} strokeWidth={1.7} />}
                  />
                ) : null}
                {candidates.map((professional) => (
                  <ProChip
                    key={professional.id}
                    selected={item.professionalId === professional.id}
                    onClick={() => (locked ? null : onChange(item.serviceId, professional.id))}
                    label={professional.displayName}
                    hint={professional.title ?? undefined}
                    avatar={{ name: professional.displayName, src: professional.avatarUrl }}
                  />
                ))}
              </div>

              {candidates.length === 0 ? (
                <p className="mt-2 text-[12.5px] text-muted">
                  Nenhuma profissional realiza este serviço nesta unidade.
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProChip({
  selected,
  onClick,
  label,
  hint,
  avatar,
  icon,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  hint?: string;
  avatar?: { name: string; src: string | null };
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'flex shrink-0 items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-left transition-all duration-200',
        selected ? 'border-ink bg-primary-soft' : 'border-line bg-surface hover:border-ink/30',
      )}
    >
      {avatar ? (
        <Avatar name={avatar.name} src={avatar.src} size="sm" />
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-ink/60">
          {icon}
        </span>
      )}
      <span>
        <span className="block text-[13.5px] font-medium">{label}</span>
        {hint ? <span className="block text-[11.5px] text-muted">{hint}</span> : null}
      </span>
    </button>
  );
}

/* ── PASSO: EVENTO ──────────────────────────────────────────────────────────── */

function EventStep({
  value,
  onChange,
  totalDuration,
  prepBuffer,
}: {
  value: { type: EventType; dateKey: string; readyBy: string; venue: string };
  onChange: (value: { type: EventType; dateKey: string; readyBy: string; venue: string }) => void;
  totalDuration: number;
  prepBuffer: number;
}) {
  const suggested = React.useMemo(() => {
    if (!value.readyBy) return null;
    const [h, m] = value.readyBy.split(':').map(Number);
    const total = totalDuration + prepBuffer;
    const minutes = h * 60 + m - total;
    if (minutes < 0) return null;
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  }, [value.readyBy, totalDuration, prepBuffer]);

  return (
    <div>
      <h1 className="font-display text-[2.2rem] leading-tight sm:text-[2.8rem]">Sobre o evento</h1>
      <p className="mt-3 text-[15px] text-muted">
        O horário em que você precisa estar pronta é o que importa — o resto calculamos a partir
        dele.
      </p>

      <div className="mt-8 space-y-5">
        <Field label="Para qual ocasião?" required>
          <Select
            value={value.type}
            onChange={(event) => onChange({ ...value, type: event.target.value as EventType })}
          >
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {EVENT_TYPE_LABEL[type]}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Quando é o evento?" required>
            <Input
              type="date"
              value={value.dateKey}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(event) => onChange({ ...value, dateKey: event.target.value })}
            />
          </Field>
          <Field label="Que horas precisa estar pronta?" required hint="decisivo">
            <Input
              type="time"
              value={value.readyBy}
              onChange={(event) => onChange({ ...value, readyBy: event.target.value })}
            />
          </Field>
        </div>

        <Field label="Local do evento" hint="opcional">
          <Input
            value={value.venue}
            placeholder="Onde acontece a cerimônia ou a festa"
            onChange={(event) => onChange({ ...value, venue: event.target.value })}
          />
        </Field>
      </div>

      {suggested ? (
        <Card className="mt-8 p-6">
          <p className="eyebrow mb-4">Cronograma reverso</p>
          <div className="flex items-baseline justify-between gap-4 border-b border-line pb-4">
            <span className="text-[13.5px] text-muted">Início recomendado</span>
            <span className="font-display text-3xl">{suggested}</span>
          </div>
          <dl className="mt-4 space-y-2 text-[13px]">
            <div className="flex justify-between">
              <dt className="text-muted">Preparo</dt>
              <dd>{formatDuration(prepBuffer)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Serviços</dt>
              <dd>{formatDuration(totalDuration)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 font-medium">
              <dt>Pronta às</dt>
              <dd>{value.readyBy}</dd>
            </div>
          </dl>
          <p className="mt-4 text-[12.5px] leading-relaxed text-muted">
            No próximo passo mostramos apenas os horários que terminam a tempo.
          </p>
        </Card>
      ) : value.readyBy ? (
        <Notice tone="warning" className="mt-8">
          Os serviços escolhidos somam {formatDuration(totalDuration + prepBuffer)} e não cabem antes
          desse horário. Ajuste o horário ou remova algum serviço.
        </Notice>
      ) : null}
    </div>
  );
}

/* ── PASSO: HORÁRIO ─────────────────────────────────────────────────────────── */

function TimeStep({
  availability,
  loading,
  dateKey,
  slot,
  plan,
  multi,
  isEvent,
  waitlistEnabled,
  branchId,
  firstServiceId,
  onPickDate,
  onPickSlot,
  onFirstAvailable,
}: {
  availability: AvailabilityResult | null;
  loading: boolean;
  dateKey: string | null;
  slot: SlotDTO | null;
  plan: BackwardPlanDTO | null;
  multi: boolean;
  isEvent: boolean;
  waitlistEnabled: boolean;
  branchId: string | null;
  firstServiceId?: string;
  onPickDate: (key: string) => void;
  onPickSlot: (slot: SlotDTO) => void;
  onFirstAvailable: () => void;
}) {
  const { toast } = useToast();
  const [waiting, setWaiting] = React.useState(false);

  const days = availability?.ok ? availability.days : [];
  const slots = availability?.ok ? availability.slots : [];

  const periods = React.useMemo(() => {
    const groups: { label: string; items: SlotDTO[] }[] = [
      { label: 'Manhã', items: [] },
      { label: 'Tarde', items: [] },
      { label: 'Noite', items: [] },
    ];
    for (const item of slots) {
      const hour = new Date(item.start).getHours();
      if (hour < 12) groups[0].items.push(item);
      else if (hour < 18) groups[1].items.push(item);
      else groups[2].items.push(item);
    }
    return groups.filter((group) => group.items.length > 0);
  }, [slots]);

  async function enterWaitlist() {
    if (!branchId) return;
    setWaiting(true);
    const response = await joinWaitlist({ branchId, serviceId: firstServiceId });
    setWaiting(false);
    toast(
      response.ok
        ? 'Você entrou na lista de espera. Avisamos assim que abrir um horário.'
        : (response.error ?? 'Não foi possível entrar na lista.'),
      response.ok ? 'success' : 'error',
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[2.2rem] leading-tight sm:text-[2.8rem]">
            Escolha o horário
          </h1>
          <p className="mt-3 text-[15px] text-muted">
            {isEvent
              ? 'Mostramos apenas os horários que terminam antes do seu compromisso.'
              : multi
                ? 'Cada horário abre um roteiro completo, com a profissional de cada serviço.'
                : 'Horários livres nos próximos dias.'}
          </p>
        </div>
        {!isEvent ? (
          <Button variant="secondary" size="sm" onClick={onFirstAvailable} disabled={loading}>
            <Zap size={14} />
            Primeiro disponível
          </Button>
        ) : null}
      </div>

      {plan ? (
        <Card className="mt-7 p-5">
          <p className="eyebrow mb-4">Seu cronograma</p>
          <ul>
            {plan.steps.map((step, index) => (
              <li
                key={`${step.label}-${index}`}
                className="flex items-center gap-4 border-b border-line/70 py-2.5 last:border-0"
              >
                <span className="w-12 shrink-0 font-display text-lg tabular-nums text-ink/80">
                  {new Date(step.start).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span
                  className={cn(
                    'text-[13.5px]',
                    step.kind === 'READY' ? 'font-medium text-ink' : 'text-ink/80',
                    step.kind === 'PREP' && 'text-muted',
                  )}
                >
                  {step.label}
                  {step.minutes > 0 ? (
                    <span className="text-muted"> · {formatDuration(step.minutes)}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {/* Trilho de dias com indicação de disponibilidade. */}
      <div className="scrollbar-none -mx-5 mt-7 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0">
        {days.map((day) => {
          const date = new Date(`${day.dateKey}T12:00:00`);
          const isActive = dateKey === day.dateKey;
          const disabled = day.count === 0;
          return (
            <button
              key={day.dateKey}
              type="button"
              disabled={disabled}
              onClick={() => onPickDate(day.dateKey)}
              className={cn(
                'flex w-[62px] shrink-0 flex-col items-center rounded-lg border py-3 transition-all duration-200',
                isActive
                  ? 'border-ink bg-primary text-primary-contrast'
                  : disabled
                    ? 'border-line/60 bg-surface/50 text-muted/45'
                    : 'border-line bg-surface text-ink hover:border-ink/35',
              )}
            >
              <span className="text-[10.5px] uppercase tracking-[0.1em] opacity-70">
                {date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
              </span>
              <span className="mt-1 font-display text-xl leading-none">{date.getDate()}</span>
              <span
                className={cn(
                  'mt-1.5 h-1 w-1 rounded-full',
                  disabled ? 'bg-transparent' : isActive ? 'bg-current opacity-70' : 'bg-accent',
                )}
              />
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="flex items-center gap-3 py-12 text-muted">
            <Spinner />
            <span className="text-[13px]">Procurando horários…</span>
          </div>
        ) : slots.length === 0 ? (
          <EmptyState
            title="Não encontramos horários"
            description={
              isEvent
                ? 'Nenhum encaixe termina antes do horário informado. Tente outra data ou ajuste os serviços.'
                : 'Escolha outro dia, remova um serviço ou entre na lista de espera — avisamos quando abrir uma vaga.'
            }
            action={
              waitlistEnabled ? (
                <Button variant="secondary" onClick={enterWaitlist} disabled={waiting}>
                  {waiting ? <Spinner /> : null}
                  Entrar na lista de espera
                </Button>
              ) : null
            }
          />
        ) : (
          <div className="space-y-7">
            {periods.map((group) => (
              <div key={group.label}>
                <p className="eyebrow mb-3">{group.label}</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
                  {group.items.map((item) => {
                    const isActive = slot?.start === item.start;
                    return (
                      <button
                        key={item.start}
                        type="button"
                        onClick={() => onPickSlot(item)}
                        className={cn(
                          'rounded-md border py-3 text-[14px] tabular-nums transition-all duration-200 active:scale-[0.97]',
                          isActive
                            ? 'border-ink bg-primary text-primary-contrast'
                            : 'border-line bg-surface hover:border-ink/35',
                        )}
                      >
                        {new Date(item.start).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {slot && multi ? (
        <Card className="mt-8 p-5">
          <p className="eyebrow mb-4">Seu roteiro</p>
          <Itinerary slot={slot} />
        </Card>
      ) : null}
    </div>
  );
}

/* ── PASSO: RESUMO ──────────────────────────────────────────────────────────── */

function ReviewStep({
  slot,
  branch,
  notes,
  onNotes,
  isAuthenticated,
  cancellationText,
  hasVariablePrice,
  isReschedule,
}: {
  slot: SlotDTO | null;
  branch: BookingCatalog['branches'][number] | null;
  notes: string;
  onNotes: (value: string) => void;
  isAuthenticated: boolean;
  cancellationText: string;
  hasVariablePrice: boolean;
  isReschedule: boolean;
}) {
  if (!slot) {
    return (
      <EmptyState
        title="Escolha um horário"
        description="Volte um passo e selecione o horário que preferir."
      />
    );
  }

  const start = new Date(slot.start);

  return (
    <div>
      <h1 className="font-display text-[2.2rem] leading-tight sm:text-[2.8rem]">
        {isReschedule ? 'Confirme a remarcação' : 'Tudo certo?'}
      </h1>
      <p className="mt-3 text-[15px] text-muted">Revise antes de confirmar.</p>

      <Card className="mt-8 overflow-hidden">
        <div className="border-b border-line bg-primary-soft/40 px-6 py-5">
          <p className="font-display text-[2rem] leading-none">
            {start.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">
            <span className="flex items-center gap-1.5">
              <Clock size={13} />
              início às{' '}
              {start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ·{' '}
              {formatDuration(slot.totalDuration)}
            </span>
            {branch ? (
              <span className="flex items-center gap-1.5">
                <MapPin size={13} />
                {branch.name}
              </span>
            ) : null}
          </p>
        </div>

        <div className="p-6">
          <Itinerary slot={slot} />

          <div className="mt-6 flex items-baseline justify-between border-t border-line pt-5">
            <span className="text-[14px] text-muted">Total estimado</span>
            <span className="font-display text-3xl">
              {hasVariablePrice ? 'a partir de ' : ''}
              {formatCurrency(slot.totalPrice)}
            </span>
          </div>
          {hasVariablePrice ? (
            <p className="mt-2 text-[12.5px] text-muted">
              Algum serviço escolhido tem valor variável. O valor final é confirmado no atendimento.
            </p>
          ) : null}
        </div>
      </Card>

      {!isReschedule ? (
        <div className="mt-6">
          <Field
            label="Quer avisar algo à equipe?"
            hint="opcional"
          >
            <Textarea
              value={notes}
              onChange={(event) => onNotes(event.target.value)}
              maxLength={500}
              placeholder="Ex.: tenho um evento às 20h, preciso sair no horário."
            />
          </Field>
        </div>
      ) : null}

      {!isAuthenticated ? (
        <Notice tone="accent" className="mt-6" title="Falta só entrar">
          Crie sua conta ou entre para confirmar. Assim o horário fica guardado e você recebe o
          lembrete.{' '}
          <Link href="/cadastrar?redirect=/agendar" className="underline underline-offset-2">
            Criar conta
          </Link>
        </Notice>
      ) : null}

      <Notice tone="neutral" className="mt-6">
        {cancellationText} O pagamento é feito no estúdio.
      </Notice>
    </div>
  );
}

/** Roteiro: a forma como a cliente lê uma reserva com vários serviços (seção 66). */
function Itinerary({ slot }: { slot: SlotDTO }) {
  return (
    <ul className="divide-y divide-line/70">
      {slot.items.map((item, index) => (
        <li key={`${item.serviceId}-${index}`} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
          <span className="w-12 shrink-0 font-display text-lg tabular-nums text-ink/80">
            {new Date(item.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14.5px] font-medium">{item.serviceName}</span>
            <span className="mt-0.5 block text-[12.5px] text-muted">
              {item.professionalName} · {formatDuration(item.duration)}
            </span>
          </span>
          <span className="shrink-0 text-[13.5px] text-muted">{formatCurrency(item.price)}</span>
        </li>
      ))}
    </ul>
  );
}

/* ── SUCESSO ────────────────────────────────────────────────────────────────── */

function BookingSuccess({
  result,
  slot,
  isReschedule,
}: {
  result: { code: string; appointmentId: string };
  slot: SlotDTO | null;
  isReschedule: boolean;
}) {
  return (
    <Container size="narrow" className="py-16 sm:py-24">
      <div className="animate-rise text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-contrast">
          <Check size={24} strokeWidth={1.8} />
        </span>
        <h1 className="mt-7 font-display text-[2.6rem] leading-none">
          {isReschedule ? 'Horário remarcado' : 'Agendamento confirmado'}
        </h1>
        <p className="mt-3 text-[15px] text-muted">
          Seu código é <span className="font-medium tracking-wider text-ink">{result.code}</span>.
          Guardamos tudo na sua conta e enviamos um lembrete antes.
        </p>
      </div>

      {slot ? (
        <Card className="mt-10 p-6">
          <p className="eyebrow mb-4">Seu roteiro</p>
          <Itinerary slot={slot} />
        </Card>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button href={`/minha-conta/agendamentos/${result.appointmentId}`} size="lg">
          Ver meu agendamento
        </Button>
        <Button href="/" variant="secondary" size="lg">
          Voltar ao início
        </Button>
      </div>
    </Container>
  );
}
