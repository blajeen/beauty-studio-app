import { FileText, Palette, Settings2, ShieldCheck } from 'lucide-react';
import { requireRole } from '@/lib/auth/guards';
import { AppShell } from '@/components/nav/app-shell';
import { ROLE_LABEL } from '@/lib/constants';

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(['PRODUCT_MANAGER', 'OWNER']);

  return (
    <AppShell
      areaLabel="Configuração do produto"
      user={{ name: user.name, role: ROLE_LABEL[user.role], avatarUrl: user.avatarUrl }}
      links={[
        { href: '/studio', label: 'Visão geral', icon: <Settings2 size={17} />, exact: true },
        { href: '/studio/marca', label: 'Marca', icon: <Palette size={17} /> },
        { href: '/studio/conteudo', label: 'Conteúdo', icon: <FileText size={17} /> },
        { href: '/studio/auditoria', label: 'Auditoria', icon: <ShieldCheck size={17} /> },
      ]}
    >
      {children}
    </AppShell>
  );
}
