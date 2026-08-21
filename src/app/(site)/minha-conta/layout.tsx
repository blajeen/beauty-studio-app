import Link from 'next/link';
import { requireCustomer } from '@/lib/auth/guards';
import { getBrand } from '@/lib/brand/server';
import { Container } from '@/components/ui/primitives';
import { AccountNav } from './account-nav';
import { firstName } from '@/lib/utils';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const [user, brand] = await Promise.all([requireCustomer(), getBrand()]);

  const links = [
    { href: '/minha-conta', label: 'Visão geral', exact: true },
    { href: '/minha-conta/agendamentos', label: 'Meus horários' },
    { href: '/minha-conta/historico', label: 'Histórico' },
    ...(brand.features.inspiration
      ? [{ href: '/minha-conta/inspiracoes', label: 'Inspirações' }]
      : []),
    ...(brand.features.packages || brand.features.beautyClub
      ? [{ href: '/minha-conta/pacotes', label: 'Pacotes e clube' }]
      : []),
    { href: '/minha-conta/perfil', label: 'Meu perfil' },
  ];

  return (
    <Container size="wide" className="py-10 sm:py-14">
      <header className="mb-8">
        <p className="eyebrow">Minha conta</p>
        <h1 className="mt-3 font-display text-[2.6rem] leading-none sm:text-[3.2rem]">
          Olá, {firstName(user.name)}
        </h1>
      </header>

      <AccountNav links={links} />

      <div className="mt-8">{children}</div>

      <p className="mt-16 text-[12.5px] text-muted">
        Precisa de algo que não está aqui?{' '}
        <Link href="/sobre#faq" className="underline underline-offset-4">
          Veja as perguntas frequentes
        </Link>
        .
      </p>
    </Container>
  );
}
