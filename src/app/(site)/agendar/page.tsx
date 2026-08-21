import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { getBrand } from '@/lib/brand/server';
import { getCurrentUser } from '@/lib/auth/session';
import { BookingWizard, type BookingCatalog, type BookingIntent } from './booking-wizard';

export const metadata: Metadata = {
  title: 'Agendar',
  description: 'Escolha os serviços, veja o roteiro montado e confirme o seu horário.',
};

export const dynamic = 'force-dynamic';

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{
    servico?: string;
    profissional?: string;
    pacote?: string;
    unidade?: string;
    ocasiao?: string;
    tipo?: string;
    remarcar?: string;
  }>;
}) {
  const params = await searchParams;
  const [brand, user] = await Promise.all([getBrand(), getCurrentUser()]);

  const [branches, categories, professionals, pack] = await Promise.all([
    db.branch.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, slug: true, address: true, district: true, city: true },
    }),
    db.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        tagline: true,
        services: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            shortDescription: true,
            price: true,
            priceType: true,
            duration: true,
            isFeatured: true,
          },
        },
      },
    }),
    db.professional.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        displayName: true,
        title: true,
        avatarUrl: true,
        specialties: true,
        services: { select: { serviceId: true } },
        branches: { select: { branchId: true } },
      },
    }),
    params.pacote
      ? db.package.findUnique({
          where: { slug: params.pacote },
          include: { items: { select: { serviceId: true, quantity: true } } },
        })
      : null,
  ]);

  const catalog: BookingCatalog = {
    branches,
    categories,
    professionals: professionals.map((professional) => ({
      id: professional.id,
      displayName: professional.displayName,
      title: professional.title,
      avatarUrl: professional.avatarUrl,
      specialties: professional.specialties,
      serviceIds: professional.services.map((offer) => offer.serviceId),
      branchIds: professional.branches.map((link) => link.branchId),
    })),
  };

  // Tradução dos parâmetros de entrada nos caminhos A–E da seção 10.
  const serviceBySlug = new Map(
    categories.flatMap((category) => category.services.map((service) => [service.slug, service.id])),
  );

  const preselectedServices: string[] = [];
  if (params.servico && serviceBySlug.has(params.servico)) {
    preselectedServices.push(serviceBySlug.get(params.servico)!);
  }
  if (pack) {
    for (const item of pack.items) preselectedServices.push(item.serviceId);
    if (pack.serviceId && pack.items.length === 0) preselectedServices.push(pack.serviceId);
  }

  const reschedule = params.remarcar
    ? await db.appointment.findFirst({
        where: {
          id: params.remarcar,
          status: { in: ['PENDING', 'CONFIRMED'] },
          ...(user?.customerId ? { customerId: user.customerId } : {}),
        },
        include: { items: { orderBy: { sortOrder: 'asc' } } },
      })
    : null;

  const intent: BookingIntent = {
    serviceIds: reschedule ? reschedule.items.map((item) => item.serviceId) : preselectedServices,
    professionalId: params.profissional ?? null,
    branchId:
      reschedule?.branchId ??
      branches.find((branch) => branch.slug === params.unidade)?.id ??
      (branches.length === 1 ? branches[0].id : null),
    isEvent: params.ocasiao === '1' || params.tipo === 'WEDDING',
    eventType: params.tipo ?? null,
    packageName: pack?.name ?? null,
    rescheduleId: reschedule?.id ?? null,
    rescheduleCode: reschedule?.code ?? null,
    lockedProfessionals: reschedule
      ? Object.fromEntries(reschedule.items.map((item) => [item.serviceId, item.professionalId]))
      : {},
  };

  return (
    <BookingWizard
      catalog={catalog}
      intent={intent}
      isAuthenticated={Boolean(user)}
      multiBranch={brand.features.multiBranch && branches.length > 1}
      eventsEnabled={brand.features.events}
      waitlistEnabled={brand.features.waitlist}
      cancellationText={brand.policies.cancellationText}
      prepBuffer={brand.booking.eventPrepBuffer}
    />
  );
}
