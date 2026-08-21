'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Input } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';

/** Navegação de data compartilhada pela agenda da profissional e da gestão. */
export function AgendaDateNav({
  dateKey,
  views,
  view,
}: {
  dateKey: string;
  views?: { id: string; label: string }[];
  view?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function navigate(next: Record<string, string>) {
    const query = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) query.set(key, value);
    router.push(`${pathname}?${query.toString()}`);
  }

  function shift(days: number) {
    const date = new Date(`${dateKey}T12:00:00`);
    date.setDate(date.getDate() + days);
    navigate({ data: date.toISOString().slice(0, 10) });
  }

  const today = new Date().toISOString().slice(0, 10);
  const step = view === 'semana' ? 7 : 1;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => shift(-step)}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-line transition-colors hover:bg-primary-soft"
          aria-label="Período anterior"
        >
          <ChevronLeft size={17} />
        </button>
        <button
          type="button"
          onClick={() => shift(step)}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-line transition-colors hover:bg-primary-soft"
          aria-label="Próximo período"
        >
          <ChevronRight size={17} />
        </button>
      </div>

      <Input
        type="date"
        value={dateKey}
        onChange={(event) => navigate({ data: event.target.value })}
        className="h-10 w-auto"
      />

      {dateKey !== today ? (
        <Button variant="secondary" size="sm" onClick={() => navigate({ data: today })}>
          Hoje
        </Button>
      ) : null}

      {views ? (
        <div className="ml-auto flex rounded-md border border-line p-0.5">
          {views.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate({ vista: item.id })}
              className={cn(
                'rounded-[6px] px-3 py-1.5 text-[12.5px] transition-colors',
                view === item.id ? 'bg-primary text-primary-contrast' : 'text-muted hover:text-ink',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
