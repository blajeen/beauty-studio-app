import { CalendarDays, CalendarOff, Images, LayoutGrid, Users } from 'lucide-react';
import { requireProfessional } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { endOfDay, startOfDay } from '@/lib/datetime';
import { AppShell } from '@/components/nav/app-shell';
import { ROLE_LABEL } from '@/lib/constants';

export default async function ProLayout({ children }: { children: React.ReactNode }) {
  const user = await requireProfessional();

  const todayCount = await db.appointmentItem.count({
    where: {
      professionalId: user.professionalId,
      startAt: { gte: startOfDay(new Date()), lte: endOfDay(new Date()) },
      appointment: { status: { notIn: ['CANCELLED'] } },
    },
  });

  return (
    <AppShell
      areaLabel="Área da profissional"
      user={{ name: user.name, role: ROLE_LABEL[user.role], avatarUrl: user.avatarUrl }}
      links={[
        { href: '/pro', label: 'Hoje', icon: <LayoutGrid size={17} />, exact: true, badge: todayCount },
        { href: '/pro/agenda', label: 'Minha agenda', icon: <CalendarDays size={17} /> },
        { href: '/pro/clientes', label: 'Minhas clientes', icon: <Users size={17} /> },
        { href: '/pro/portfolio', label: 'Meu portfólio', icon: <Images size={17} /> },
        { href: '/pro/bloqueios', label: 'Bloqueios', icon: <CalendarOff size={17} /> },
      ]}
    >
      {children}
    </AppShell>
  );
}
