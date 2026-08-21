import type { Metadata } from 'next';
import { requireRole } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { formatDateTime } from '@/lib/datetime';
import { ROLE_LABEL, type Role } from '@/lib/constants';
import { Avatar, Badge, Card } from '@/components/ui/primitives';
import { EmptyState } from '@/components/ui/states';

export const metadata: Metadata = { title: 'Auditoria' };
export const dynamic = 'force-dynamic';

const ACTION_LABEL: Record<string, string> = {
  'auth.login': 'Entrou no sistema',
  'auth.register': 'Criou conta',
  'appointment.create': 'Criou agendamento',
  'appointment.reschedule': 'Remarcou agendamento',
  'appointment.cancel': 'Cancelou agendamento',
  'appointment.status': 'Alterou status do atendimento',
  'procedure.save': 'Registrou ficha técnica',
  'procedure.photo': 'Adicionou foto de atendimento',
  'portfolio.create': 'Publicou no portfólio',
  'portfolio.remove': 'Removeu item do portfólio',
  'block.create': 'Bloqueou período na agenda',
  'block.remove': 'Removeu bloqueio',
  'customer.note': 'Anotou na ficha da cliente',
  'customer.updateProfile': 'Atualizou o próprio perfil',
  'service.update': 'Alterou serviço ou preço',
  'branding.draft': 'Salvou rascunho da marca',
  'content.draft': 'Salvou rascunho de conteúdo',
  'setting.publish': 'Publicou configuração',
  'setting.discard': 'Descartou rascunho',
  'subscription.create': 'Assinou o Beauty Club',
  'subscription.cancel': 'Cancelou assinatura',
  'waitlist.join': 'Entrou na lista de espera',
};

export default async function AuditPage() {
  await requireRole(['PRODUCT_MANAGER', 'OWNER']);

  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 120,
    include: { user: { select: { name: true, role: true, avatarUrl: true } } },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8">
        <p className="eyebrow">Segurança</p>
        <h1 className="mt-3 font-display text-[2.4rem] leading-none">Auditoria</h1>
        <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted">
          Registro de quem fez o quê. Preços, permissões, fotos e configurações passam por aqui —
          é o que permite responder “quem alterou isso?” sem adivinhação.
        </p>
      </header>

      {logs.length === 0 ? (
        <EmptyState title="Sem registros" description="As ações do sistema aparecem aqui." />
      ) : (
        <Card className="divide-y divide-line">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-4 px-5 py-3.5">
              <Avatar
                name={log.user?.name ?? 'Sistema'}
                src={log.user?.avatarUrl}
                size="sm"
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px]">
                  <span className="font-medium">{log.user?.name ?? 'Sistema'}</span>{' '}
                  <span className="text-muted">
                    {ACTION_LABEL[log.action] ?? log.action}
                  </span>
                </p>
                <p className="mt-0.5 text-[12px] text-muted">
                  {formatDateTime(log.createdAt)} · {log.entity}
                  {log.entityId ? ` #${log.entityId.slice(-6)}` : ''}
                </p>
                {log.meta ? (
                  <p className="mt-1 truncate font-mono text-[11px] text-muted/80">{log.meta}</p>
                ) : null}
              </div>
              {log.user ? (
                <Badge tone="outline">{ROLE_LABEL[log.user.role as Role] ?? log.user.role}</Badge>
              ) : null}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
