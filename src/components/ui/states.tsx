import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button, Card, Skeleton } from './primitives';

/**
 * Todos os estados de tela em um só lugar (seção 88).
 * Nenhum deles expõe erro técnico à cliente — a mensagem é sempre humana e
 * vem com uma saída.
 */

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-line bg-surface/60 text-center',
        compact ? 'px-6 py-10' : 'px-6 py-16',
        className,
      )}
    >
      {icon ? (
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-ink/50">
          {icon}
        </span>
      ) : null}
      <p className="font-display text-xl">{title}</p>
      {description ? (
        <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = 'Algo não saiu como esperado',
  description = 'Tente novamente em instantes. Se continuar, fale com a equipe pelo WhatsApp.',
  action,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('p-8 text-center', className)}>
      <p className="font-display text-2xl">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-muted">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </Card>
  );
}

export function LoadingState({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted">
      <Spinner />
      <span className="text-[13px]">{label}</span>
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent align-[-2px]',
        className,
      )}
      role="status"
      aria-label="Carregando"
    />
  );
}

/** Esqueleto de grade — usado nos `loading.tsx` das rotas mais pesadas. */
export function CardGridSkeleton({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid gap-5 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="surface-card overflow-hidden">
          <Skeleton className="aspect-[4/3] rounded-none" />
          <div className="space-y-2.5 p-5">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="surface-card flex items-center gap-4 p-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Aviso inline para regras de negócio e políticas do estúdio. */
export function Notice({
  tone = 'neutral',
  title,
  children,
  className,
}: {
  tone?: 'neutral' | 'accent' | 'warning' | 'danger' | 'success';
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    neutral: 'bg-primary-soft border-line text-ink/80',
    accent: 'bg-accent-soft border-accent/25 text-ink',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    danger: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  } as const;

  return (
    <div className={cn('rounded-md border px-4 py-3 text-[13px] leading-relaxed', tones[tone], className)}>
      {title ? <p className="mb-0.5 font-medium">{title}</p> : null}
      {children}
    </div>
  );
}

export function ForbiddenState() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-5">
      <div className="max-w-md text-center">
        <p className="eyebrow mb-3">Acesso restrito</p>
        <h1 className="font-display text-4xl">Esta área não é sua</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Sua conta não tem permissão para ver esta parte do estúdio. Se acha que é um engano, fale
          com a gestão.
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <Button href="/" variant="secondary">
            Voltar ao início
          </Button>
          <Button href="/entrar">Entrar com outra conta</Button>
        </div>
      </div>
    </div>
  );
}
