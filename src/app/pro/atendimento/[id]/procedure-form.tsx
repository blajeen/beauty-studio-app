'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Check, Copy, Plus } from 'lucide-react';
import { Badge, Button, Card, Field, Input, Select, Textarea } from '@/components/ui/primitives';
import { Notice, Spinner } from '@/components/ui/states';
import { Modal, useToast } from '@/components/ui/overlay';
import { SmartImage } from '@/components/ui/media';
import {
  RECORD_FIELD_LABEL,
  RECORD_FIELD_PLACEHOLDER,
  RECORD_FIELD_SUGGESTIONS,
  VISIBILITIES,
  VISIBILITY_HINT,
  VISIBILITY_LABEL,
  type Visibility,
} from '@/lib/constants';
import { cn } from '@/lib/utils';
import { addProcedurePhoto, saveProcedure, setAppointmentStatus } from '../../actions';

type Fields = Record<string, string>;

/**
 * FICHA TÉCNICA (seções 14, 18, 20, 22 e 82)
 *
 * Só aparecem os campos da especialidade do serviço — nunca um formulário
 * gigante. "Repetir última" preenche tudo com o atendimento anterior, que é o
 * caso mais comum na manutenção.
 */
export function ProcedureForm({
  itemId,
  appointmentId,
  serviceName,
  schemaLabel,
  fields,
  defaultInterval,
  allowsPhotos,
  consentPhotos,
  status,
  record,
  previous,
  photos,
}: {
  itemId: string;
  appointmentId: string;
  serviceName: string;
  schemaLabel: string;
  fields: string[];
  defaultInterval: number;
  allowsPhotos: boolean;
  consentPhotos: boolean;
  status: string;
  record: Fields | null;
  previous: Fields | null;
  photos: { id: string; imageUrl: string; caption: string | null; visibility: string }[];
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [values, setValues] = React.useState<Fields>(() => {
    const base: Fields = {};
    for (const field of [...fields, 'observations']) base[field] = record?.[field] ?? '';
    return base;
  });
  const [interval, setIntervalDays] = React.useState(defaultInterval);
  const [pending, setPending] = React.useState(false);
  const [photoOpen, setPhotoOpen] = React.useState(false);
  const [photoForm, setPhotoForm] = React.useState<{
    imageUrl: string;
    caption: string;
    visibility: Visibility;
  }>({ imageUrl: '', caption: '', visibility: 'CLIENT_VISIBLE' });

  const isCompleted = status === 'COMPLETED';
  const visibleFields = fields.filter((field) => field !== 'observations');

  function repeatPrevious() {
    if (!previous) return;
    setValues((current) => {
      const next = { ...current };
      for (const field of [...fields, 'observations']) next[field] = previous[field] ?? '';
      return next;
    });
    toast('Campos preenchidos com o último atendimento.');
  }

  async function save(complete: boolean) {
    setPending(true);
    const result = await saveProcedure({
      itemId,
      ...values,
      nextRecommendedDays: interval,
      complete,
    });
    setPending(false);
    toast(result.message ?? result.error ?? '', result.ok ? 'success' : 'error');
    if (result.ok) router.refresh();
  }

  async function submitPhoto() {
    setPending(true);
    const result = await addProcedurePhoto({ itemId, ...photoForm });
    setPending(false);
    if (!result.ok) {
      toast(result.error ?? 'Não foi possível salvar a foto.', 'error');
      return;
    }
    setPhotoOpen(false);
    setPhotoForm({ imageUrl: '', caption: '', visibility: 'CLIENT_VISIBLE' });
    toast('Foto adicionada.', 'success');
    router.refresh();
  }

  async function markNoShow() {
    setPending(true);
    const result = await setAppointmentStatus(appointmentId, 'NO_SHOW');
    setPending(false);
    toast(result.message ?? result.error ?? '', result.ok ? 'success' : 'error');
    if (result.ok) router.refresh();
  }

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Ficha técnica · {schemaLabel}</p>
            <p className="mt-1 text-[13px] text-muted">
              O que você registrar aqui aparece no próximo atendimento de {serviceName.toLowerCase()}.
            </p>
          </div>
          {previous ? (
            <Button variant="secondary" size="sm" onClick={repeatPrevious} type="button">
              <Copy size={14} />
              Repetir última
            </Button>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {visibleFields.map((field) => (
            <Field key={field} label={RECORD_FIELD_LABEL[field] ?? field}>
              <Input
                value={values[field] ?? ''}
                onChange={(event) => setValues({ ...values, [field]: event.target.value })}
                placeholder={RECORD_FIELD_PLACEHOLDER[field]}
                list={RECORD_FIELD_SUGGESTIONS[field] ? `sug-${field}` : undefined}
              />
              {RECORD_FIELD_SUGGESTIONS[field] ? (
                <datalist id={`sug-${field}`}>
                  {RECORD_FIELD_SUGGESTIONS[field].map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              ) : null}
            </Field>
          ))}
        </div>

        <div className="mt-4">
          <Field label={RECORD_FIELD_LABEL.observations}>
            <Textarea
              value={values.observations ?? ''}
              onChange={(event) => setValues({ ...values, observations: event.target.value })}
              placeholder={RECORD_FIELD_PLACEHOLDER.observations}
              maxLength={800}
            />
          </Field>
        </div>

        <div className="mt-4 max-w-xs">
          <Field label="Retorno recomendado" hint="em dias">
            <Input
              type="number"
              min={0}
              max={365}
              value={interval}
              onChange={(event) => setIntervalDays(Number(event.target.value))}
            />
          </Field>
          <p className="mt-1.5 text-[12px] text-muted">
            A cliente recebe o lembrete quando esse prazo se aproximar.
          </p>
        </div>
      </Card>

      {allowsPhotos ? (
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Fotos do atendimento</p>
              <p className="mt-1 text-[13px] text-muted">
                Nada é publicado automaticamente — você escolhe quem pode ver.
              </p>
            </div>
            <Button variant="secondary" size="sm" type="button" onClick={() => setPhotoOpen(true)}>
              <Camera size={14} />
              Adicionar foto
            </Button>
          </div>

          {photos.length > 0 ? (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {photos.map((photo) => (
                <div key={photo.id}>
                  <SmartImage
                    src={photo.imageUrl}
                    alt={photo.caption ?? 'Foto do atendimento'}
                    seed={serviceName}
                    ratio="square"
                    className="rounded-md"
                  />
                  <Badge
                    tone={
                      photo.visibility === 'PUBLIC_PORTFOLIO'
                        ? 'accent'
                        : photo.visibility === 'CLIENT_VISIBLE'
                          ? 'info'
                          : 'outline'
                    }
                    className="mt-2"
                  >
                    {VISIBILITY_LABEL[photo.visibility as Visibility]}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-[13px] text-muted">Nenhuma foto ainda.</p>
          )}

          {!consentPhotos ? (
            <Notice tone="neutral" className="mt-5">
              Esta cliente ainda não autorizou o uso das fotos no portfólio público. Você pode
              registrar normalmente — a foto fica restrita à ficha dela.
            </Notice>
          ) : null}
        </Card>
      ) : null}

      <div className="safe-bottom sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-line bg-canvas/95 py-4 backdrop-blur-md">
        <Button onClick={() => save(false)} variant="secondary" size="lg" disabled={pending}>
          {pending ? <Spinner /> : null}
          Salvar ficha
        </Button>
        {!isCompleted ? (
          <>
            <Button onClick={() => save(true)} size="lg" disabled={pending}>
              <Check size={16} />
              Concluir atendimento
            </Button>
            <button
              type="button"
              onClick={markNoShow}
              disabled={pending}
              className="ml-auto text-[12.5px] text-muted underline underline-offset-4 transition-colors hover:text-red-700"
            >
              Cliente não compareceu
            </button>
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-emerald-700">
            <Check size={15} />
            Atendimento concluído
          </span>
        )}
      </div>

      <Modal
        open={photoOpen}
        onClose={() => setPhotoOpen(false)}
        title="Adicionar foto"
        description="Escolha com cuidado quem pode ver esta imagem."
        footer={
          <>
            <Button variant="secondary" fullWidth onClick={() => setPhotoOpen(false)}>
              Cancelar
            </Button>
            <Button fullWidth onClick={submitPhoto} disabled={pending || !photoForm.imageUrl}>
              {pending ? <Spinner /> : null}
              Salvar foto
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Endereço da imagem" required>
            <Input
              value={photoForm.imageUrl}
              onChange={(event) => setPhotoForm({ ...photoForm, imageUrl: event.target.value })}
              placeholder="https://…"
              inputMode="url"
            />
          </Field>
          <Field label="Legenda" hint="opcional">
            <Input
              value={photoForm.caption}
              onChange={(event) => setPhotoForm({ ...photoForm, caption: event.target.value })}
              placeholder={`Ex.: ${serviceName} — nude amendoado`}
            />
          </Field>

          <div>
            <p className="mb-2 text-[13px] font-medium">Quem pode ver</p>
            <div className="space-y-2">
              {VISIBILITIES.map((visibility) => {
                const blocked = visibility === 'PUBLIC_PORTFOLIO' && !consentPhotos;
                return (
                  <button
                    key={visibility}
                    type="button"
                    disabled={blocked}
                    onClick={() => setPhotoForm({ ...photoForm, visibility })}
                    className={cn(
                      'w-full rounded-md border p-3.5 text-left transition-colors',
                      photoForm.visibility === visibility
                        ? 'border-ink bg-primary-soft'
                        : 'border-line hover:border-ink/30',
                      blocked && 'cursor-not-allowed opacity-45 hover:border-line',
                    )}
                  >
                    <span className="block text-[13.5px] font-medium">
                      {VISIBILITY_LABEL[visibility]}
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-relaxed text-muted">
                      {blocked
                        ? 'A cliente não autorizou o uso público das fotos.'
                        : VISIBILITY_HINT[visibility]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {photoForm.imageUrl ? (
          <div className="mt-5">
            <p className="eyebrow mb-2">Prévia</p>
            <SmartImage src={photoForm.imageUrl} alt="Prévia" ratio="landscape" className="rounded-md" />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
