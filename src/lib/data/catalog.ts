import 'server-only';
import { cache } from 'react';
import { db } from '@/lib/db';
import { findFirstAvailable } from '@/lib/scheduling/engine';
import { buildRequests } from '@/lib/scheduling/planner';
import { getBrand } from '@/lib/brand/server';

export const getCategories = cache(async () =>
  db.serviceCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { services: { where: { isActive: true } } } } },
  }),
);

export const getBranches = cache(async () =>
  db.branch.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: { businessHours: { orderBy: { weekday: 'asc' } } },
  }),
);

export const getFeaturedServices = cache(async (take = 6) =>
  db.service.findMany({
    where: { isActive: true, isFeatured: true },
    orderBy: { sortOrder: 'asc' },
    take,
    include: { category: { select: { name: true, slug: true, coverImage: true } } },
  }),
);

export const getProfessionals = cache(async () =>
  db.professional.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      branches: { include: { branch: { select: { id: true, name: true, slug: true } } } },
      _count: { select: { portfolio: { where: { visibility: 'PUBLIC_PORTFOLIO' } } } },
    },
  }),
);

export const getPublicPortfolio = cache(async (take?: number) =>
  db.portfolioItem.findMany({
    where: { visibility: 'PUBLIC_PORTFOLIO' },
    orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
    take,
    include: {
      professional: { select: { id: true, displayName: true, avatarUrl: true } },
      category: { select: { name: true, slug: true } },
      service: { select: { name: true, slug: true } },
    },
  }),
);

export const getPackages = cache(async () =>
  db.package.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: { items: { include: { service: { select: { name: true } } } } },
  }),
);

export const getPlans = cache(async () =>
  db.plan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: { items: { include: { service: { select: { name: true } } } } },
  }),
);

export const getPublicReviews = cache(async (take = 4) =>
  db.review.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: 'desc' },
    take,
    include: {
      customer: { select: { name: true } },
      professional: { select: { displayName: true, avatarUrl: true } },
    },
  }),
);

/**
 * "Primeiro horário disponível" da Home (seção 11).
 * Varre os serviços em destaque e devolve o encaixe mais próximo do estúdio
 * inteiro — a cliente que não sabe o que quer já entra com uma opção pronta.
 */
export const getFirstAvailableHighlight = cache(async () => {
  const brand = await getBrand();
  const [branch, services] = await Promise.all([
    db.branch.findFirst({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
    db.service.findMany({
      where: { isActive: true, isFeatured: true },
      orderBy: { sortOrder: 'asc' },
      take: 4,
      select: { id: true, name: true, slug: true, duration: true, price: true, priceType: true },
    }),
  ]);
  if (!branch || services.length === 0) return null;

  const now = new Date();
  let best: {
    slot: Awaited<ReturnType<typeof findFirstAvailable>>;
    service: (typeof services)[number];
  } | null = null;

  for (const service of services) {
    const { requests } = await buildRequests([{ serviceId: service.id }], branch.id);
    if (requests.length === 0) continue;
    const slot = await findFirstAvailable(branch.id, requests, now, 7, {
      step: brand.booking.slotStep,
      minLeadTimeHours: brand.booking.minLeadTimeHours,
      now,
    });
    if (!slot) continue;
    if (!best || slot.start < best.slot!.start) best = { slot, service };
  }

  if (!best?.slot) return null;

  const professional = await db.professional.findUnique({
    where: { id: best.slot.items[0].professionalId },
    select: { id: true, displayName: true, avatarUrl: true, title: true },
  });

  return {
    start: best.slot.start,
    branch: { id: branch.id, name: branch.name },
    service: best.service,
    professional,
  };
});
