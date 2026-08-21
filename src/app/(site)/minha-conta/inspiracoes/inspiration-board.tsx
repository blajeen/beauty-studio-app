'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Images, Plus, Send, Trash2 } from 'lucide-react';
import { Avatar, Badge, Button, Card, Field, Input, Select, Textarea } from '@/components/ui/primitives';
import { EmptyState, Notice, Spinner } from '@/components/ui/states';
import { Modal, useToast } from '@/components/ui/overlay';
import { SmartImage } from '@/components/ui/media';
import { addInspiration, removeInspiration, shareInspiration } from '../actions';

type Item = {
  id: string;
  imageUrl: string;
  note: string | null;
  categorySlug: string | null;
  createdAt: string;
  sharedWith: { id: string; displayName: string; avatarUrl: string | null } | null;
};

/**
 * Quadro de inspirações (seção 61). A cliente guarda referências e envia para a
 * profissional — o atendimento começa com as duas olhando para a mesma imagem.
 */
export function InspirationBoard({
  items,
  professionals,
  categories,
}: {
  items: Item[];
  professionals: { id: string; displayName: string; avatarUrl: string | null; title: string | null }[];
  categories: { slug: string; name: string }[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [adding, setAdding] = React.useState(false);
  const [sharing, setSharing] = React.useState<Item | null>(null);
  const [pending, setPending] = React.useState(false);

  const [form, setForm] = React.useState({ imageUrl: '', note: '', categorySlug: '' });
  const [shareTarget, setShareTarget] = React.useState('');

  async function submitNew() {
    setPending(true);
    const result = await addInspiration(form);
    setPending(false);
    if (!result.ok) {
      toast(result.error ?? 'Não foi possível salvar.', 'error');
      return;
    }
    setForm({ imageUrl: '', note: '', categorySlug: '' });
    setAdding(false);
    toast('Inspiração salva.', 'success');
    router.refresh();
  }

  async function submitShare() {
    if (!sharing) return;
    setPending(true);
    const result = await shareInspiration(sharing.id, shareTarget);
    setPending(false);
    if (!result.ok) {
      toast(result.error ?? 'Não foi possível enviar.', 'error');
      return;
    }
    setSharing(null);
    toast(result.message ?? 'Enviada.', 'success');
    router.refresh();
  }

  async function remove(id: string) {
    const result = await removeInspiration(id);
    toast(result.ok ? 'Inspiração removida.' : (result.error ?? 'Erro'), result.ok ? 'success' : 'error');
    router.refresh();
  }

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl">Minhas inspirações</h2>
          <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-muted">
            Salve referências que você gostou e envie para a profissional antes do atendimento.
          </p>
        </div>
        <Button onClick={() => setAdding(true)} size="sm">
          <Plus size={15} />
          Adicionar
        </Button>
      </div>

      <div className="mt-8">
        {items.length === 0 ? (
          <EmptyState
            icon={<Images size={20} />}
            title="Nenhuma inspiração salva"
            description="Cole o link de uma foto que você viu por aí — ou navegue pelo nosso portfólio e traga a referência de lá."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Button onClick={() => setAdding(true)}>Adicionar inspiração</Button>
                <Button href="/portfolio" variant="secondary">
                  Ver portfólio
                </Button>
              </div>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <SmartImage
                  src={item.imageUrl}
                  alt={item.note ?? 'Inspiração'}
                  seed={item.note ?? 'Inspiração'}
                  ratio="square"
                />
                <div className="p-4">
                  {item.categorySlug ? (
                    <Badge tone="outline" className="mb-2">
                      {categories.find((category) => category.slug === item.categorySlug)?.name ??
                        item.categorySlug}
                    </Badge>
                  ) : null}
                  {item.note ? (
                    <p className="text-[13px] leading-relaxed text-ink/85">{item.note}</p>
                  ) : null}

                  {item.sharedWith ? (
                    <p className="mt-3 flex items-center gap-2 text-[12px] text-muted">
                      <Avatar
                        name={item.sharedWith.displayName}
                        src={item.sharedWith.avatarUrl}
                        size="xs"
                      />
                      Enviada para {item.sharedWith.displayName}
                    </p>
                  ) : null}

                  <div className="mt-4 flex items-center gap-2 border-t border-line pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSharing(item);
                        setShareTarget(item.sharedWith?.id ?? '');
                      }}
                      className="inline-flex items-center gap-1.5 text-[12.5px] text-ink/70 transition-colors hover:text-ink"
                    >
                      <Send size={13} />
                      {item.sharedWith ? 'Trocar destino' : 'Enviar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      className="ml-auto inline-flex items-center gap-1.5 text-[12.5px] text-muted transition-colors hover:text-red-700"
                    >
                      <Trash2 size={13} />
                      Remover
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Nova inspiração"
        description="Cole o endereço da imagem e conte o que você gostou nela."
        footer={
          <>
            <Button variant="secondary" fullWidth onClick={() => setAdding(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button fullWidth onClick={submitNew} disabled={pending || !form.imageUrl}>
              {pending ? <Spinner /> : null}
              Salvar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Endereço da imagem" required>
            <Input
              value={form.imageUrl}
              onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
              placeholder="https://…"
              inputMode="url"
            />
          </Field>
          <Field label="Categoria" hint="opcional">
            <Select
              value={form.categorySlug}
              onChange={(event) => setForm({ ...form, categorySlug: event.target.value })}
            >
              <option value="">Sem categoria</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="O que você gostou?" hint="opcional">
            <Textarea
              value={form.note}
              onChange={(event) => setForm({ ...form, note: event.target.value })}
              maxLength={240}
              placeholder="Ex.: quero esse formato, mas em um tom mais nude."
            />
          </Field>
        </div>

        {form.imageUrl ? (
          <div className="mt-5">
            <p className="eyebrow mb-2">Prévia</p>
            <SmartImage
              src={form.imageUrl}
              alt="Prévia da inspiração"
              ratio="landscape"
              className="rounded-md"
            />
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(sharing)}
        onClose={() => setSharing(null)}
        title="Enviar para a profissional"
        description="Ela verá a imagem junto com o seu atendimento."
        footer={
          <>
            <Button variant="secondary" fullWidth onClick={() => setSharing(null)} disabled={pending}>
              Cancelar
            </Button>
            <Button fullWidth onClick={submitShare} disabled={pending}>
              {pending ? <Spinner /> : null}
              Enviar
            </Button>
          </>
        }
      >
        <Field label="Profissional">
          <Select value={shareTarget} onChange={(event) => setShareTarget(event.target.value)}>
            <option value="">Não enviar</option>
            {professionals.map((professional) => (
              <option key={professional.id} value={professional.id}>
                {professional.displayName} — {professional.title}
              </option>
            ))}
          </Select>
        </Field>
        <Notice tone="neutral" className="mt-4">
          A imagem fica visível apenas para a profissional escolhida e para a gestão do estúdio.
        </Notice>
      </Modal>
    </div>
  );
}
