import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, RotateCcw } from 'lucide-react';
import { db } from '@/lib/db';
import { formatDuration } from '@/lib/datetime';
import { formatPrice, parseList, pluralize } from '@/lib/utils';
import { Avatar, Badge, Button, Card, Container } from '@/components/ui/primitives';
import { SmartImage } from '@/components/ui/media';
import { EmptyState } from '@/components/ui/states';
import { PriceLegend } from '@/components/price-legend';
import { HelpBlock } from '@/components/whatsapp-button';

export async function generateStaticParams() {
  const categories = await db.serviceCategory.findMany({ select: { slug: true } });
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await db.serviceCategory.findUnique({ where: { slug } });
  if (!category) return { title: 'Serviço' };
  return { title: category.name, description: category.description ?? category.tagline ?? undefined };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const category = await db.serviceCategory.findUnique({
    where: { slug },
    include: {
      services: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          professionals: {
            where: { professional: { isActive: true } },
            include: {
              professional: { select: { id: true, displayName: true, avatarUrl: true, title: true } },
            },
          },
        },
      },
    },
  });

  if (!category) notFound();

  const professionals = new Map<
    string,
    { id: string; displayName: string; avatarUrl: string | null; title: string | null }
  >();
  for (const service of category.services) {
    for (const offer of service.professionals) professionals.set(offer.professionalId, offer.professional);
  }

  return (
    <>
      <div className="relative">
        <SmartImage
          src={category.coverImage}
          alt={category.name}
          seed={category.name}
          overlay
          className="h-[44vh] min-h-[320px] w-full"
        />
        <Container size="wide" className="absolute inset-x-0 bottom-0 pb-10">
          <Link
            href="/servicos"
            className="mb-5 inline-flex items-center gap-1.5 text-[12.5px] text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft size={14} />
            Todos os serviços
          </Link>
          <h1 className="font-display text-[2.8rem] leading-none text-white sm:text-[4rem]">
            {category.name}
          </h1>
          {category.tagline ? (
            <p className="mt-3 max-w-xl text-[14px] text-white/70">{category.tagline}</p>
          ) : null}
        </Container>
      </div>

      <Container size="wide" className="py-12 sm:py-16">
        {category.description ? (
          <p className="max-w-2xl text-[15.5px] leading-relaxed text-muted">{category.description}</p>
        ) : null}

        {category.services.length === 0 ? (
          <EmptyState
            className="mt-10"
            title="Nenhum serviço nesta categoria"
            description="A equipe está atualizando o catálogo. Fale com a gente pelo WhatsApp enquanto isso."
          />
        ) : (
          <div className="mt-10 divide-y divide-line border-y border-line">
            {category.services.map((service) => (
              <article key={service.id} className="grid gap-5 py-7 sm:grid-cols-[1fr_auto] sm:gap-10">
                <div>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h2 className="font-display text-[1.6rem] leading-tight">{service.name}</h2>
                    {service.isFeatured ? <Badge tone="accent">Popular</Badge> : null}
                    {service.requiresPatchTest ? (
                      <Badge tone="outline">Requer teste de alergia</Badge>
                    ) : null}
                  </div>

                  {service.shortDescription ? (
                    <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted">
                      {service.shortDescription}
                    </p>
                  ) : null}

                  <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12.5px] text-muted">
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} />
                      {formatDuration(service.duration)}
                    </span>
                    {service.returnIntervalDays ? (
                      <span className="flex items-center gap-1.5">
                        <RotateCcw size={13} />
                        retorno sugerido a cada {service.returnIntervalDays} dias
                      </span>
                    ) : null}
                    {service.professionals.length ? (
                      <span>
                        {pluralize(service.professionals.length, 'profissional', 'profissionais')}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-6 sm:flex-col sm:items-end sm:justify-center">
                  <p className="whitespace-nowrap text-right font-display text-2xl">
                    {formatPrice(service.price, service.priceType)}
                  </p>
                  <Button href={`/agendar?servico=${service.slug}`} size="sm">
                    Agendar
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}

        {professionals.size > 0 ? (
          <section className="mt-16">
            <p className="eyebrow mb-5">Quem atende nesta categoria</p>
            <div className="flex flex-wrap gap-3">
              {Array.from(professionals.values()).map((professional) => (
                <Link key={professional.id} href={`/profissionais/${professional.id}`}>
                  <Card className="flex items-center gap-3 p-3 pr-5 transition-colors hover:border-ink/25">
                    <Avatar name={professional.displayName} src={professional.avatarUrl} size="sm" />
                    <span>
                      <span className="block text-[13.5px] font-medium">
                        {professional.displayName}
                      </span>
                      <span className="block text-[12px] text-muted">{professional.title}</span>
                    </span>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <PriceLegend className="mt-16" />

        <div className="mt-6">
          <HelpBlock
            message={`Olá! Tenho uma dúvida sobre os serviços de ${category.name.toLowerCase()}.`}
          />
        </div>
      </Container>
    </>
  );
}
