'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Save, Trash2 } from 'lucide-react';
import { Badge, Button, Card, Field, Input, Textarea } from '@/components/ui/primitives';
import { Notice, Spinner } from '@/components/ui/states';
import { useToast } from '@/components/ui/overlay';
import { SmartImage } from '@/components/ui/media';
import type { ContentConfig } from '@/lib/brand/config';
import { saveContent } from '../actions';

/** Editor dos textos do site. Nenhuma frase da Home vive dentro de componente. */
export function ContentEditor({
  content,
  hasDraft,
}: {
  content: ContentConfig;
  hasDraft: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = React.useState<ContentConfig>(content);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function save() {
    setPending(true);
    setError(null);
    const result = await saveContent(form);
    setPending(false);
    if (!result.ok) {
      setError(result.error ?? 'Não foi possível salvar.');
      return;
    }
    toast(result.message ?? 'Rascunho salvo.', 'success');
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">White-label</p>
          <h1 className="mt-3 font-display text-[2.4rem] leading-none">Conteúdo</h1>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted">
            Os textos que a cliente lê na Home, na página do estúdio e nas perguntas frequentes.
          </p>
        </div>
        {hasDraft ? <Badge tone="warning">Rascunho não publicado</Badge> : null}
      </header>

      {error ? (
        <Notice tone="danger" className="mb-6">
          {error}
        </Notice>
      ) : null}

      <div className="space-y-5">
        <Card className="p-6">
          <p className="eyebrow mb-5">Hero da Home</p>
          <div className="space-y-4">
            <Field label="Rótulo acima do título">
              <Input
                value={form.hero.eyebrow}
                onChange={(event) =>
                  setForm({ ...form, hero: { ...form.hero, eyebrow: event.target.value } })
                }
              />
            </Field>
            <Field label="Título principal" required>
              <Textarea
                value={form.hero.headline}
                onChange={(event) =>
                  setForm({ ...form, hero: { ...form.hero, headline: event.target.value } })
                }
                className="min-h-16 font-display text-2xl leading-tight"
              />
            </Field>
            <Field label="Subtítulo">
              <Textarea
                value={form.hero.subheadline}
                onChange={(event) =>
                  setForm({ ...form, hero: { ...form.hero, subheadline: event.target.value } })
                }
              />
            </Field>
            <Field label="Imagem" hint="URL">
              <Input
                value={form.hero.imageUrl}
                onChange={(event) =>
                  setForm({ ...form, hero: { ...form.hero, imageUrl: event.target.value } })
                }
                inputMode="url"
              />
            </Field>
            {form.hero.imageUrl ? (
              <SmartImage
                src={form.hero.imageUrl}
                alt="Prévia do hero"
                ratio="wide"
                className="rounded-md"
              />
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Botão principal">
                <Input
                  value={form.hero.ctaPrimary}
                  onChange={(event) =>
                    setForm({ ...form, hero: { ...form.hero, ctaPrimary: event.target.value } })
                  }
                />
              </Field>
              <Field label="Botão secundário">
                <Input
                  value={form.hero.ctaSecondary}
                  onChange={(event) =>
                    setForm({ ...form, hero: { ...form.hero, ctaSecondary: event.target.value } })
                  }
                />
              </Field>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <p className="eyebrow">Números de destaque</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setForm({ ...form, highlights: [...form.highlights, { label: '', value: '' }] })
              }
            >
              <Plus size={14} />
              Adicionar
            </Button>
          </div>
          <div className="space-y-3">
            {form.highlights.map((highlight, index) => (
              <div key={index} className="flex items-end gap-3">
                <Field label={index === 0 ? 'Número' : undefined} className="w-32">
                  <Input
                    value={highlight.value}
                    onChange={(event) => {
                      const next = [...form.highlights];
                      next[index] = { ...highlight, value: event.target.value };
                      setForm({ ...form, highlights: next });
                    }}
                  />
                </Field>
                <Field label={index === 0 ? 'Legenda' : undefined} className="flex-1">
                  <Input
                    value={highlight.label}
                    onChange={(event) => {
                      const next = [...form.highlights];
                      next[index] = { ...highlight, label: event.target.value };
                      setForm({ ...form, highlights: next });
                    }}
                  />
                </Field>
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      highlights: form.highlights.filter((_, i) => i !== index),
                    })
                  }
                  className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-line text-muted transition-colors hover:text-red-700"
                  aria-label="Remover"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <p className="eyebrow mb-5">Sobre o estúdio</p>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
              <Field label="Rótulo">
                <Input
                  value={form.about.eyebrow}
                  onChange={(event) =>
                    setForm({ ...form, about: { ...form.about, eyebrow: event.target.value } })
                  }
                />
              </Field>
              <Field label="Título">
                <Input
                  value={form.about.title}
                  onChange={(event) =>
                    setForm({ ...form, about: { ...form.about, title: event.target.value } })
                  }
                />
              </Field>
            </div>
            <Field label="Texto">
              <Textarea
                value={form.about.body}
                onChange={(event) =>
                  setForm({ ...form, about: { ...form.about, body: event.target.value } })
                }
                className="min-h-32"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Imagem" hint="URL">
                <Input
                  value={form.about.imageUrl}
                  onChange={(event) =>
                    setForm({ ...form, about: { ...form.about, imageUrl: event.target.value } })
                  }
                  inputMode="url"
                />
              </Field>
              <Field label="Assinatura">
                <Input
                  value={form.about.signature}
                  onChange={(event) =>
                    setForm({ ...form, about: { ...form.about, signature: event.target.value } })
                  }
                />
              </Field>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <p className="eyebrow mb-5">Citação editorial</p>
          <div className="space-y-4">
            <Field label="Frase">
              <Textarea
                value={form.editorial.quote}
                onChange={(event) =>
                  setForm({
                    ...form,
                    editorial: { ...form.editorial, quote: event.target.value },
                  })
                }
                className="min-h-20 font-display text-xl leading-snug"
              />
            </Field>
            <Field label="Autoria">
              <Input
                value={form.editorial.author}
                onChange={(event) =>
                  setForm({
                    ...form,
                    editorial: { ...form.editorial, author: event.target.value },
                  })
                }
              />
            </Field>
          </div>
        </Card>

        <Card className="p-6">
          <p className="eyebrow mb-5">Noivas e eventos</p>
          <div className="space-y-4">
            <Field label="Imagem de topo da página" hint="URL">
              <Input
                value={form.bridal.heroImageUrl}
                onChange={(event) =>
                  setForm({
                    ...form,
                    bridal: { ...form.bridal, heroImageUrl: event.target.value },
                  })
                }
                inputMode="url"
              />
            </Field>
            <Field label="Imagem da seção na Home" hint="URL">
              <Input
                value={form.bridal.sectionImageUrl}
                onChange={(event) =>
                  setForm({
                    ...form,
                    bridal: { ...form.bridal, sectionImageUrl: event.target.value },
                  })
                }
                inputMode="url"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              {form.bridal.heroImageUrl ? (
                <SmartImage
                  src={form.bridal.heroImageUrl}
                  alt="Prévia do topo de noivas"
                  ratio="wide"
                  className="rounded-md"
                />
              ) : null}
              {form.bridal.sectionImageUrl ? (
                <SmartImage
                  src={form.bridal.sectionImageUrl}
                  alt="Prévia da seção de noivas"
                  ratio="wide"
                  className="rounded-md"
                />
              ) : null}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <p className="eyebrow">Perguntas frequentes</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setForm({ ...form, faq: [...form.faq, { question: '', answer: '' }] })}
            >
              <Plus size={14} />
              Adicionar
            </Button>
          </div>
          <div className="space-y-5">
            {form.faq.map((item, index) => (
              <div key={index} className="rounded-md border border-line p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-[12px] text-muted">Pergunta {index + 1}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({ ...form, faq: form.faq.filter((_, i) => i !== index) })
                    }
                    className="text-muted transition-colors hover:text-red-700"
                    aria-label="Remover pergunta"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="space-y-3">
                  <Input
                    value={item.question}
                    placeholder="Pergunta"
                    onChange={(event) => {
                      const next = [...form.faq];
                      next[index] = { ...item, question: event.target.value };
                      setForm({ ...form, faq: next });
                    }}
                  />
                  <Textarea
                    value={item.answer}
                    placeholder="Resposta"
                    onChange={(event) => {
                      const next = [...form.faq];
                      next[index] = { ...item, answer: event.target.value };
                      setForm({ ...form, faq: next });
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <p className="eyebrow mb-5">Rodapé</p>
          <Field label="Frase do rodapé">
            <Input
              value={form.footerNote}
              onChange={(event) => setForm({ ...form, footerNote: event.target.value })}
            />
          </Field>
        </Card>
      </div>

      <div className="safe-bottom sticky bottom-0 mt-6 border-t border-line bg-canvas/95 py-4 backdrop-blur-md">
        <Button onClick={save} size="lg" disabled={pending}>
          {pending ? <Spinner /> : <Save size={16} />}
          Salvar rascunho
        </Button>
        <span className="ml-4 text-[12.5px] text-muted">
          Pré-visualize e publique na visão geral.
        </span>
      </div>
    </div>
  );
}
