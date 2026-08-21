'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/primitives';
import { Logo } from '@/components/logo';
import { logout } from '@/app/(auth)/actions';

export type ShellLink = {
  href: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
  badge?: number;
};

/**
 * Casca das áreas internas (profissional, gestão e produto).
 * Desktop: navegação lateral fixa. Celular: cabeçalho + gaveta — a profissional
 * usa o app em pé, entre um atendimento e outro.
 */
export function AppShell({
  links,
  user,
  areaLabel,
  children,
  footer,
}: {
  links: ShellLink[];
  user: { name: string; role: string; avatarUrl?: string | null };
  areaLabel: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => setOpen(false), [pathname]);

  const nav = (
    <nav className="space-y-1" aria-label={areaLabel}>
      {links.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2.5 text-[13.5px] transition-colors',
              active ? 'bg-primary text-primary-contrast' : 'text-ink/75 hover:bg-primary-soft',
            )}
          >
            <span className={cn('shrink-0', active ? 'opacity-90' : 'text-muted')}>{link.icon}</span>
            <span className="flex-1 truncate">{link.label}</span>
            {link.badge ? (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10.5px] font-medium',
                  active ? 'bg-white/15' : 'bg-accent-soft text-ink',
                )}
              >
                {link.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[264px_1fr]">
      {/* Lateral — desktop */}
      <aside className="hidden border-r border-line bg-surface lg:flex lg:h-dvh lg:flex-col lg:sticky lg:top-0">
        <div className="border-b border-line px-5 py-5">
          <Link href="/">
            <Logo />
          </Link>
          <p className="eyebrow mt-4">{areaLabel}</p>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">{nav}</div>
        <div className="border-t border-line p-3">
          <div className="flex items-center gap-3 rounded-md px-3 py-2.5">
            <Avatar name={user.name} src={user.avatarUrl} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">{user.name}</p>
              <p className="truncate text-[11.5px] text-muted">{user.role}</p>
            </div>
          </div>
          {footer}
          <LogoutLink />
        </div>
      </aside>

      {/* Cabeçalho — celular */}
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-line bg-canvas/95 px-5 backdrop-blur-md lg:hidden">
          <Link href="/">
            <Logo variant="compact" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="eyebrow">{areaLabel}</span>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="-mr-2 p-2"
              aria-label={open ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={open}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </header>

        {open ? (
          <div className="animate-fade sticky top-16 z-40 border-b border-line bg-canvas px-4 py-4 lg:hidden">
            {nav}
            <div className="mt-3 border-t border-line pt-3">
              <LogoutLink />
            </div>
          </div>
        ) : null}

        <main className="min-w-0 flex-1 px-5 py-6 sm:px-8 sm:py-10">{children}</main>
      </div>
    </div>
  );
}

function LogoutLink() {
  const [pending, start] = React.useTransition();
  return (
    <button
      type="button"
      onClick={() =>
        start(() => {
          void logout();
        })
      }
      disabled={pending}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[13px] text-muted transition-colors hover:bg-primary-soft hover:text-ink disabled:opacity-50"
    >
      <LogOut size={16} />
      Sair
    </button>
  );
}
