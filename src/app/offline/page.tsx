import type { Metadata } from 'next';
import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Sem conexão' };

/**
 * Página servida pelo service worker quando a navegação falha.
 * A agenda depende de dados em tempo real (seção 49), então não fingimos
 * disponibilidade offline — apenas explicamos com clareza.
 */
export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-5">
      <div className="max-w-md text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-ink/50">
          <WifiOff size={22} strokeWidth={1.6} />
        </span>
        <h1 className="mt-6 font-display text-[2.4rem] leading-none">Você está sem conexão</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          Os horários mudam o tempo todo, então preferimos não mostrar uma agenda desatualizada.
          Assim que a internet voltar, é só recarregar.
        </p>
        <div className="mt-8 flex justify-center">
          <Button href="/">Tentar novamente</Button>
        </div>
      </div>
    </div>
  );
}
