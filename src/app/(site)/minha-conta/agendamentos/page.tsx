import type { Metadata } from 'next';
import { CalendarPlus } from 'lucide-react';
import { requireCustomer } from '@/lib/auth/guards';
import { getPastAppointments, getUpcomingAppointments } from '@/lib/data/customer';
import { Button } from '@/components/ui/primitives';
import { EmptyState } from '@/components/ui/states';
import { AppointmentCard } from '@/components/cards';

export const metadata: Metadata = { title: 'Meus horários' };

export default async function AppointmentsPage() {
  const user = await requireCustomer();
  const [upcoming, past] = await Promise.all([
    getUpcomingAppointments(user.customerId, 20),
    getPastAppointments(user.customerId, 20),
  ]);

  return (
    <div className="max-w-3xl space-y-12">
      <section>
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl">Próximos</h2>
          <Button href="/agendar" size="sm">
            Agendar
          </Button>
        </div>
        <div className="mt-5 space-y-3">
          {upcoming.length === 0 ? (
            <EmptyState
              compact
              icon={<CalendarPlus size={20} />}
              title="Nenhum horário marcado"
              description="Quando você agendar, tudo aparece aqui — inclusive o roteiro de dias com vários serviços."
              action={<Button href="/agendar">Agendar horário</Button>}
            />
          ) : (
            upcoming.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                href={`/minha-conta/agendamentos/${appointment.id}`}
              />
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl">Anteriores</h2>
        <div className="mt-5 space-y-3">
          {past.length === 0 ? (
            <EmptyState compact title="Ainda sem histórico" description="Seus atendimentos ficam registrados aqui." />
          ) : (
            past.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                href={`/minha-conta/agendamentos/${appointment.id}`}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
