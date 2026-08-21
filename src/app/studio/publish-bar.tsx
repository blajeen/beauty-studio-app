'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Rocket, Undo2 } from 'lucide-react';
import { Button, Card } from '@/components/ui/primitives';
import { Spinner } from '@/components/ui/states';
import { useToast } from '@/components/ui/overlay';
import { BRAND_KEY, CONTENT_KEY } from '@/lib/brand/keys';
import { discard, enterPreview, exitPreview, publish } from './actions';

/**
 * Pré-visualizar → publicar (seção 56).
 * Enquanto o rascunho não é publicado, nenhuma cliente vê a mudança.
 */
export function PublishBar({
  preview,
  brandHasDraft,
  contentHasDraft,
}: {
  preview: boolean;
  brandHasDraft: boolean;
  contentHasDraft: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);

  const hasDraft = brandHasDraft || contentHasDraft;

  async function run(fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) {
    setPending(true);
    const result = await fn();
    setPending(false);
    toast(result.message ?? result.error ?? '', result.ok ? 'success' : 'error');
    router.refresh();
  }

  async function publishAll() {
    setPending(true);
    const results = [];
    if (brandHasDraft) results.push(await publish(BRAND_KEY));
    if (contentHasDraft) results.push(await publish(CONTENT_KEY));
    setPending(false);
    const failed = results.find((result) => !result.ok);
    toast(
      failed?.error ?? 'Publicado. Todas as clientes já veem a nova versão.',
      failed ? 'error' : 'success',
    );
    router.refresh();
  }

  async function discardAll() {
    setPending(true);
    if (brandHasDraft) await discard(BRAND_KEY);
    if (contentHasDraft) await discard(CONTENT_KEY);
    setPending(false);
    toast('Rascunhos descartados.', 'success');
    router.refresh();
  }

  return (
    <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
      <div>
        <p className="text-[14px] font-medium">
          {hasDraft ? 'Você tem alterações em rascunho' : 'Tudo publicado'}
        </p>
        <p className="mt-0.5 text-[12.5px] text-muted">
          {hasDraft
            ? 'Navegue o site em pré-visualização antes de publicar.'
            : 'O que está no ar é exatamente o que está configurado aqui.'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {preview ? (
          <Button variant="secondary" onClick={() => run(exitPreview)} disabled={pending}>
            <EyeOff size={15} />
            Sair da pré-visualização
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => run(enterPreview)} disabled={pending || !hasDraft}>
            <Eye size={15} />
            Pré-visualizar
          </Button>
        )}

        {hasDraft ? (
          <>
            <Button variant="ghost" onClick={discardAll} disabled={pending}>
              <Undo2 size={15} />
              Descartar
            </Button>
            <Button onClick={publishAll} disabled={pending}>
              {pending ? <Spinner /> : <Rocket size={15} />}
              Publicar
            </Button>
          </>
        ) : null}
      </div>
    </Card>
  );
}
