import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { requireCustomer } from '@/lib/auth/guards';
import { ProfileForm } from './profile-form';
import { LogoutButton } from './logout-button';
import { Card } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Meu perfil' };

export default async function ProfilePage() {
  const user = await requireCustomer();

  const [customer, professionals, preferences] = await Promise.all([
    db.customer.findUnique({ where: { id: user.customerId } }),
    db.professional.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, displayName: true, title: true },
    }),
    db.customerPreference.findMany({ where: { customerId: user.customerId } }),
  ]);

  if (!customer) return null;

  return (
    <div className="max-w-2xl space-y-8">
      <ProfileForm
        customer={{
          name: customer.name,
          phone: customer.phone,
          email: customer.email ?? user.email,
          birthDate: customer.birthDate ? customer.birthDate.toISOString().slice(0, 10) : '',
          consentPhotos: customer.consentPhotos,
          consentMarketing: customer.consentMarketing,
          preferredProfessionalId: customer.preferredProfessionalId ?? '',
          notes: customer.notes ?? '',
        }}
        professionals={professionals}
      />

      {preferences.length > 0 ? (
        <Card className="p-6">
          <p className="eyebrow mb-4">O que o estúdio já sabe sobre você</p>
          <dl className="divide-y divide-line border-y border-line">
            {preferences.map((preference) => (
              <div key={preference.id} className="flex justify-between gap-6 py-3">
                <dt className="text-[13px] text-muted">{preference.key}</dt>
                <dd className="text-right text-[13.5px] font-medium">{preference.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-[12.5px] leading-relaxed text-muted">
            Essas anotações vêm dos seus atendimentos. Se algo mudou, conte para a profissional na
            próxima visita.
          </p>
        </Card>
      ) : null}

      <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <p className="text-[14px] font-medium">Sair da conta</p>
          <p className="mt-0.5 text-[12.5px] text-muted">
            Você continua podendo ver o catálogo sem estar conectada.
          </p>
        </div>
        <LogoutButton />
      </Card>
    </div>
  );
}
