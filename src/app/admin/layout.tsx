import {
  CalendarDays,
  Gift,
  Heart,
  LayoutDashboard,
  MapPin,
  PartyPopper,
  Scissors,
  Sparkles,
  Users,
} from 'lucide-react';
import { requireStaff } from '@/lib/auth/guards';
import { getBrand } from '@/lib/brand/server';
import { db } from '@/lib/db';
import { endOfDay, startOfDay } from '@/lib/datetime';
import { AppShell } from '@/components/nav/app-shell';
import { ROLE_LABEL } from '@/lib/constants';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, brand] = await Promise.all([requireStaff(), getBrand()]);

  const todayCount = await db.appointment.count({
    where: {
      startAt: { gte: startOfDay(new Date()), lte: endOfDay(new Date()) },
      status: { notIn: ['CANCELLED'] },
    },
  });

  return (
    <AppShell
      areaLabel="Gestão do estúdio"
      user={{ name: user.name, role: ROLE_LABEL[user.role], avatarUrl: user.avatarUrl }}
      links={[
        { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={17} />, exact: true },
        { href: '/admin/agenda', label: 'Agenda', icon: <CalendarDays size={17} />, badge: todayCount },
        { href: '/admin/clientes', label: 'Clientes', icon: <Users size={17} /> },
        { href: '/admin/retencao', label: 'Retenção', icon: <Heart size={17} /> },
        { href: '/admin/profissionais', label: 'Profissionais', icon: <Sparkles size={17} /> },
        { href: '/admin/servicos', label: 'Serviços e preços', icon: <Scissors size={17} /> },
        ...(brand.features.packages || brand.features.beautyClub
          ? [{ href: '/admin/programas', label: 'Pacotes e clube', icon: <Gift size={17} /> }]
          : []),
        ...(brand.features.events
          ? [{ href: '/admin/eventos', label: 'Eventos e noivas', icon: <PartyPopper size={17} /> }]
          : []),
        { href: '/admin/unidades', label: 'Unidades', icon: <MapPin size={17} /> },
      ]}
    >
      {children}
    </AppShell>
  );
}
