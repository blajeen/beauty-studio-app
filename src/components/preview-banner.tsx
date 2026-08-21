'use client';

import { useTransition } from 'react';
import { Eye } from 'lucide-react';
import { exitPreview } from '@/app/studio/actions';

/**
 * Faixa exibida quando o Product Manager navega o site com o rascunho ligado
 * (seção 56). Deixa explícito que aquilo ainda não está publicado.
 */
export function PreviewBanner() {
  const [pending, start] = useTransition();

  return (
    <div className="sticky top-0 z-[90] flex items-center justify-center gap-3 bg-secondary px-4 py-2 text-[12px] text-white">
      <Eye size={14} />
      <span>Você está vendo o rascunho da configuração — ainda não publicado.</span>
      <button
        type="button"
        onClick={() => start(() => { void exitPreview(); })}
        disabled={pending}
        className="rounded-full border border-white/30 px-3 py-0.5 transition-colors hover:bg-white/10 disabled:opacity-50"
      >
        Sair da pré-visualização
      </button>
    </div>
  );
}
