import 'server-only';
import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { db } from '@/lib/db';
import type { Role } from '@/lib/constants';

const COOKIE_NAME = 'bs_session';
const SESSION_DAYS = 30;

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 24) {
    throw new Error('AUTH_SECRET ausente ou muito curto — defina ao menos 24 caracteres no .env');
  }
  return new TextEncoder().encode(value);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** O token vive no cookie; no banco guardamos apenas o hash, para permitir revogação. */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl: string | null;
  professionalId: string | null;
  customerId: string | null;
};

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const headerList = await headers();

  await db.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
      ip: headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: headerList.get('user-agent')?.slice(0, 255) ?? null,
    },
  });

  const jwt = await new SignJWT({ sub: userId, jti: token })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());

  const store = await cookies();
  store.set(COOKIE_NAME, jwt, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });

  await db.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
}

export async function destroySession() {
  const store = await cookies();
  const jwt = store.get(COOKIE_NAME)?.value;
  if (jwt) {
    try {
      const { payload } = await jwtVerify(jwt, secret());
      const jti = payload.jti as string | undefined;
      if (jti) await db.session.deleteMany({ where: { tokenHash: hashToken(jti) } });
    } catch {
      // token inválido — apenas limpamos o cookie
    }
  }
  store.delete(COOKIE_NAME);
}

/**
 * Usuário do request atual. Memoizado por request para não repetir a consulta
 * em cada layout/página da árvore de Server Components.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const jwt = store.get(COOKIE_NAME)?.value;
  if (!jwt) return null;

  let userId: string;
  let jti: string;
  try {
    const { payload } = await jwtVerify(jwt, secret());
    userId = payload.sub as string;
    jti = payload.jti as string;
    if (!userId || !jti) return null;
  } catch {
    return null;
  }

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(jti) },
    include: {
      user: {
        include: {
          professional: { select: { id: true } },
          customer: { select: { id: true } },
        },
      },
    },
  });

  if (!session || session.userId !== userId) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => null);
    return null;
  }
  if (!session.user.isActive) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role as Role,
    avatarUrl: session.user.avatarUrl,
    professionalId: session.user.professional?.id ?? null,
    customerId: session.user.customer?.id ?? null,
  };
});

/** Higiene de sessões expiradas — chamada oportunisticamente no login. */
export async function pruneExpiredSessions() {
  await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}
