'use client';

import { useBrand } from '@/components/brand-provider';
import { cn } from '@/lib/utils';

/**
 * Assinatura do estúdio. Usa a imagem quando existe; caso contrário compõe
 * monograma + nome, o que mantém a marca apresentável mesmo sem arquivo de logo.
 */
export function Logo({
  variant = 'default',
  className,
}: {
  variant?: 'default' | 'compact' | 'inverse';
  className?: string;
}) {
  const brand = useBrand();

  if (brand.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={brand.logoUrl} alt={brand.name} className={cn('h-8 w-auto', className)} />;
  }

  const inverse = variant === 'inverse';

  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-md font-display text-[17px] leading-none',
          inverse ? 'bg-white/10 text-white' : 'bg-primary text-primary-contrast',
        )}
        aria-hidden="true"
      >
        {brand.monogram}
      </span>
      {variant !== 'compact' ? (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              'font-display text-[19px] tracking-[0.01em]',
              inverse ? 'text-white' : 'text-ink',
            )}
          >
            {brand.name}
          </span>
          <span
            className={cn(
              'mt-0.5 text-[9.5px] uppercase tracking-[0.22em]',
              inverse ? 'text-white/55' : 'text-muted',
            )}
          >
            {brand.tagline}
          </span>
        </span>
      ) : null}
    </span>
  );
}
