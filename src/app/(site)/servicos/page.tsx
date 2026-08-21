import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { getBrand } from '@/lib/brand/server';
import { formatDuration } from '@/lib/datetime';
import { formatPriceShort } from '@/lib/utils';
import { Button, Container, SectionHeading } from '@/components/ui/primitives';
import { ServiceCard } from '@/components/cards';
import { HelpBlock } from '@/components/whatsapp-button';
import { PriceLegend } from '@/components/price-legend';

export const metadata: Metadata = {
  title: 'Serviços',
  description: 'Catálogo completo do estúdio: unhas, sobrancelhas, cílios, maquiagem e estética.',
};

type CatalogService = {
  id: string;
  imageUrl: string | null;
  isFeatured: boolean;
};

/**
 * Divide a categoria em destaques visuais e o resto do catálogo.
 *
 * Só vira cartão o serviço que tem fotografia própria, e só quando há três —
 * um cartão solitário desequilibra a grade, e repetir a mesma imagem em
 * cartões vizinhos empobrece a vitrine. O que não vira cartão aparece na
 * lista logo abaixo, sem repetição.
 */
function splitCatalog<T extends CatalogService>(services: T[]): { cards: T[]; rest: T[] } {
  const withPhoto = services
    .filter((service) => Boolean(service.imageUrl))
    .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured))
    .slice(0, 3);

  if (withPhoto.length < 3) return { cards: [], rest: services };

  const highlighted = new Set(withPhoto.map((service) => service.id));
  return { cards: withPhoto, rest: services.filter((service) => !highlighted.has(service.id)) };
}

export default async function ServicesPage() {
  const [categories, brand] = await Promise.all([
    db.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        services: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      },
    }),
    getBrand(),
  ]);

  return (
    <Container size="wide" className="py-12 sm:py-16">
      <div className="max-w-3xl">
        <p className="eyebrow">Catálogo</p>
        <h1 className="mt-4 font-display text-[2.8rem] leading-[1.04] sm:text-[3.6rem]">
          Tudo o que fazemos
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          Preços e durações são os praticados no estúdio. Serviços marcados como “a partir de”
          variam conforme o comprimento, a técnica ou a avaliação no dia.
        </p>
      </div>

      {/* Navegação por categoria: no celular vira um trilho horizontal. */}
      <nav
        aria-label="Categorias"
        className="scrollbar-none sticky top-16 z-30 -mx-5 mt-10 flex gap-2 overflow-x-auto bg-canvas/90 px-5 py-3 backdrop-blur-md sm:top-[72px] sm:mx-0 sm:px-0"
      >
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/servicos/${category.slug}`}
            className="shrink-0 rounded-full border border-line px-4 py-2 text-[13px] text-ink/75 transition-colors hover:border-ink/40 hover:text-ink"
          >
            {category.name}
          </Link>
        ))}
      </nav>

      <div className="mt-6 space-y-20">
        {categories.map((category) => {
          const { cards, rest } = splitCatalog(category.services);
          return (
          <section key={category.id} id={category.slug} className="scroll-mt-32">
            <SectionHeading
              eyebrow={category.tagline ?? undefined}
              title={category.name}
              description={category.description}
              action={
                <Button href={`/servicos/${category.slug}`} variant="link">
                  Ver categoria
                </Button>
              }
            />
            {cards.length > 0 ? (
              <div className="stagger mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {cards.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    href={`/agendar?servico=${service.slug}`}
                    action={
                      <span className="text-[12px] uppercase tracking-[0.12em] text-ink/60">
                        Agendar
                      </span>
                    }
                  />
                ))}
              </div>
            ) : null}

            {/* O restante da categoria em lista densa e legível. */}
            <ul className="mt-8 divide-y divide-line border-y border-line">
              {rest.map((service) => (
                <li key={service.id}>
                  <Link
                    href={`/agendar?servico=${service.slug}`}
                    className="flex flex-wrap items-center gap-x-6 gap-y-1 py-3.5 transition-colors hover:bg-primary-soft/50"
                  >
                    <span className="min-w-0 flex-1 text-[14.5px]">{service.name}</span>
                    <span className="shrink-0 text-[12.5px] text-muted">
                      {formatDuration(service.duration)}
                    </span>
                    <span className="w-40 shrink-0 text-right text-[14px] font-medium">
                      {formatPriceShort(service.price, service.priceType)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          );
        })}
      </div>

      <PriceLegend className="mt-20" />

      <div className="mt-8">
        <HelpBlock
          message={`Olá! Estou vendo o catálogo do ${brand.name} e gostaria de uma recomendação de serviço.`}
          title="Não sabe por onde começar?"
          description="Conte o que você quer e a equipe indica o serviço certo."
        />
      </div>
    </Container>
  );
}
