'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';

const FILTERS = [
  { id: '', label: 'Todas' },
  { id: 'novas', label: 'Novas' },
  { id: 'vip', label: 'VIP' },
  { id: 'clube', label: 'Beauty Club' },
];

export function CustomerSearch({
  defaultValue,
  filter,
}: {
  defaultValue: string;
  filter: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = React.useState(defaultValue);

  // Busca com atraso curto: evita uma navegação por tecla digitada.
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (value === defaultValue) return;
      const query = new URLSearchParams();
      if (value) query.set('q', value);
      if (filter) query.set('filtro', filter);
      router.push(`${pathname}?${query.toString()}`);
    }, 350);
    return () => clearTimeout(timer);
  }, [value, defaultValue, filter, pathname, router]);

  function setFilter(next: string) {
    const query = new URLSearchParams();
    if (value) query.set('q', value);
    if (next) query.set('filtro', next);
    router.push(`${pathname}?${query.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-64 flex-1">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
        />
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Buscar por nome, telefone ou e-mail"
          className="pl-10"
          aria-label="Buscar clientes"
        />
      </div>

      <div className="flex gap-1.5">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              'rounded-full border px-3.5 py-2 text-[12.5px] transition-colors',
              filter === item.id
                ? 'border-ink bg-primary text-primary-contrast'
                : 'border-line text-muted hover:border-ink/35 hover:text-ink',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
