'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/primitives';
import { Spinner } from '@/components/ui/states';
import { Modal, useToast } from '@/components/ui/overlay';
import { cancelSubscription, subscribePlan } from '../actions';

/** Assinar e cancelar o Beauty Club. Sem pagamento no app (seção 67). */
export function BenefitActions({
  planSlug,
  subscriptionId,
  className,
}: {
  planSlug?: string;
  subscriptionId?: string;
  className?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);

  async function subscribe() {
    if (!planSlug) return;
    setPending(true);
    const result = await subscribePlan(planSlug);
    setPending(false);
    toast(result.message ?? result.error ?? '', result.ok ? 'success' : 'error');
    if (result.ok) router.refresh();
  }

  async function cancel() {
    if (!subscriptionId) return;
    setPending(true);
    const result = await cancelSubscription(subscriptionId);
    setPending(false);
    setConfirming(false);
    toast(result.message ?? result.error ?? '', result.ok ? 'success' : 'error');
    if (result.ok) router.refresh();
  }

  if (subscriptionId) {
    return (
      <>
        <div className={className}>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="mt-5 text-[12.5px] text-muted underline underline-offset-4 transition-colors hover:text-ink"
          >
            Cancelar plano
          </button>
        </div>

        <Modal
          open={confirming}
          onClose={() => setConfirming(false)}
          title="Cancelar o Beauty Club?"
          description="Você mantém os benefícios até o fim do ciclo atual."
          size="sm"
          footer={
            <>
              <Button variant="secondary" fullWidth onClick={() => setConfirming(false)}>
                Manter plano
              </Button>
              <Button variant="danger" fullWidth onClick={cancel} disabled={pending}>
                {pending ? <Spinner /> : null}
                Cancelar
              </Button>
            </>
          }
        >
          <p className="text-[13.5px] leading-relaxed text-muted">
            Depois disso, os serviços voltam a ser cobrados avulsos e você perde a prioridade na
            agenda. Pode assinar de novo quando quiser.
          </p>
        </Modal>
      </>
    );
  }

  return (
    <Button onClick={subscribe} disabled={pending} fullWidth className={className}>
      {pending ? <Spinner /> : null}
      Assinar
    </Button>
  );
}
