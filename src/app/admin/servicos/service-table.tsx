'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { Badge, Button, Card, Field, Input, Select, Textarea } from '@/components/ui/primitives';
import { Notice, Spinner } from '@/components/ui/states';
import { Modal, useToast } from '@/components/ui/overlay';
import { formatCurrency, formatPriceShort } from '@/lib/utils';
import { formatDuration } from '@/lib/datetime';
import { PRICE_TYPES, type PriceType } from '@/lib/constants';
import { updateService } from '@/app/studio/actions';

type Service = {
  id: string;
  name: string;
  shortDescription: string | null;
  price: number;
  priceType: string;
  duration: number;
  bufferAfter: number;
  returnIntervalDays: number | null;
  isActive: boolean;
  isFeatured: boolean;
  professionals: number;
  bookings: number;
};

const PRICE_TYPE_LABEL: Record<PriceType, string> = {
  FIXED: 'Valor fechado',
  FROM: 'A partir de',
  CUSTOM: 'Sob orçamento',
  CONSULTATION: 'Mediante avaliação',
};

/**
 * "Manicure agora custa R$ 40" resolvido sem código (seção 57).
 * O preço é editado em reais e convertido para centavos na gravação.
 */
export function ServiceTable({
  categories,
}: {
  categories: { id: string; name: string; services: Service[] }[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = React.useState<Service | null>(null);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    name: '',
    shortDescription: '',
    priceReais: '0',
    priceType: 'FIXED' as PriceType,
    duration: 60,
    bufferAfter: 10,
    returnIntervalDays: 0,
    isActive: true,
    isFeatured: false,
  });

  function open(service: Service) {
    setEditing(service);
    setError(null);
    setForm({
      name: service.name,
      shortDescription: service.shortDescription ?? '',
      priceReais: (service.price / 100).toFixed(2).replace('.', ','),
      priceType: service.priceType as PriceType,
      duration: service.duration,
      bufferAfter: service.bufferAfter,
      returnIntervalDays: service.returnIntervalDays ?? 0,
      isActive: service.isActive,
      isFeatured: service.isFeatured,
    });
  }

  async function save() {
    if (!editing) return;
    const cents = Math.round(Number(form.priceReais.replace(/\./g, '').replace(',', '.')) * 100);
    if (Number.isNaN(cents) || cents < 0) {
      setError('Informe um preço válido, como 40 ou 149,90.');
      return;
    }

    setPending(true);
    setError(null);
    const result = await updateService({
      id: editing.id,
      name: form.name,
      shortDescription: form.shortDescription,
      price: cents,
      priceType: form.priceType,
      duration: form.duration,
      bufferAfter: form.bufferAfter,
      returnIntervalDays: form.returnIntervalDays,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
    });
    setPending(false);

    if (!result.ok) {
      setError(result.error ?? 'Não foi possível salvar.');
      return;
    }
    setEditing(null);
    toast('Serviço atualizado.', 'success');
    router.refresh();
  }

  return (
    <div className="space-y-10">
      {categories.map((category) => (
        <section key={category.id}>
          <h2 className="mb-4 font-display text-2xl">{category.name}</h2>
          <Card className="overflow-hidden">
            <div className="divide-y divide-line">
              {category.services.map((service) => (
                <div
                  key={service.id}
                  className="flex flex-wrap items-center gap-4 px-5 py-3.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline gap-x-2 text-[14.5px] font-medium">
                      {service.name}
                      {!service.isActive ? <Badge tone="danger">Inativo</Badge> : null}
                      {service.isFeatured ? <Badge tone="accent">Destaque</Badge> : null}
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted">
                      {formatDuration(service.duration)}
                      {service.bufferAfter ? ` + ${service.bufferAfter} min de preparo` : ''} ·{' '}
                      {service.professionals} profissionais · {service.bookings} agendamentos
                      {service.returnIntervalDays
                        ? ` · retorno em ${service.returnIntervalDays} dias`
                        : ''}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-[14px] font-medium">
                      {formatPriceShort(service.price, service.priceType)}
                    </p>
                    <p className="text-[11.5px] text-muted">
                      {PRICE_TYPE_LABEL[service.priceType as PriceType]}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => open(service)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line transition-colors hover:bg-primary-soft"
                    aria-label={`Editar ${service.name}`}
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </section>
      ))}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.name ?? ''}
        description="As alterações valem para novos agendamentos."
        footer={
          <>
            <Button variant="secondary" fullWidth onClick={() => setEditing(null)} disabled={pending}>
              Cancelar
            </Button>
            <Button fullWidth onClick={save} disabled={pending}>
              {pending ? <Spinner /> : null}
              Salvar
            </Button>
          </>
        }
      >
        {error ? (
          <Notice tone="danger" className="mb-4">
            {error}
          </Notice>
        ) : null}

        <div className="space-y-4">
          <Field label="Nome" required>
            <Input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </Field>

          <Field label="Descrição curta" hint="aparece no catálogo">
            <Textarea
              value={form.shortDescription}
              onChange={(event) => setForm({ ...form, shortDescription: event.target.value })}
              maxLength={220}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Preço" hint="em reais" required>
              <Input
                value={form.priceReais}
                onChange={(event) => setForm({ ...form, priceReais: event.target.value })}
                inputMode="decimal"
                placeholder="40,00"
              />
            </Field>
            <Field label="Tipo de preço">
              <Select
                value={form.priceType}
                onChange={(event) =>
                  setForm({ ...form, priceType: event.target.value as PriceType })
                }
              >
                {PRICE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {PRICE_TYPE_LABEL[type]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Duração" hint="min">
              <Input
                type="number"
                min={5}
                max={600}
                value={form.duration}
                onChange={(event) => setForm({ ...form, duration: Number(event.target.value) })}
              />
            </Field>
            <Field label="Preparo depois" hint="min">
              <Input
                type="number"
                min={0}
                max={120}
                value={form.bufferAfter}
                onChange={(event) => setForm({ ...form, bufferAfter: Number(event.target.value) })}
              />
            </Field>
            <Field label="Retorno" hint="dias">
              <Input
                type="number"
                min={0}
                max={365}
                value={form.returnIntervalDays}
                onChange={(event) =>
                  setForm({ ...form, returnIntervalDays: Number(event.target.value) })
                }
              />
            </Field>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 text-[13.5px]">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
                className="h-4 w-4 accent-[var(--brand-primary)]"
              />
              Ativo no catálogo
            </label>
            <label className="flex items-center gap-2 text-[13.5px]">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) => setForm({ ...form, isFeatured: event.target.checked })}
                className="h-4 w-4 accent-[var(--brand-primary)]"
              />
              Destacar na Home
            </label>
          </div>

          <Notice tone="neutral">
            Preparo depois é o tempo que a profissional precisa entre uma cliente e outra. Ele ocupa
            a agenda mas não aparece para a cliente. Retorno alimenta o lembrete de recorrência.
          </Notice>
        </div>
      </Modal>
    </div>
  );
}
