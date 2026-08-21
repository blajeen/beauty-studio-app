import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { getBrand } from '@/lib/brand/server';
import { Button, Container } from '@/components/ui/primitives';
import { PortfolioGallery } from '@/components/portfolio-gallery';
import { EmptyState } from '@/components/ui/states';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Portfólio',
  description: 'Trabalhos reais das profissionais do estúdio: unhas, sobrancelhas, cílios e maquiagem.',
};

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const brand = await getBrand();
  if (!brand.features.portfolio) notFound();

  const { categoria } = await searchParams;

  const [categories, items, professionals] = await Promise.all([
    db.serviceCategory.findMany({
      where: { isActive: true, portfolio: { some: { visibility: 'PUBLIC_PORTFOLIO' } } },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, slug: true },
    }),
    db.portfolioItem.findMany({
      where: {
        visibility: 'PUBLIC_PORTFOLIO',
        ...(categoria ? { category: { slug: categoria } } : {}),
      },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
      include: {
        professional: { select: { id: true, displayName: true, avatarUrl: true } },
        category: { select: { name: true, slug: true } },
      },
    }),
    db.professional.findMany({
      where: { isActive: true, portfolio: { some: { visibility: 'PUBLIC_PORTFOLIO' } } },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, displayName: true, avatarUrl: true },
    }),
  ]);

  return (
    <Container size="wide" className="py-12 sm:py-16">
      <div className="max-w-2xl">
        <p className="eyebrow">Portfólio</p>
        <h1 className="mt-4 font-display text-[2.8rem] leading-[1.04] sm:text-[3.6rem]">
          Inspiração antes de agendar
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          Cada trabalho aqui foi autorizado pela cliente. Encontrou algo que gostou? Salve como
          inspiração e envie para a profissional na hora de marcar.
        </p>
      </div>

      <nav
        aria-label="Categorias do portfólio"
        className="scrollbar-none -mx-5 mt-10 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0"
      >
        <CategoryLink href="/portfolio" active={!categoria}>
          Tudo
        </CategoryLink>
        {categories.map((category) => (
          <CategoryLink
            key={category.id}
            href={`/portfolio?categoria=${category.slug}`}
            active={categoria === category.slug}
          >
            {category.name}
          </CategoryLink>
        ))}
      </nav>

      <div className="mt-10">
        {items.length === 0 ? (
          <EmptyState
            title="Ainda não há trabalhos nesta categoria"
            description="Veja as outras categorias ou fale com a equipe para conhecer o estilo de cada profissional."
            action={<Button href="/portfolio">Ver tudo</Button>}
          />
        ) : (
          <PortfolioGallery items={items} showFilters professionals={professionals} />
        )}
      </div>

      <div className="mt-16 rounded-lg bg-secondary px-8 py-14 text-center text-white sm:px-16">
        <h2 className="mx-auto max-w-xl font-display text-[2rem] leading-tight sm:text-[2.6rem]">
          Encontrou a referência certa?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-white/65">
          Salve nas suas inspirações e envie para a profissional junto com o agendamento. Ela chega
          ao atendimento já sabendo o que você quer.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button href="/agendar" size="lg" className="bg-white text-secondary hover:opacity-90">
            Agendar horário
          </Button>
          {brand.features.inspiration ? (
            <Button
              href="/minha-conta/inspiracoes"
              size="lg"
              className="border border-white/25 bg-transparent text-white hover:bg-white/10"
            >
              Minhas inspirações
            </Button>
          ) : null}
        </div>
      </div>
    </Container>
  );
}

function CategoryLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'shrink-0 rounded-full border px-4 py-2 text-[13px] transition-colors',
        active
          ? 'border-ink bg-primary text-primary-contrast'
          : 'border-line bg-surface text-ink/70 hover:border-ink/35 hover:text-ink',
      )}
    >
      {children}
    </Link>
  );
}
