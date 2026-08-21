'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Fotografia é metade da percepção de sofisticação (seção 85) — mas a imagem
 * pode falhar. Aqui ela nunca deixa um retângulo quebrado: cai num gradiente
 * derivado da própria marca, com o monograma do título.
 */
export function SmartImage({
  src,
  alt,
  className,
  imgClassName,
  ratio = 'auto',
  priority,
  seed,
  overlay,
  children,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  ratio?: 'auto' | 'square' | 'portrait' | 'landscape' | 'wide' | 'tall';
  priority?: boolean;
  seed?: string;
  overlay?: boolean;
  children?: React.ReactNode;
}) {
  const [failed, setFailed] = React.useState(false);
  const showImage = Boolean(src) && !failed;
  const label = (seed ?? alt ?? '').trim().charAt(0).toUpperCase() || '·';

  const ratios: Record<string, string> = {
    auto: '',
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
    wide: 'aspect-[16/9]',
    tall: 'aspect-[2/3]',
  };

  return (
    <div className={cn('relative overflow-hidden bg-primary-soft', ratios[ratio], className)}>
      {showImage ? (
        // next/image exigiria domínios fixos; o catálogo aponta para URLs
        // configuráveis pelo painel, então servimos a tag nativa com fallback.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src as string}
          alt={alt}
          onError={() => setFailed(true)}
          loading={priority ? 'eager' : 'lazy'}
          className={cn(
            'h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
            imgClassName,
          )}
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center"
          style={{
            background:
              'linear-gradient(135deg, var(--brand-accent-soft) 0%, var(--brand-primary-soft) 60%, var(--brand-bg) 100%)',
          }}
          aria-label={alt}
          role="img"
        >
          <span className="font-display text-4xl text-ink/20">{label}</span>
        </div>
      )}
      {overlay ? <div className="photo-scrim absolute inset-0" aria-hidden="true" /> : null}
      {children}
    </div>
  );
}
