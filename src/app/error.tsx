'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/primitives';

/**
 * Limite de erro global. A cliente nunca vê stack trace nem mensagem técnica
 * (seção 88) — vê uma saída e um caminho para falar com o estúdio.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[beauty-studio]', error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center px-5">
      <div className="max-w-md text-center">
        <p className="eyebrow">Algo saiu do lugar</p>
        <h1 className="mt-4 font-display text-[2.6rem] leading-none">
          Não conseguimos carregar esta página
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          Nada foi perdido. Tente novamente em instantes — se continuar, fale com a equipe e nós
          resolvemos por aqui.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>Tentar novamente</Button>
          <Button href="/" variant="secondary">
            Voltar ao início
          </Button>
        </div>
        {error.digest ? (
          <p className="mt-6 font-mono text-[11px] text-muted/70">Referência: {error.digest}</p>
        ) : null}
      </div>
    </div>
  );
}
