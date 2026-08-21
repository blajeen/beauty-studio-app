'use client';

import * as React from 'react';
import { cn, parseList, unique } from '@/lib/utils';
import { SmartImage } from '@/components/ui/media';
import { Lightbox } from '@/components/ui/overlay';
import { Avatar } from '@/components/ui/primitives';
import { EmptyState } from '@/components/ui/states';

export type GalleryItem = {
  id: string;
  title: string;
  imageUrl: string;
  description?: string | null;
  technique?: string | null;
  styleTags?: string | null;
  professional?: { id: string; displayName: string; avatarUrl: string | null } | null;
  category?: { name: string; slug: string } | null;
};

/**
 * Galeria com filtros por estilo (seção 60). No celular a grade é de duas
 * colunas com toque generoso; o lightbox navega por teclado e por botão.
 */
export function PortfolioGallery({
  items,
  columns = 4,
  showFilters = false,
  professionals,
}: {
  items: GalleryItem[];
  columns?: 2 | 3 | 4;
  showFilters?: boolean;
  professionals?: { id: string; displayName: string; avatarUrl: string | null }[];
}) {
  const [style, setStyle] = React.useState<string | null>(null);
  const [professionalId, setProfessionalId] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState<number | null>(null);

  /*
   * Estilos ordenados por frequência e limitados: uma faixa de filtros com
   * dezessete opções vira ruído antes da primeira foto. O filtro ativo entra
   * sempre, mesmo fora do corte.
   */
  const styles = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      for (const tag of parseList(item.styleTags)) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    const ranked = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'))
      .map(([tag]) => tag);
    const top = ranked.slice(0, 8);
    return unique(style && !top.includes(style) ? [...top, style] : top);
  }, [items, style]);

  const filtered = React.useMemo(
    () =>
      items.filter((item) => {
        if (style && !parseList(item.styleTags).includes(style)) return false;
        if (professionalId && item.professional?.id !== professionalId) return false;
        return true;
      }),
    [items, style, professionalId],
  );

  const gridClass =
    columns === 2
      ? 'grid-cols-2'
      : columns === 3
        ? 'grid-cols-2 sm:grid-cols-3'
        : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';

  return (
    <div>
      {showFilters && (styles.length > 1 || (professionals?.length ?? 0) > 1) ? (
        <div className="mb-8 space-y-4">
          {styles.length > 1 ? (
            <div className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0">
              <FilterChip active={style === null} onClick={() => setStyle(null)}>
                Tudo
              </FilterChip>
              {styles.map((item) => (
                <FilterChip key={item} active={style === item} onClick={() => setStyle(item)}>
                  {item}
                </FilterChip>
              ))}
            </div>
          ) : null}

          {professionals && professionals.length > 1 ? (
            <div className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0">
              <FilterChip active={professionalId === null} onClick={() => setProfessionalId(null)}>
                Todas as profissionais
              </FilterChip>
              {professionals.map((professional) => (
                <FilterChip
                  key={professional.id}
                  active={professionalId === professional.id}
                  onClick={() => setProfessionalId(professional.id)}
                >
                  <Avatar
                    name={professional.displayName}
                    src={professional.avatarUrl}
                    size="xs"
                    className="-ml-1 h-5 w-5 text-[9px]"
                  />
                  {professional.displayName.split(' ')[0]}
                </FilterChip>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          compact
          title="Nada por aqui ainda"
          description="Tente outro filtro — ou veja todos os trabalhos."
        />
      ) : (
        <div className={cn('stagger grid gap-3 sm:gap-4', gridClass)}>
          {filtered.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setOpen(index)}
              className="group block text-left"
            >
              <SmartImage
                src={item.imageUrl}
                alt={item.title}
                seed={item.title}
                ratio="square"
                className="rounded-md"
                imgClassName="group-hover:scale-[1.05]"
              />
              <p className="mt-2.5 truncate text-[13px] font-medium text-ink">{item.title}</p>
              {item.professional ? (
                <p className="truncate text-[11.5px] text-muted">{item.professional.displayName}</p>
              ) : null}
            </button>
          ))}
        </div>
      )}

      <Lightbox
        items={filtered.map((item) => ({
          imageUrl: item.imageUrl,
          title: item.title,
          caption: [item.professional?.displayName, item.technique, item.styleTags]
            .filter(Boolean)
            .join(' · '),
        }))}
        index={open}
        onClose={() => setOpen(null)}
        onNavigate={setOpen}
      />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-[13px] transition-colors',
        active
          ? 'border-ink bg-primary text-primary-contrast'
          : 'border-line bg-surface text-ink/70 hover:border-ink/35 hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
