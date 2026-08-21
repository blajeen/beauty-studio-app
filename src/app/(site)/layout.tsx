import { getBrand } from '@/lib/brand/server';
import { getCurrentUser } from '@/lib/auth/session';
import { ROLE_HOME } from '@/lib/constants';
import { SiteHeader, type NavLink } from '@/components/nav/site-header';
import { BottomNavigation } from '@/components/nav/bottom-nav';
import { SiteFooter } from '@/components/site-footer';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { firstName } from '@/lib/utils';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [brand, user] = await Promise.all([getBrand(), getCurrentUser()]);

  const links: NavLink[] = [
    { href: '/servicos', label: 'Serviços' },
    { href: '/profissionais', label: 'Profissionais' },
    ...(brand.features.portfolio ? [{ href: '/portfolio', label: 'Portfólio' }] : []),
    ...(brand.features.packages ? [{ href: '/pacotes', label: 'Pacotes' }] : []),
    ...(brand.features.beautyClub ? [{ href: '/beauty-club', label: 'Beauty Club' }] : []),
    ...(brand.features.events ? [{ href: '/noivas', label: 'Noivas' }] : []),
    { href: '/sobre', label: 'O estúdio' },
  ];

  const account = user
    ? {
        name: firstName(user.name),
        href: user.role === 'CUSTOMER' ? '/minha-conta' : ROLE_HOME[user.role],
      }
    : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader links={links} account={account} />
      <main className="flex-1 pb-24 lg:pb-0">{children}</main>
      <SiteFooter />
      <BottomNavigation />
      <WhatsAppButton />
    </div>
  );
}
