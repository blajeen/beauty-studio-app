import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireCustomer } from '@/lib/auth/guards';
import { getBrand } from '@/lib/brand/server';
import { InspirationBoard } from './inspiration-board';

export const metadata: Metadata = { title: 'Minhas inspirações' };

export default async function InspirationsPage() {
  const brand = await getBrand();
  if (!brand.features.inspiration) notFound();

  const user = await requireCustomer();

  const [items, professionals, categories] = await Promise.all([
    db.inspirationImage.findMany({
      where: { customerId: user.customerId },
      orderBy: { createdAt: 'desc' },
      include: { sharedWith: { select: { id: true, displayName: true, avatarUrl: true } } },
    }),
    db.professional.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, displayName: true, avatarUrl: true, title: true },
    }),
    db.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { slug: true, name: true },
    }),
  ]);

  return (
    <InspirationBoard
      items={items.map((item) => ({
        id: item.id,
        imageUrl: item.imageUrl,
        note: item.note,
        categorySlug: item.categorySlug,
        createdAt: item.createdAt.toISOString(),
        sharedWith: item.sharedWith,
      }))}
      professionals={professionals}
      categories={categories}
    />
  );
}
