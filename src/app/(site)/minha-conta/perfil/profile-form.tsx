'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Field, Input, Select, Textarea } from '@/components/ui/primitives';
import { Notice, Spinner } from '@/components/ui/states';
import { useToast } from '@/components/ui/overlay';
import { cn } from '@/lib/utils';
import { updateProfile } from '../actions';

type ProfileData = {
  name: string;
  phone: string;
  email: string;
  birthDate: string;
  consentPhotos: boolean;
  consentMarketing: boolean;
  preferredProfessionalId: string;
  notes: string;
};

export function ProfileForm({
  customer,
  professionals,
}: {
  customer: ProfileData;
  professionals: { id: string; displayName: string; title: string | null }[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = React.useState(customer);
  const [pending, setPending] = React.useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    const result = await updateProfile(form);
    setPending(false);
    toast(result.message ?? result.error ?? '', result.ok ? 'success' : 'error');
    if (result.ok) router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card className="p-6">
        <p className="eyebrow mb-5">Seus dados</p>
        <div className="space-y-4">
          <Field label="Nome completo" required>
            <Input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Celular" required>
              <Input
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                inputMode="tel"
                required
              />
            </Field>
            <Field label="Data de nascimento" hint="opcional">
              <Input
                type="date"
                value={form.birthDate}
                onChange={(event) => setForm({ ...form, birthDate: event.target.value })}
              />
            </Field>
          </div>

          <Field label="E-mail" hint="usado para entrar">
            <Input value={form.email} disabled />
          </Field>

          <Field label="Profissional preferida" hint="opcional">
            <Select
              value={form.preferredProfessionalId}
              onChange={(event) =>
                setForm({ ...form, preferredProfessionalId: event.target.value })
              }
            >
              <option value="">Sem preferência</option>
              {professionals.map((professional) => (
                <option key={professional.id} value={professional.id}>
                  {professional.displayName} — {professional.title}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Algo que o estúdio deva saber?" hint="opcional">
            <Textarea
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              maxLength={400}
              placeholder="Alergias, sensibilidades, preferências de horário…"
            />
          </Field>
        </div>
      </Card>

      <Card className="p-6">
        <p className="eyebrow mb-5">Privacidade</p>

        <div className="space-y-3">
          <Toggle
            checked={form.consentPhotos}
            onChange={(value) => setForm({ ...form, consentPhotos: value })}
            title="Autorizo o uso das minhas fotos no portfólio"
            description="Sem isso, as fotos dos seus atendimentos ficam restritas à sua ficha e ao estúdio."
          />
          <Toggle
            checked={form.consentMarketing}
            onChange={(value) => setForm({ ...form, consentMarketing: value })}
            title="Quero receber novidades e lembretes de retorno"
            description="Lembretes dos horários já marcados continuam sendo enviados de qualquer forma."
          />
        </div>

        {!form.consentPhotos && customer.consentPhotos ? (
          <Notice tone="warning" className="mt-5">
            Ao salvar, as suas fotos que hoje aparecem no portfólio público voltam a ficar privadas.
          </Notice>
        ) : null}
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <Spinner /> : null}
          Salvar alterações
        </Button>
      </div>
    </form>
  );
}

/** Interruptor acessível — usa checkbox nativo por baixo. */
function Toggle({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors',
        checked ? 'border-ink/40 bg-primary-soft' : 'border-line',
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
      />
      <span
        className={cn(
          'mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors',
          checked ? 'bg-primary' : 'bg-line',
        )}
        aria-hidden="true"
      >
        <span
          className={cn(
            'h-4 w-4 rounded-full bg-white transition-transform duration-200',
            checked && 'translate-x-4',
          )}
        />
      </span>
      <span>
        <span className="block text-[14px] font-medium">{title}</span>
        <span className="mt-0.5 block text-[12.5px] leading-relaxed text-muted">{description}</span>
      </span>
    </label>
  );
}
