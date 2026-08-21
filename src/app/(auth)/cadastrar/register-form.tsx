'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { register, type AuthState } from '../actions';
import { Button, Field, Input } from '@/components/ui/primitives';
import { Notice, Spinner } from '@/components/ui/states';

export function RegisterForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction] = useActionState<AuthState, FormData>(register, {});

  return (
    <form action={formAction} className="mt-9 space-y-4">
      {redirectTo ? <input type="hidden" name="redirect" value={redirectTo} /> : null}

      {state.error ? <Notice tone="danger">{state.error}</Notice> : null}

      <Field label="Nome completo">
        <Input name="name" autoComplete="name" placeholder="Como quer ser chamada" required />
      </Field>

      <Field label="Celular" hint="com DDD">
        <Input
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(11) 99999-0000"
          required
        />
      </Field>

      <Field label="E-mail">
        <Input name="email" type="email" autoComplete="email" placeholder="voce@email.com" required />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Senha" hint="mín. 8">
          <Input name="password" type="password" autoComplete="new-password" required />
        </Field>
        <Field label="Confirmar senha">
          <Input name="confirm" type="password" autoComplete="new-password" required />
        </Field>
      </div>

      <SubmitButton />

      <p className="pt-1 text-[12px] leading-relaxed text-muted">
        Ao criar a conta você concorda em receber lembretes dos seus horários. Fotos de atendimento
        só aparecem no portfólio com a sua autorização.
      </p>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" fullWidth disabled={pending} className="mt-2">
      {pending ? <Spinner /> : null}
      {pending ? 'Criando conta…' : 'Criar conta'}
    </Button>
  );
}
