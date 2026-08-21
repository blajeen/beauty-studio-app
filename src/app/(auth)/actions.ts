'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/db';
import { ROLE_HOME, type Role } from '@/lib/constants';
import {
  createSession,
  destroySession,
  hashPassword,
  pruneExpiredSessions,
  verifyPassword,
} from '@/lib/auth/session';
import { audit } from '@/lib/auth/guards';

export type AuthState = { error?: string; fieldErrors?: Record<string, string> };

/**
 * Limitador simples por e-mail/IP. Em produção viveria em Redis; aqui protege
 * o formulário de tentativa em massa sem adicionar infraestrutura (seção 68).
 */
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000;

function rateLimit(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= MAX_ATTEMPTS;
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Informe um e-mail válido'),
  password: z.string().min(1, 'Informe sua senha'),
});

export async function login(_state: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Verifique os dados informados.' };
  }

  if (!rateLimit(parsed.data.email)) {
    return { error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  // Mensagem única: não revelamos se o e-mail existe.
  if (!user || !user.isActive || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: 'E-mail ou senha incorretos.' };
  }

  attempts.delete(parsed.data.email);
  await pruneExpiredSessions();
  await createSession(user.id);
  await audit('auth.login', 'User', user.id, null, user.id);

  const target = (formData.get('redirect') as string) || ROLE_HOME[user.role as Role] || '/';
  redirect(target);
}

const registerSchema = z
  .object({
    name: z.string().trim().min(3, 'Informe seu nome completo'),
    email: z.string().trim().toLowerCase().email('Informe um e-mail válido'),
    phone: z
      .string()
      .trim()
      .min(10, 'Informe um telefone com DDD')
      .transform((value) => value.replace(/\D/g, '')),
    password: z.string().min(8, 'A senha precisa ter ao menos 8 caracteres'),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'As senhas não conferem',
    path: ['confirm'],
  });

export async function register(_state: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    password: formData.get('password'),
    confirm: formData.get('confirm'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Verifique os dados informados.' };
  }

  const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { error: 'Já existe uma conta com este e-mail. Entre com ela ou use outro endereço.' };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const user = await db.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      phone: parsed.data.phone,
      passwordHash,
      role: 'CUSTOMER',
    },
  });

  // Se a gestão já tinha uma ficha com este telefone, vinculamos em vez de
  // duplicar — o histórico de atendimentos vem junto.
  const existingCustomer = await db.customer.findFirst({
    where: { phone: parsed.data.phone, userId: null },
  });

  if (existingCustomer) {
    await db.customer.update({
      where: { id: existingCustomer.id },
      data: { userId: user.id, email: parsed.data.email, name: parsed.data.name },
    });
  } else {
    await db.customer.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
      },
    });
  }

  await createSession(user.id);
  await audit('auth.register', 'User', user.id, null, user.id);

  const target = (formData.get('redirect') as string) || '/minha-conta';
  redirect(target);
}

export async function logout() {
  await destroySession();
  redirect('/');
}
