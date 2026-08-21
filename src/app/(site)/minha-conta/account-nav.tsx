'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/** Navegação interna da conta — trilho rolável no celular, linha no desktop. */
export function AccountNav({
  links,
}: {
  links: { href: string; label: string; exact?: boolean }[];
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Seções da conta"
      className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto border-b border-line px-5 sm:mx-0 sm:px-0"
    >
      {links.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative shrink-0 whitespace-nowrap px-1 pb-3.5 pt-1 text-[13.5px] transition-colors',
              active ? 'text-ink' : 'text-muted hover:text-ink',
            )}
          >
            {link.label}
            {active ? <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}
