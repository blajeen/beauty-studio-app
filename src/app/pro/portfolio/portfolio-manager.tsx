'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Images, Plus, Trash2 } from 'lucide-react';
import { Badge, Button, Card, Field, Input, Select } from '@/components/ui/primitives';
import { EmptyState, Notice, Spinner } from '@/components/ui/states';
import { Modal, useToast } from '@/components/ui/overlay';
import { SmartImage } from '@/components/ui/media';
import { VISIBILITIES, VISIBILITY_HINT, VISIBILITY_LABEL, type Visibility } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { removePortfolioItem, savePortfolioItem } from '../actions';

type Item = {
  id: string;
  title: string;
  imageUrl: string;
  technique: string | null;
  styleTags: string | null;
  visibility: string;
  isFeatured: boolean;
  serviceName: string | null;
};

export function PortfolioManager({
  items,
  services,
}: {
  items: Item[];
  services: { id: string; name: string }[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [form, setForm] = React.useState<{
    title: string;
    imageUrl: string;
    serviceId: string;
    technique: string;
    styleTags: string;
    visibility: Visibility;
    isFeatured: boolean;
  }>({
    title: '',
    imageUrl: '',
    serviceId: '',
    technique: '',
    styleTags: '',
    visibility: 'PUBLIC_PORTFOLIO',
    isFeatured: false,
  });

  const publicCount = items.filter((item) => item.visibility === 'PUBLIC_PORTFOLIO').length;

  async function submit() {
    setPending(true);
    const result = await savePortfolioItem(form);
    setPending(false);
    if (!result.ok) {
      toast(result.error ?? 'Não foi possível salvar.', 'error');
      return;
    }
    setOpen(false);
    setForm({
      title: '',
      imageUrl: '',
      serviceId: '',
      technique: '',
      styleTags: '',
      visibility: 'PUBLIC_PORTFOLIO',
      isFeatured: false,
    });
    toast('Trabalho adicionado.', 'success');
    router.refresh();
  }

  async function remove(id: string) {
    const result = await removePortfolioItem(id);
    toast(result.message ?? result.error ?? '', result.ok ? 'success' : 'error');
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Seu trabalho</p>
          <h1 className="mt-3 font-display text-[2.4rem] leading-none">Meu portfólio</h1>
          <p className="mt-2 text-[13.5px] text-muted">
            {publicCount} trabalhos públicos · é assim que as clientes escolhem você.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={15} />
          Adicionar trabalho
        </Button>
      </header>

      {items.length === 0 ? (
        <EmptyState
          icon={<Images size={20} />}
          title="Seu portfólio está vazio"
          description="Comece com três ou quatro trabalhos que representem bem o seu estilo. Eles aparecem no seu perfil e na galeria do estúdio."
          action={<Button onClick={() => setOpen(true)}>Adicionar o primeiro</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <SmartImage src={item.imageUrl} alt={item.title} seed={item.title} ratio="square" />
              <div className="p-3.5">
                <p className="truncate text-[13.5px] font-medium">{item.title}</p>
                {item.serviceName ? (
                  <p className="mt-0.5 truncate text-[11.5px] text-muted">{item.serviceName}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge
                    tone={
                      item.visibility === 'PUBLIC_PORTFOLIO'
                        ? 'accent'
                        : item.visibility === 'CLIENT_VISIBLE'
                          ? 'info'
                          : 'outline'
                    }
                  >
                    {VISIBILITY_LABEL[item.visibility as Visibility]}
                  </Badge>
                  {item.isFeatured ? <Badge tone="neutral">Destaque</Badge> : null}
                </div>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-red-700"
                >
                  <Trash2 size={12} />
                  Remover
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Adicionar trabalho"
        description="Use fotos bem iluminadas e sem informações pessoais da cliente."
        footer={
          <>
            <Button variant="secondary" fullWidth onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button fullWidth onClick={submit} disabled={pending || !form.title || !form.imageUrl}>
              {pending ? <Spinner /> : null}
              Adicionar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Título" required>
            <Input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="Ex.: Amendoado nude leitoso"
            />
          </Field>
          <Field label="Endereço da imagem" required>
            <Input
              value={form.imageUrl}
              onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
              placeholder="https://…"
              inputMode="url"
            />
          </Field>
          <Field label="Serviço" hint="opcional">
            <Select
              value={form.serviceId}
              onChange={(event) => setForm({ ...form, serviceId: event.target.value })}
            >
              <option value="">Sem serviço vinculado</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Técnica" hint="opcional">
              <Input
                value={form.technique}
                onChange={(event) => setForm({ ...form, technique: event.target.value })}
                placeholder="Ex.: fibra de vidro"
              />
            </Field>
            <Field label="Estilos" hint="separe por vírgula">
              <Input
                value={form.styleTags}
                onChange={(event) => setForm({ ...form, styleTags: event.target.value })}
                placeholder="Minimalista, Chrome"
              />
            </Field>
          </div>

          <div>
            <p className="mb-2 text-[13px] font-medium">Visibilidade</p>
            <div className="space-y-2">
              {VISIBILITIES.map((visibility) => (
                <button
                  key={visibility}
                  type="button"
                  onClick={() => setForm({ ...form, visibility })}
                  className={cn(
                    'w-full rounded-md border p-3.5 text-left transition-colors',
                    form.visibility === visibility
                      ? 'border-ink bg-primary-soft'
                      : 'border-line hover:border-ink/30',
                  )}
                >
                  <span className="block text-[13.5px] font-medium">
                    {VISIBILITY_LABEL[visibility]}
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-relaxed text-muted">
                    {VISIBILITY_HINT[visibility]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {form.visibility === 'PUBLIC_PORTFOLIO' ? (
          <Notice tone="warning" className="mt-4">
            Publique apenas fotos que a cliente autorizou. Se a foto é de um atendimento, registre-a
            pela tela do atendimento — assim o consentimento dela é verificado automaticamente.
          </Notice>
        ) : null}

        {form.imageUrl ? (
          <div className="mt-5">
            <p className="eyebrow mb-2">Prévia</p>
            <SmartImage src={form.imageUrl} alt="Prévia" ratio="landscape" className="rounded-md" />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
