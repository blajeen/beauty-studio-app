import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { ROLE_HOME } from '@/lib/constants';
import { RegisterForm } from './register-form';

export const metadata: Metadata = { title: 'Criar conta' };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role]);

  const params = await searchParams;

  return (
    <div>
      <h1 className="font-display text-[2.6rem] leading-none">Criar conta</h1>
      <p className="mt-3 text-[14px] leading-relaxed text-muted">
        Leva um minuto. Depois disso, seus horários, seu histórico e suas preferências ficam
        guardados.
      </p>

      <RegisterForm redirectTo={params.redirect} />

      <p className="mt-8 text-[13.5px] text-muted">
        Já é cliente?{' '}
        <Link href="/entrar" className="text-ink underline underline-offset-4">
          Entrar
        </Link>
      </p>
    </div>
  );
}
