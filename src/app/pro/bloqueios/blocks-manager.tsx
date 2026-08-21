'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CalendarOff, Plus, Trash2 } from 'lucide-react';
import { Badge, Button, Card, Field, Input, Select } from '@/components/ui/primitives';
import { EmptyState, Spinner } from '@/components/ui/states';
import { Modal, useToast } from '@/components/ui/overlay';
import { createBlock, removeBlock } from '../actions';

const TYPE_LABEL: Record<string, string> = {
  BLOCK: 'Bloqueio',
  BREAK: 'Pausa',
  VACATION: 'Férias',
  HOLIDAY: 'Feriado',
};

export function BlocksManager({
  blocks,
  professionals,
}: {
  blocks: { id: string; startAt: string; endAt: string; reason: string | null; type: string }[];
  professionals?: { id: string; displayName: string }[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = React.useState({
    date: today,
    endDate: '',
    startTime: '09:00',
    endTime: '12:00',
    reason: '',
    type: 'BLOCK',
    professionalId: '',
  });

  async function submit() {
    setPending(true);
    setError(null);
    const result = await createBlock({
      ...form,
      endDate: form.endDate || undefined,
      professionalId: form.professionalId || undefined,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error ?? 'Não foi possível bloquear.');
      return;
    }
    setOpen(false);
    toast('Período bloqueado.', 'success');
    router.refresh();
  }

  async function remove(id: string) {
    const result = await removeBlock(id);
    toast(result.message ?? result.error ?? '', result.ok ? 'success' : 'error');
    router.refresh();
  }

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus size={15} />
          Novo bloqueio
        </Button>
      </div>

      {blocks.length === 0 ? (
        <EmptyState
          icon={<CalendarOff size={20} />}
          title="Nenhum bloqueio ativo"
          description="Sua agenda está totalmente disponível dentro da sua escala."
        />
      ) : (
        <div className="space-y-2.5">
          {blocks.map((block) => {
            const start = new Date(block.startAt);
            const end = new Date(block.endAt);
            const sameDay = start.toDateString() === end.toDateString();
            return (
              <Card key={block.id} className="flex flex-wrap items-center gap-4 p-4">
                <Badge tone={block.type === 'VACATION' ? 'info' : 'outline'}>
                  {TYPE_LABEL[block.type] ?? block.type}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium">
                    {start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    {sameDay
                      ? ` · ${start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                      : ` – ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`}
                  </p>
                  {block.reason ? (
                    <p className="mt-0.5 text-[12.5px] text-muted">{block.reason}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => remove(block.id)}
                  className="inline-flex items-center gap-1.5 text-[12.5px] text-muted transition-colors hover:text-red-700"
                >
                  <Trash2 size={13} />
                  Remover
                </button>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Bloquear período"
        description="O horário deixa de aparecer para as clientes imediatamente."
        footer={
          <>
            <Button variant="secondary" fullWidth onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button fullWidth onClick={submit} disabled={pending}>
              {pending ? <Spinner /> : null}
              Bloquear
            </Button>
          </>
        }
      >
        {error ? (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
            {error}
          </div>
        ) : null}

        <div className="space-y-4">
          {professionals ? (
            <Field label="Profissional" required>
              <Select
                value={form.professionalId}
                onChange={(event) => setForm({ ...form, professionalId: event.target.value })}
              >
                <option value="">Selecione</option>
                {professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    {professional.displayName}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}

          <Field label="Tipo">
            <Select
              value={form.type}
              onChange={(event) => setForm({ ...form, type: event.target.value })}
            >
              {Object.entries(TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Data de início" required>
              <Input
                type="date"
                value={form.date}
                onChange={(event) => setForm({ ...form, date: event.target.value })}
              />
            </Field>
            <Field label="Data de fim" hint="para vários dias">
              <Input
                type="date"
                value={form.endDate}
                min={form.date}
                onChange={(event) => setForm({ ...form, endDate: event.target.value })}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Início" required>
              <Input
                type="time"
                value={form.startTime}
                onChange={(event) => setForm({ ...form, startTime: event.target.value })}
              />
            </Field>
            <Field label="Fim" required>
              <Input
                type="time"
                value={form.endTime}
                onChange={(event) => setForm({ ...form, endTime: event.target.value })}
              />
            </Field>
          </div>

          <Field label="Motivo" hint="opcional">
            <Input
              value={form.reason}
              onChange={(event) => setForm({ ...form, reason: event.target.value })}
              placeholder="Ex.: curso, consulta médica, férias"
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
