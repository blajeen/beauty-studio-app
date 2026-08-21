'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import { Badge, Button, Card, Field, Input, Select } from '@/components/ui/primitives';
import { Notice, Spinner } from '@/components/ui/states';
import { useToast } from '@/components/ui/overlay';
import { brandToStyle, type BrandConfig } from '@/lib/brand/config';
import { cn } from '@/lib/utils';
import { saveBrand } from '../actions';

const COLOR_FIELDS: { key: keyof BrandConfig['colors']; label: string; hint: string }[] = [
  { key: 'primary', label: 'Primária', hint: 'botões, links e estados ativos' },
  { key: 'primaryContrast', label: 'Contraste da primária', hint: 'texto sobre a cor primária' },
  { key: 'secondary', label: 'Secundária', hint: 'seções escuras e editoriais' },
  { key: 'accent', label: 'Realce', hint: 'destaques e detalhes' },
  { key: 'background', label: 'Fundo', hint: 'plano de fundo geral' },
  { key: 'surface', label: 'Superfície', hint: 'cartões e caixas' },
  { key: 'foreground', label: 'Texto', hint: 'cor do texto principal' },
  { key: 'muted', label: 'Texto de apoio', hint: 'legendas e descrições' },
  { key: 'border', label: 'Linhas', hint: 'divisores e contornos' },
];

const FEATURE_FIELDS: { key: keyof BrandConfig['features']; label: string; hint: string }[] = [
  { key: 'packages', label: 'Pacotes e combos', hint: 'catálogo de pacotes e controle de sessões' },
  { key: 'beautyClub', label: 'Beauty Club', hint: 'planos de assinatura mensal' },
  { key: 'events', label: 'Noivas e eventos', hint: 'fluxo de cronograma reverso e eventos' },
  { key: 'portfolio', label: 'Portfólio', hint: 'galeria pública dos trabalhos' },
  { key: 'inspiration', label: 'Inspirações', hint: 'quadro de referências da cliente' },
  { key: 'waitlist', label: 'Lista de espera', hint: 'quando não há horário disponível' },
  { key: 'reviews', label: 'Avaliações', hint: 'depoimentos no site e no perfil' },
  { key: 'multiBranch', label: 'Múltiplas unidades', hint: 'passo de escolha de unidade' },
];

const PRESETS: { name: string; colors: Partial<BrandConfig['colors']>; fonts?: BrandConfig['fonts'] }[] = [
  {
    name: 'Cacau',
    colors: {
      primary: '#3B2C28',
      secondary: '#1C1512',
      accent: '#B98A76',
      background: '#F7F3EF',
      foreground: '#241C19',
      muted: '#8A7C74',
      border: '#E4DCD4',
    },
  },
  {
    name: 'Sage',
    colors: {
      primary: '#2F3A33',
      secondary: '#1A211C',
      accent: '#96A98F',
      background: '#F4F5F1',
      foreground: '#1F2521',
      muted: '#7C857D',
      border: '#DDE1D9',
    },
  },
  {
    name: 'Noir',
    colors: {
      primary: '#141414',
      secondary: '#0B0B0B',
      accent: '#C0A062',
      background: '#F6F5F3',
      foreground: '#161616',
      muted: '#807D78',
      border: '#E2E0DC',
    },
  },
  {
    name: 'Blush',
    colors: {
      primary: '#4A2E38',
      secondary: '#241820',
      accent: '#C98B96',
      background: '#FAF4F5',
      foreground: '#241A1E',
      muted: '#8B7A80',
      border: '#EADEE1',
    },
  },
];

/**
 * Editor da marca. Cada alteração é refletida imediatamente na pré-visualização
 * ao lado — que usa exatamente os mesmos tokens CSS do produto real.
 */
export function BrandEditor({ brand, hasDraft }: { brand: BrandConfig; hasDraft: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = React.useState<BrandConfig>(brand);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function set<K extends keyof BrandConfig>(key: K, value: BrandConfig[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  function setColor(key: keyof BrandConfig['colors'], value: string) {
    setForm((current) => ({ ...current, colors: { ...current.colors, [key]: value } }));
  }

  async function save() {
    setPending(true);
    setError(null);
    const result = await saveBrand(form);
    setPending(false);
    if (!result.ok) {
      setError(result.error ?? 'Não foi possível salvar.');
      return;
    }
    toast(result.message ?? 'Rascunho salvo.', 'success');
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">White-label</p>
          <h1 className="mt-3 font-display text-[2.4rem] leading-none">Marca</h1>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted">
            Estes valores viram variáveis CSS aplicadas em toda a aplicação. Não existe cor nem nome
            escrito dentro de componente.
          </p>
        </div>
        {hasDraft ? <Badge tone="warning">Rascunho não publicado</Badge> : null}
      </header>

      {error ? (
        <Notice tone="danger" className="mb-6">
          {error}
        </Notice>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <Card className="p-6">
            <p className="eyebrow mb-5">Identidade</p>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome do estúdio" required>
                  <Input value={form.name} onChange={(event) => set('name', event.target.value)} />
                </Field>
                <Field label="Nome curto" hint="PWA e espaços apertados">
                  <Input
                    value={form.shortName}
                    onChange={(event) => set('shortName', event.target.value)}
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                <Field label="Assinatura" hint="aparece sob o nome">
                  <Input
                    value={form.tagline}
                    onChange={(event) => set('tagline', event.target.value)}
                  />
                </Field>
                <Field label="Monograma" hint="1 a 3 letras">
                  <Input
                    value={form.monogram}
                    maxLength={3}
                    onChange={(event) => set('monogram', event.target.value)}
                  />
                </Field>
              </div>
              <Field label="Logo" hint="URL — deixe vazio para usar o monograma">
                <Input
                  value={form.logoUrl ?? ''}
                  onChange={(event) => set('logoUrl', event.target.value || null)}
                  placeholder="https://…"
                  inputMode="url"
                />
              </Field>
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="eyebrow">Paleta</p>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        colors: { ...current.colors, ...preset.colors },
                      }))
                    }
                    className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11.5px] transition-colors hover:border-ink/35"
                  >
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ background: preset.colors.primary }}
                    />
                    <span
                      className="-ml-2.5 h-3 w-3 rounded-full ring-1 ring-white"
                      style={{ background: preset.colors.accent }}
                    />
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {COLOR_FIELDS.map((field) => (
                <label key={field.key} className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.colors[field.key]}
                    onChange={(event) => setColor(field.key, event.target.value)}
                    className="h-10 w-10 shrink-0 cursor-pointer rounded-md border border-line bg-transparent p-0.5"
                    aria-label={field.label}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium">{field.label}</span>
                    <span className="block text-[11.5px] leading-snug text-muted">{field.hint}</span>
                  </span>
                  <Input
                    value={form.colors[field.key]}
                    onChange={(event) => setColor(field.key, event.target.value)}
                    className="h-9 w-24 font-mono text-[12px] uppercase"
                  />
                </label>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <p className="eyebrow mb-5">Tipografia e forma</p>
            <div className="space-y-4">
              <Field label="Fonte de títulos" hint="pilha CSS">
                <Input
                  value={form.fonts.display}
                  onChange={(event) =>
                    setForm({ ...form, fonts: { ...form.fonts, display: event.target.value } })
                  }
                />
              </Field>
              <Field label="Fonte de interface" hint="pilha CSS">
                <Input
                  value={form.fonts.body}
                  onChange={(event) =>
                    setForm({ ...form, fonts: { ...form.fonts, body: event.target.value } })
                  }
                />
              </Field>
              <Field label="Cantos">
                <Select
                  value={form.radius}
                  onChange={(event) =>
                    set('radius', event.target.value as BrandConfig['radius'])
                  }
                >
                  <option value="sharp">Retos — arquitetônico</option>
                  <option value="soft">Suaves — equilíbrio (padrão)</option>
                  <option value="round">Arredondados — acolhedor</option>
                </Select>
              </Field>
            </div>
          </Card>

          <Card className="p-6">
            <p className="eyebrow mb-5">Contato</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="WhatsApp" hint="DDI + DDD + número" required>
                <Input
                  value={form.contact.whatsapp}
                  onChange={(event) =>
                    setForm({ ...form, contact: { ...form.contact, whatsapp: event.target.value } })
                  }
                  placeholder="5511987654321"
                  inputMode="numeric"
                />
              </Field>
              <Field label="Telefone">
                <Input
                  value={form.contact.phone}
                  onChange={(event) =>
                    setForm({ ...form, contact: { ...form.contact, phone: event.target.value } })
                  }
                />
              </Field>
              <Field label="E-mail">
                <Input
                  value={form.contact.email}
                  onChange={(event) =>
                    setForm({ ...form, contact: { ...form.contact, email: event.target.value } })
                  }
                  inputMode="email"
                />
              </Field>
              <Field label="Instagram" hint="sem @">
                <Input
                  value={form.contact.instagram}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      contact: { ...form.contact, instagram: event.target.value },
                    })
                  }
                />
              </Field>
              <Field label="Razão social">
                <Input
                  value={form.legal.companyName}
                  onChange={(event) =>
                    setForm({ ...form, legal: { ...form.legal, companyName: event.target.value } })
                  }
                />
              </Field>
              <Field label="CNPJ">
                <Input
                  value={form.legal.document}
                  onChange={(event) =>
                    setForm({ ...form, legal: { ...form.legal, document: event.target.value } })
                  }
                />
              </Field>
            </div>
          </Card>

          <Card className="p-6">
            <p className="eyebrow mb-5">Módulos</p>
            <div className="space-y-2">
              {FEATURE_FIELDS.map((feature) => (
                <label
                  key={feature.key}
                  className={cn(
                    'flex cursor-pointer items-center gap-4 rounded-md border p-3.5 transition-colors',
                    form.features[feature.key] ? 'border-ink/35 bg-primary-soft' : 'border-line',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={form.features[feature.key]}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        features: { ...form.features, [feature.key]: event.target.checked },
                      })
                    }
                    className="h-4 w-4 accent-[var(--brand-primary)]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-medium">{feature.label}</span>
                    <span className="block text-[12px] text-muted">{feature.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <p className="eyebrow mb-5">Regras de agendamento</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Passo da grade" hint="minutos">
                <Input
                  type="number"
                  min={5}
                  max={60}
                  value={form.booking.slotStep}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      booking: { ...form.booking, slotStep: Number(event.target.value) },
                    })
                  }
                />
              </Field>
              <Field label="Antecedência mínima" hint="horas">
                <Input
                  type="number"
                  min={0}
                  max={72}
                  value={form.booking.minLeadTimeHours}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      booking: { ...form.booking, minLeadTimeHours: Number(event.target.value) },
                    })
                  }
                />
              </Field>
              <Field label="Janela de agenda" hint="dias">
                <Input
                  type="number"
                  min={7}
                  max={365}
                  value={form.booking.maxAdvanceDays}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      booking: { ...form.booking, maxAdvanceDays: Number(event.target.value) },
                    })
                  }
                />
              </Field>
              <Field label="Preparo em eventos" hint="minutos">
                <Input
                  type="number"
                  min={0}
                  max={120}
                  value={form.booking.eventPrepBuffer}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      booking: { ...form.booking, eventPrepBuffer: Number(event.target.value) },
                    })
                  }
                />
              </Field>
            </div>
          </Card>

          <Card className="p-6">
            <p className="eyebrow mb-5">Políticas</p>
            <div className="space-y-4">
              <Field label="Janela de cancelamento" hint="horas">
                <Input
                  type="number"
                  min={0}
                  max={72}
                  value={form.policies.cancellationHours}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      policies: {
                        ...form.policies,
                        cancellationHours: Number(event.target.value),
                      },
                    })
                  }
                  className="max-w-32"
                />
              </Field>
              {(
                [
                  ['cancellationText', 'Texto de cancelamento'],
                  ['lateText', 'Texto de atraso'],
                  ['depositText', 'Texto de sinal e reservas'],
                ] as const
              ).map(([key, label]) => (
                <Field key={key} label={label}>
                  <Input
                    value={form.policies[key]}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        policies: { ...form.policies, [key]: event.target.value },
                      })
                    }
                  />
                </Field>
              ))}
            </div>
          </Card>
        </div>

        {/* Pré-visualização com os tokens reais aplicados. */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <p className="eyebrow mb-3">Pré-visualização</p>
          <div
            className="overflow-hidden rounded-lg border"
            style={{ ...(brandToStyle(form) as React.CSSProperties), borderColor: form.colors.border }}
          >
            <div style={{ background: form.colors.background }} className="p-6">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-md text-[17px]"
                  style={{
                    background: form.colors.primary,
                    color: form.colors.primaryContrast,
                    fontFamily: form.fonts.display,
                  }}
                >
                  {form.monogram}
                </span>
                <span className="leading-none">
                  <span
                    className="block text-[18px]"
                    style={{ fontFamily: form.fonts.display, color: form.colors.foreground }}
                  >
                    {form.name}
                  </span>
                  <span
                    className="mt-0.5 block text-[9px] uppercase tracking-[0.22em]"
                    style={{ color: form.colors.muted }}
                  >
                    {form.tagline}
                  </span>
                </span>
              </div>

              <p
                className="mt-6 text-[26px] leading-tight"
                style={{ fontFamily: form.fonts.display, color: form.colors.foreground }}
              >
                Sua beleza, no seu melhor momento.
              </p>
              <p
                className="mt-2.5 text-[12.5px] leading-relaxed"
                style={{ color: form.colors.muted, fontFamily: form.fonts.body }}
              >
                Unhas, sobrancelhas, cílios e maquiagem com quem já conhece o seu estilo.
              </p>

              <div className="mt-5 flex gap-2">
                <span
                  className="rounded-md px-4 py-2.5 text-[12.5px]"
                  style={{
                    background: form.colors.primary,
                    color: form.colors.primaryContrast,
                    fontFamily: form.fonts.body,
                  }}
                >
                  Agendar horário
                </span>
                <span
                  className="rounded-md border px-4 py-2.5 text-[12.5px]"
                  style={{
                    borderColor: form.colors.border,
                    background: form.colors.surface,
                    color: form.colors.foreground,
                    fontFamily: form.fonts.body,
                  }}
                >
                  Falar com a equipe
                </span>
              </div>

              <div
                className="mt-5 rounded-lg border p-4"
                style={{ background: form.colors.surface, borderColor: form.colors.border }}
              >
                <span
                  className="text-[9.5px] uppercase tracking-[0.18em]"
                  style={{ color: form.colors.muted }}
                >
                  Primeiro horário disponível
                </span>
                <p
                  className="mt-1.5 text-[22px] leading-none"
                  style={{ fontFamily: form.fonts.display, color: form.colors.foreground }}
                >
                  Hoje — 16:30
                </p>
                <span
                  className="mt-3 inline-block rounded-full px-2.5 py-1 text-[10.5px]"
                  style={{ background: form.colors.accent, color: '#fff' }}
                >
                  Manicure + Gel
                </span>
              </div>
            </div>

            <div style={{ background: form.colors.secondary }} className="px-6 py-5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Assinatura</p>
              <p
                className="mt-1.5 text-[20px] text-white"
                style={{ fontFamily: form.fonts.display }}
              >
                Beauty Club
              </p>
            </div>
          </div>

          <div className="safe-bottom sticky bottom-0 mt-4 bg-canvas py-3">
            <Button onClick={save} size="lg" fullWidth disabled={pending}>
              {pending ? <Spinner /> : <Save size={16} />}
              Salvar rascunho
            </Button>
            <p className="mt-2 text-center text-[12px] text-muted">
              Publique na visão geral quando estiver satisfeito.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
