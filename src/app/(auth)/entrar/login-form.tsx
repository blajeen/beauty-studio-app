'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { login, type AuthState } from '../actions';
import { Button, Field, Input } from '@/components/ui/primitives';
import { Notice, Spinner } from '@/components/ui/states';

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction] = useActionState<AuthState, FormData>(login, {});

  return (
    <form action={formAction} className="mt-9 space-y-4">
      {redirectTo ? <input type="hidden" name="redirect" value={redirectTo} /> : null}

      {state.error ? <Notice tone="danger">{state.error}</Notice> : null}

      <Field label="E-mail">
        <Input
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="voce@email.com"
          required
        />
      </Field>

      <Field label="Senha">
        <Input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
      </Field>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" fullWidth disabled={pending} className="mt-2">
      {pending ? <Spinner /> : null}
      {pending ? 'Entrando…' : 'Entrar'}
    </Button>
  );
}
