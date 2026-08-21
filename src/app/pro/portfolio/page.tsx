import type { Metadata } from 'next';
import { requireProfessional } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { PortfolioManager } from './portfolio-manager';

export const metadata: Metadata = { title: 'Meu portfólio' };
export const dynamic = 'force-dynamic';

export default async function ProPortfolioPage() {
  const user = await requireProfessional();

  const [items, services] = await Promise.all([
    db.portfolioItem.findMany({
      where: { professionalId: user.professionalId },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      include: { service: { select: { name: true } } },
    }),
    db.service.findMany({
      where: { isActive: true, professionals: { some: { professionalId: user.professionalId } } },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <PortfolioManager
      items={items.map((item) => ({
        id: item.id,
        title: item.title,
        imageUrl: item.imageUrl,
        technique: item.technique,
        styleTags: item.styleTags,
        visibility: item.visibility,
        isFeatured: item.isFeatured,
        serviceName: item.service?.name ?? null,
      }))}
      services={services}
    />
  );
}
