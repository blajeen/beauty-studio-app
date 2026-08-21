'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock, X } from 'lucide-react';
import { Button, Field, Select, Textarea } from '@/components/ui/primitives';
import { Modal, useToast } from '@/components/ui/overlay';
import { Notice, Spinner } from '@/components/ui/states';
import { CANCEL_REASONS } from '@/lib/constants';
import { cancelMyAppointment } from '../../actions';

/**
 * Remarcar reabre o fluxo de agendamento já preenchido (seção 53) — serviços,
 * profissionais e evento são preservados, só a disponibilidade é recalculada.
 */
export function AppointmentActions({
  appointmentId,
  withinPolicy,
  cancellationHours,
  cancellationText,
}: {
  appointmentId: string;
  withinPolicy: boolean;
  cancellationHours: number;
  cancellationText: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState(CANCEL_REASONS[0]);
  const [detail, setDetail] = React.useState('');
  const [pending, setPending] = React.useState(false);

  async function confirmCancel() {
    setPending(true);
    const result = await cancelMyAppointment(
      appointmentId,
      [reason, detail.trim()].filter(Boolean).join(' — '),
    );
    setPending(false);

    if (!result.ok) {
      toast(result.error ?? 'Não foi possível cancelar.', 'error');
      return;
    }
    setOpen(false);
    toast('Agendamento cancelado.', 'success');
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button href={`/agendar?remarcar=${appointmentId}`} variant="secondary" size="lg">
          <CalendarClock size={16} />
          Remarcar
        </Button>
        <Button variant="danger" size="lg" onClick={() => setOpen(true)}>
          <X size={16} />
          Cancelar agendamento
        </Button>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Cancelar agendamento"
        description="Conte rapidamente o motivo — ajuda a equipe a organizar a agenda."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} fullWidth disabled={pending}>
              Manter horário
            </Button>
            <Button variant="danger" onClick={confirmCancel} fullWidth disabled={pending}>
              {pending ? <Spinner /> : null}
              Confirmar cancelamento
            </Button>
          </>
        }
      >
        {!withinPolicy ? (
          <Notice tone="warning" className="mb-5" title={`Faltam menos de ${cancellationHours} horas`}>
            {cancellationText}
          </Notice>
        ) : null}

        <div className="space-y-4">
          <Field label="Motivo">
            <Select value={reason} onChange={(event) => setReason(event.target.value)}>
              {CANCEL_REASONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Quer detalhar?" hint="opcional">
            <Textarea
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
              maxLength={240}
              placeholder="Se quiser, escreva aqui."
            />
          </Field>
        </div>

        <p className="mt-5 text-[12.5px] leading-relaxed text-muted">
          Prefere só mudar o horário? Use <span className="text-ink">Remarcar</span> — assim você
          mantém os mesmos serviços e profissionais.
        </p>
      </Modal>
    </>
  );
}
