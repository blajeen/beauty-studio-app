import type { Metadata } from 'next';
import { requireStaff } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { ServiceTable } from './service-table';

export const metadata: Metadata = { title: 'Serviços e preços' };
export const dynamic = 'force-dynamic';

export default async function AdminServicesPage() {
  await requireStaff();

  const categories = await db.serviceCategory.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      services: {
        orderBy: { sortOrder: 'asc' },
        include: {
          professionals: { select: { professionalId: true } },
          _count: { select: { appointmentItems: true } },
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <p className="eyebrow">Catálogo</p>
        <h1 className="mt-3 font-display text-[2.4rem] leading-none">Serviços e preços</h1>
        <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted">
          Alterar um preço aqui muda o catálogo, o app e os novos agendamentos na hora. Reservas já
          confirmadas mantêm o valor combinado.
        </p>
      </header>

      <ServiceTable
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
          services: category.services.map((service) => ({
            id: service.id,
            name: service.name,
            shortDescription: service.shortDescription,
            price: service.price,
            priceType: service.priceType,
            duration: service.duration,
            bufferAfter: service.bufferAfter,
            returnIntervalDays: service.returnIntervalDays,
            isActive: service.isActive,
            isFeatured: service.isFeatured,
            professionals: service.professionals.length,
            bookings: service._count.appointmentItems,
          })),
        }))}
      />
    </div>
  );
}
