'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBrand } from '@/components/brand-provider';
import { Button } from '@/components/ui/primitives';
import { Logo } from '@/components/logo';
import { WhatsAppButton } from '@/components/whatsapp-button';

export type NavLink = { href: string; label: string };

export function SiteHeader({
  links,
  account,
}: {
  links: NavLink[];
  account: { name: string; href: string } | null;
}) {
  const brand = useBrand();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => setOpen(false), [pathname]);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300',
        scrolled || open
          ? 'border-b border-line bg-canvas/85 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 px-5 sm:h-[72px] sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label={brand.name}>
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navegação principal">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'relative text-[13.5px] tracking-[0.01em] text-ink/70 transition-colors hover:text-ink',
                pathname.startsWith(link.href) && link.href !== '/' && 'text-ink',
              )}
            >
              {link.label}
              {pathname.startsWith(link.href) && link.href !== '/' ? (
                <span className="absolute -bottom-1.5 left-0 h-px w-full bg-accent" />
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          {account ? (
            <Link
              href={account.href}
              className="hidden items-center gap-2 rounded-md px-3 py-2 text-[13px] text-ink/70 transition-colors hover:bg-primary-soft hover:text-ink sm:flex"
            >
              <User size={15} />
              {account.name}
            </Link>
          ) : (
            <Link
              href="/entrar"
              className="hidden rounded-md px-3 py-2 text-[13px] text-ink/70 transition-colors hover:bg-primary-soft hover:text-ink sm:block"
            >
              Entrar
            </Link>
          )}
          <Button href="/agendar" size="sm" className="hidden sm:inline-flex">
            Agendar
          </Button>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="-mr-2 p-2 text-ink lg:hidden"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="animate-fade border-t border-line bg-canvas lg:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-5 py-3 sm:px-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border-b border-line/60 py-3.5 font-display text-2xl last:border-0"
              >
                {link.label}
              </Link>
            ))}
            <div className="space-y-3 py-4">
              <div className="flex gap-3">
                <Button href="/agendar" fullWidth>
                  Agendar horário
                </Button>
                <Button href={account?.href ?? '/entrar'} variant="secondary" fullWidth>
                  {account ? 'Minha conta' : 'Entrar'}
                </Button>
              </div>
              <WhatsAppButton variant="inline" className="w-full" />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
