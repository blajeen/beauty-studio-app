'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Textarea } from '@/components/ui/primitives';
import { Spinner } from '@/components/ui/states';
import { useToast } from '@/components/ui/overlay';
import { saveCustomerNote } from '../../actions';

/** Anotação interna sobre a cliente — nunca visível para ela. */
export function CustomerNoteEditor({
  customerId,
  notes,
}: {
  customerId: string;
  notes: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [value, setValue] = React.useState(notes);
  const [pending, setPending] = React.useState(false);

  const dirty = value.trim() !== notes.trim();

  async function save() {
    setPending(true);
    const result = await saveCustomerNote(customerId, value);
    setPending(false);
    toast(result.message ?? result.error ?? '', result.ok ? 'success' : 'error');
    if (result.ok) router.refresh();
  }

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <p className="eyebrow">Anotações do estúdio</p>
        <span className="text-[11.5px] text-muted">visível só para a equipe</span>
      </div>
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        maxLength={400}
        placeholder="Sensibilidades, o que ela gosta, o que evitar, como prefere ser atendida…"
      />
      {dirty ? (
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setValue(notes)} disabled={pending}>
            Descartar
          </Button>
          <Button size="sm" onClick={save} disabled={pending}>
            {pending ? <Spinner /> : null}
            Salvar anotação
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
