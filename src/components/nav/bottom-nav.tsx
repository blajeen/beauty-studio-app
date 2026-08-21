'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sparkles, CalendarPlus, Images, User } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Navegação principal no celular (seção 86). O CTA de agendamento fica no
 * centro, elevado — é a ação que o produto existe para facilitar.
 */
const ITEMS = [
  { href: '/', label: 'Início', icon: Home, exact: true },
  { href: '/servicos', label: 'Serviços', icon: Sparkles },
  { href: '/agendar', label: 'Agendar', icon: CalendarPlus, primary: true },
  { href: '/portfolio', label: 'Portfólio', icon: Images },
  { href: '/minha-conta', label: 'Conta', icon: User },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/95 backdrop-blur-md lg:hidden"
      aria-label="Navegação"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2">
        {ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;

          if (item.primary) {
            return (
              <li key={item.href} className="flex flex-1 justify-center">
                <Link
                  href={item.href}
                  className="-mt-5 flex flex-col items-center gap-1"
                  aria-label={item.label}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-contrast shadow-[0_6px_20px_rgba(0,0,0,0.16)] transition-transform active:scale-95">
                    <Icon size={20} strokeWidth={1.6} />
                  </span>
                  <span className="text-[10px] text-ink/70">{item.label}</span>
                </Link>
              </li>
            );
          }

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-1 py-2.5 transition-colors',
                  active ? 'text-ink' : 'text-muted',
                )}
              >
                <Icon size={19} strokeWidth={active ? 1.9 : 1.5} />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
