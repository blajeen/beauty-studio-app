import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { ROLE_HOME } from '@/lib/constants';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Entrar' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role]);

  const params = await searchParams;

  return (
    <div>
      <h1 className="font-display text-[2.6rem] leading-none">Entrar</h1>
      <p className="mt-3 text-[14px] leading-relaxed text-muted">
        Acesse para ver seus horários, seu histórico e agendar em dois toques.
      </p>

      <LoginForm redirectTo={params.redirect} />

      <p className="mt-8 text-[13.5px] text-muted">
        Ainda não tem conta?{' '}
        <Link href="/cadastrar" className="text-ink underline underline-offset-4">
          Criar agora
        </Link>
      </p>

      <DemoAccounts />
    </div>
  );
}

/**
 * Instalação de demonstração: os acessos ficam à vista para quem está avaliando
 * o produto. Em produção esta seção sai com a remoção do seed.
 */
function DemoAccounts() {
  const accounts = [
    { role: 'Dona do estúdio', email: 'dona@lumi.studio' },
    { role: 'Profissional', email: 'ana@lumi.studio' },
    { role: 'Cliente', email: 'maria@cliente.com' },
    { role: 'Gestor do produto', email: 'produto@lumi.studio' },
  ];

  return (
    <div className="mt-12 rounded-md border border-dashed border-line p-4">
      <p className="eyebrow mb-3">Acessos de demonstração</p>
      <ul className="space-y-1.5">
        {accounts.map((account) => (
          <li key={account.email} className="flex justify-between gap-4 text-[12.5px]">
            <span className="text-muted">{account.role}</span>
            <span className="font-medium text-ink">{account.email}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 border-t border-line pt-3 text-[12px] text-muted">
        Senha para todos: <span className="font-medium text-ink">lumi1234</span>
      </p>
    </div>
  );
}
