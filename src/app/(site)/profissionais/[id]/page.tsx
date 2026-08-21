import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Instagram, MapPin, Star } from 'lucide-react';
import { db } from '@/lib/db';
import { formatDuration } from '@/lib/datetime';
import { formatPriceShort, groupBy, parseList } from '@/lib/utils';
import { Avatar, Badge, Button, Card, Container } from '@/components/ui/primitives';
import { SmartImage } from '@/components/ui/media';
import { EmptyState } from '@/components/ui/states';
import { PortfolioGallery } from '@/components/portfolio-gallery';
import { getBrand } from '@/lib/brand/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const professional = await db.professional.findUnique({ where: { id } });
  if (!professional) return { title: 'Profissional' };
  return {
    title: professional.displayName,
    description: professional.bio ?? professional.title ?? undefined,
  };
}

export default async function ProfessionalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const brand = await getBrand();

  const professional = await db.professional.findUnique({
    where: { id },
    include: {
      branches: { include: { branch: true } },
      services: {
        where: { service: { isActive: true } },
        include: { service: { include: { category: { select: { name: true, slug: true } } } } },
      },
      portfolio: {
        where: { visibility: 'PUBLIC_PORTFOLIO' },
        orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
        include: {
          professional: { select: { id: true, displayName: true, avatarUrl: true } },
          category: { select: { name: true, slug: true } },
        },
      },
      reviews: {
        where: { isPublic: true },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { customer: { select: { name: true } } },
      },
      hours: { orderBy: { weekday: 'asc' } },
    },
  });

  if (!professional || !professional.isActive) notFound();

  const specialties = parseList(professional.specialties);
  const byCategory = groupBy(professional.services, (offer) => offer.service.category.name);

  return (
    <>
      <div className="relative">
        <SmartImage
          src={professional.coverUrl ?? professional.avatarUrl}
          alt={professional.displayName}
          seed={professional.displayName}
          overlay
          className="h-[46vh] min-h-[340px] w-full"
        />
        <Container size="wide" className="absolute inset-x-0 bottom-0 pb-10">
          <Link
            href="/profissionais"
            className="mb-5 inline-flex items-center gap-1.5 text-[12.5px] text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft size={14} />
            Toda a equipe
          </Link>
          <div className="flex flex-wrap items-end gap-5">
            <Avatar
              name={professional.displayName}
              src={professional.avatarUrl}
              size="xl"
              className="ring-2 ring-white/25"
            />
            <div>
              <h1 className="font-display text-[2.6rem] leading-none text-white sm:text-[3.4rem]">
                {professional.displayName}
              </h1>
              {professional.title ? (
                <p className="mt-2 text-[14px] text-white/70">{professional.title}</p>
              ) : null}
            </div>
          </div>
        </Container>
      </div>

      <Container size="wide" className="py-12 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
          <div className="min-w-0">
            {professional.bio ? (
              <p className="max-w-2xl text-[16px] leading-relaxed text-ink/85">{professional.bio}</p>
            ) : null}

            {specialties.length ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {specialties.map((item) => (
                  <Badge key={item} tone="neutral">
                    {item}
                  </Badge>
                ))}
              </div>
            ) : null}

            {brand.features.portfolio ? (
              <section className="mt-14">
                <h2 className="font-display text-[2rem]">Portfólio</h2>
                <p className="mt-2 text-[14px] text-muted">
                  Trabalhos autorizados pelas clientes. Toque para ampliar.
                </p>
                <div className="mt-7">
                  {professional.portfolio.length ? (
                    <PortfolioGallery items={professional.portfolio} columns={3} />
                  ) : (
                    <EmptyState
                      compact
                      title="Portfólio em construção"
                      description="Os trabalhos aparecem aqui assim que forem autorizados pelas clientes."
                    />
                  )}
                </div>
              </section>
            ) : null}

            <section className="mt-16">
              <h2 className="font-display text-[2rem]">Serviços</h2>
              <div className="mt-7 space-y-8">
                {Object.entries(byCategory).map(([categoryName, offers]) => (
                  <div key={categoryName}>
                    <p className="eyebrow mb-3">{categoryName}</p>
                    <ul className="divide-y divide-line border-y border-line">
                      {offers.map((offer) => (
                        <li key={offer.serviceId} className="flex items-center justify-between gap-6 py-3.5">
                          <div className="min-w-0">
                            <p className="truncate text-[14.5px] font-medium">{offer.service.name}</p>
                            <p className="mt-0.5 text-[12.5px] text-muted">
                              {formatDuration(offer.customDuration ?? offer.service.duration)}
                              {offer.customPrice ? ' · valor próprio' : ''}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-4">
                            <span className="whitespace-nowrap text-[14px]">
                              {formatPriceShort(
                                offer.customPrice ?? offer.service.price,
                                offer.service.priceType,
                              )}
                            </span>
                            <Button
                              href={`/agendar?servico=${offer.service.slug}&profissional=${professional.id}`}
                              variant="secondary"
                              size="sm"
                            >
                              Agendar
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {brand.features.reviews && professional.reviews.length ? (
              <section className="mt-16">
                <h2 className="font-display text-[2rem]">O que as clientes dizem</h2>
                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  {professional.reviews.map((review) => (
                    <Card key={review.id} className="p-5">
                      <div className="flex gap-0.5 text-accent" aria-label={`${review.rating} de 5`}>
                        {Array.from({ length: review.rating }).map((_, index) => (
                          <Star key={index} size={12} fill="currentColor" strokeWidth={0} />
                        ))}
                      </div>
                      <p className="mt-3 text-[13.5px] leading-relaxed text-ink/85">
                        “{review.comment}”
                      </p>
                      <p className="mt-3 text-[12px] text-muted">{review.customer.name}</p>
                    </Card>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          {/* Coluna de ação: fica fixa no desktop, colada ao fim no celular. */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <Card className="p-6">
              <p className="eyebrow mb-4">Agendar com {professional.displayName.split(' ')[0]}</p>
              <Button href={`/agendar?profissional=${professional.id}`} size="lg" fullWidth>
                Ver horários disponíveis
              </Button>
              {!professional.acceptsNewClients ? (
                <p className="mt-3 text-[12.5px] text-muted">
                  Agenda com alta procura — pode haver espera para novos horários.
                </p>
              ) : null}

              <div className="mt-6 border-t border-line pt-5">
                <p className="eyebrow mb-3">Atende em</p>
                <ul className="space-y-2.5">
                  {professional.branches.map((link) => (
                    <li key={link.branchId} className="flex gap-2 text-[13px] text-ink/80">
                      <MapPin size={14} className="mt-0.5 shrink-0 text-muted" />
                      <span>
                        {link.branch.name}
                        <span className="block text-[12px] text-muted">{link.branch.address}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {professional.instagram ? (
                <a
                  href={`https://instagram.com/${professional.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 flex items-center gap-2 border-t border-line pt-5 text-[13px] text-ink/70 transition-colors hover:text-ink"
                >
                  <Instagram size={15} />@{professional.instagram}
                </a>
              ) : null}
            </Card>
          </aside>
        </div>
      </Container>
    </>
  );
}
