import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Eye, FileText, Palette } from 'lucide-react';
import { requireRole } from '@/lib/auth/guards';
import { BRAND_KEY, CONTENT_KEY, getBrand, getSettingPair, isPreviewMode } from '@/lib/brand/server';
import { db } from '@/lib/db';
import { Badge, Button, Card } from '@/components/ui/primitives';
import { Notice } from '@/components/ui/states';
import { PublishBar } from './publish-bar';

export const metadata: Metadata = { title: 'Configuração do produto' };
export const dynamic = 'force-dynamic';

export default async function StudioPage() {
  await requireRole(['PRODUCT_MANAGER', 'OWNER']);

  const [brand, brandSetting, contentSetting, preview, counts] = await Promise.all([
    getBrand(),
    getSettingPair(BRAND_KEY),
    getSettingPair(CONTENT_KEY),
    isPreviewMode(),
    Promise.all([
      db.service.count({ where: { isActive: true } }),
      db.professional.count({ where: { isActive: true } }),
      db.branch.count({ where: { isActive: true } }),
      db.package.count({ where: { isActive: true } }),
      db.plan.count({ where: { isActive: true } }),
    ]),
  ]);

  const [services, professionals, branches, packages, plans] = counts;
  const pendingDrafts = [
    brandSetting.hasDraft ? 'Marca' : null,
    contentSetting.hasDraft ? 'Conteúdo' : null,
  ].filter(Boolean) as string[];

  const featureList = [
    { key: 'packages', label: 'Pacotes e combos' },
    { key: 'beautyClub', label: 'Beauty Club' },
    { key: 'events', label: 'Noivas e eventos' },
    { key: 'portfolio', label: 'Portfólio' },
    { key: 'inspiration', label: 'Inspirações' },
    { key: 'waitlist', label: 'Lista de espera' },
    { key: 'reviews', label: 'Avaliações' },
    { key: 'multiBranch', label: 'Múltiplas unidades' },
  ] as const;

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <p className="eyebrow">White-label</p>
        <h1 className="mt-3 font-display text-[2.4rem] leading-none">
          Esta instalação é do {brand.name}
        </h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted">
          Tudo o que identifica o estúdio — nome, cores, textos, módulos, políticas — vive aqui.
          Alterações ficam em rascunho, podem ser pré-visualizadas no site e só valem para as
          clientes depois de publicadas.
        </p>
      </header>

      {pendingDrafts.length > 0 ? (
        <Notice tone="warning" className="mb-6" title="Alterações não publicadas">
          {pendingDrafts.join(' e ')} {pendingDrafts.length > 1 ? 'têm' : 'tem'} rascunho pendente.
          Pré-visualize e publique quando estiver satisfeito.
        </Notice>
      ) : null}

      <PublishBar
        preview={preview}
        brandHasDraft={brandSetting.hasDraft}
        contentHasDraft={contentSetting.hasDraft}
      />

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link href="/studio/marca">
          <Card className="h-full p-6 transition-colors hover:border-ink/25">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-ink/70">
              <Palette size={18} strokeWidth={1.7} />
            </span>
            <h2 className="mt-4 font-display text-xl">Marca</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
              Nome, monograma, paleta, tipografia, contato, módulos ativos, políticas e regras de
              agendamento.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] text-ink">
              Configurar
              <ArrowUpRight size={13} />
            </span>
          </Card>
        </Link>

        <Link href="/studio/conteudo">
          <Card className="h-full p-6 transition-colors hover:border-ink/25">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-ink/70">
              <FileText size={18} strokeWidth={1.7} />
            </span>
            <h2 className="mt-4 font-display text-xl">Conteúdo</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
              Hero da Home, números de destaque, texto do estúdio, citação editorial, perguntas
              frequentes e rodapé.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] text-ink">
              Editar textos
              <ArrowUpRight size={13} />
            </span>
          </Card>
        </Link>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-2xl">Módulos ativos</h2>
        <p className="mt-1.5 text-[13px] text-muted">
          Desligar um módulo remove as telas, os links e as seções correspondentes.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {featureList.map((feature) => (
            <Badge
              key={feature.key}
              tone={brand.features[feature.key] ? 'accent' : 'outline'}
            >
              {feature.label}
              {brand.features[feature.key] ? '' : ' · desligado'}
            </Badge>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-2xl">Negócio</h2>
        <p className="mt-1.5 text-[13px] text-muted">
          Catálogo, equipe e programas são geridos pela dona — mas você vê o estado atual daqui.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: 'Serviços', value: services, href: '/admin/servicos' },
            { label: 'Profissionais', value: professionals, href: '/admin/profissionais' },
            { label: 'Unidades', value: branches, href: '/admin/unidades' },
            { label: 'Pacotes', value: packages, href: '/admin/programas' },
            { label: 'Planos', value: plans, href: '/admin/programas' },
          ].map((item) => (
            <Link key={item.label} href={item.href}>
              <Card className="p-4 transition-colors hover:border-ink/25">
                <p className="font-display text-[2rem] leading-none">{item.value}</p>
                <p className="mt-1.5 text-[12px] text-muted">{item.label}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-lg border border-dashed border-line p-6">
        <p className="eyebrow mb-3">Vender esta base para outro estúdio</p>
        <ol className="space-y-2 text-[13.5px] leading-relaxed text-muted">
          <li>1. Duplique a instalação e aponte para um banco novo.</li>
          <li>2. Ajuste marca e conteúdo por estas telas — sem tocar em código.</li>
          <li>3. Cadastre unidades, equipe, catálogo e preços pela área da gestão.</li>
          <li>4. Pré-visualize o site inteiro e publique.</li>
        </ol>
        <p className="mt-4 text-[12.5px] text-muted">
          Se um pedido de personalização beneficiar vários clientes, ele vira configuração no
          produto-base. Se for específico demais, vira opção desligada por padrão — nunca um fork.
        </p>
      </section>
    </div>
  );
}
