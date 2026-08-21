import 'server-only';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import type { Role } from '@/lib/constants';
import { getCurrentUser, type SessionUser } from './session';

/**
 * RBAC — matriz única de permissões (seção 38 e 68).
 * Toda verificação de acesso passa por `can()`; nenhuma tela decide sozinha.
 */
export const PERMISSIONS = {
  'agenda.viewAll': ['OWNER', 'MANAGER'],
  'agenda.viewOwn': ['OWNER', 'MANAGER', 'PROFESSIONAL'],
  'agenda.block': ['OWNER', 'MANAGER', 'PROFESSIONAL'],
  'appointment.create': ['OWNER', 'MANAGER', 'PROFESSIONAL', 'CUSTOMER'],
  'appointment.updateAny': ['OWNER', 'MANAGER'],
  'appointment.complete': ['OWNER', 'MANAGER', 'PROFESSIONAL'],
  'customer.viewAll': ['OWNER', 'MANAGER'],
  'customer.viewOwnClients': ['OWNER', 'MANAGER', 'PROFESSIONAL'],
  'customer.edit': ['OWNER', 'MANAGER'],
  'procedure.record': ['OWNER', 'MANAGER', 'PROFESSIONAL'],
  'portfolio.manageOwn': ['OWNER', 'MANAGER', 'PROFESSIONAL'],
  'portfolio.manageAny': ['OWNER', 'MANAGER'],
  'service.manage': ['OWNER', 'MANAGER', 'PRODUCT_MANAGER'],
  'pricing.manage': ['OWNER', 'MANAGER', 'PRODUCT_MANAGER'],
  'professional.manage': ['OWNER', 'MANAGER'],
  'branch.manage': ['OWNER', 'MANAGER', 'PRODUCT_MANAGER'],
  'package.manage': ['OWNER', 'MANAGER', 'PRODUCT_MANAGER'],
  'plan.manage': ['OWNER', 'MANAGER', 'PRODUCT_MANAGER'],
  'event.manage': ['OWNER', 'MANAGER'],
  'dashboard.view': ['OWNER', 'MANAGER'],
  'finance.view': ['OWNER'],
  'branding.manage': ['PRODUCT_MANAGER', 'OWNER'],
  'content.manage': ['PRODUCT_MANAGER', 'OWNER'],
  'audit.view': ['OWNER', 'PRODUCT_MANAGER'],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

export async function requireUser(redirectTo = '/entrar'): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(redirectTo);
  return user;
}

export async function requireRole(roles: Role[], redirectTo = '/entrar'): Promise<SessionUser> {
  const user = await requireUser(redirectTo);
  if (!roles.includes(user.role)) redirect('/sem-acesso');
  return user;
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user.role, permission)) redirect('/sem-acesso');
  return user;
}

/** Área administrativa: dona e gestão. */
export async function requireStaff(): Promise<SessionUser> {
  return requireRole(['OWNER', 'MANAGER']);
}

/** Área da profissional — devolve o vínculo já resolvido. */
export async function requireProfessional(): Promise<SessionUser & { professionalId: string }> {
  const user = await requireRole(['PROFESSIONAL', 'OWNER', 'MANAGER']);
  if (!user.professionalId) redirect('/sem-acesso');
  return user as SessionUser & { professionalId: string };
}

/**
 * Área da cliente. Uma conta de cliente sempre tem ficha; se não houver
 * (conta criada pela gestão), criamos sob demanda para não travar o fluxo.
 */
export async function requireCustomer(): Promise<SessionUser & { customerId: string }> {
  const user = await requireUser();
  if (user.customerId) return user as SessionUser & { customerId: string };

  const created = await db.customer.create({
    data: { userId: user.id, name: user.name, email: user.email, phone: '' },
  });
  return { ...user, customerId: created.id };
}

export type AuthError = { ok: false; error: string };
export type AuthOk<T> = { ok: true } & T;

/** Guard para Server Actions: devolve erro em vez de redirecionar. */
export async function guardAction(permission: Permission) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: 'Sessão expirada. Entre novamente.' };
  if (!can(user.role, permission)) {
    return { ok: false as const, error: 'Você não tem permissão para esta ação.' };
  }
  return { ok: true as const, user };
}

export async function audit(
  action: string,
  entity: string,
  entityId?: string | null,
  meta?: unknown,
  userId?: string | null,
) {
  await db.auditLog
    .create({
      data: {
        action,
        entity,
        entityId: entityId ?? null,
        meta: meta ? JSON.stringify(meta) : null,
        userId: userId ?? null,
      },
    })
    .catch(() => null);
}
