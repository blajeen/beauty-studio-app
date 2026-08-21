/**
 * Smoke test de rotas autenticadas.
 * Cria uma sessão real para cada perfil e verifica o status HTTP das telas.
 */
import { PrismaClient } from '@prisma/client';
import { SignJWT } from 'jose';
import { createHash, randomBytes } from 'node:crypto';

const db = new PrismaClient();
const BASE = process.env.BASE ?? 'http://localhost:3100';
const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);

async function sessionCookie(email: string): Promise<string> {
  const user = await db.user.findUniqueOrThrow({ where: { email } });
  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  await db.session.create({
    data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 3600_000) },
  });
  const jwt = await new SignJWT({ sub: user.id, jti: token })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);
  return `bs_session=${jwt}`;
}

async function check(path: string, cookie?: string) {
  const response = await fetch(`${BASE}${path}`, {
    headers: cookie ? { cookie } : {},
    redirect: 'manual',
  });
  const location = response.headers.get('location');
  return { path, status: response.status, location };
}

async function main() {
  const ids = await db.$transaction([
    db.professional.findFirstOrThrow({ orderBy: { sortOrder: 'asc' } }),
    db.customer.findFirstOrThrow({ where: { user: { isNot: null } }, include: { user: true } }),
    db.event.findFirstOrThrow(),
  ]);
  const [professional, customer, event] = ids;

  const anaSession = await sessionCookie('ana@lumi.studio');
  const anaItem = await db.appointmentItem.findFirst({
    where: { professional: { user: { email: 'ana@lumi.studio' } } },
    orderBy: { startAt: 'desc' },
  });
  const anaClient = anaItem
    ? await db.appointment.findUnique({ where: { id: anaItem.appointmentId } })
    : null;

  const mariaSession = await sessionCookie('maria@cliente.com');
  const mariaAppointment = await db.appointment.findFirst({
    where: { customer: { user: { email: 'maria@cliente.com' } } },
    orderBy: { startAt: 'desc' },
  });

  const suites: { label: string; cookie?: string; paths: string[] }[] = [
    {
      label: 'público',
      paths: [
        '/',
        '/servicos',
        '/servicos/unhas',
        '/servicos/maquiagem',
        '/profissionais',
        `/profissionais/${professional.id}`,
        '/portfolio',
        '/portfolio?categoria=unhas',
        '/pacotes',
        '/beauty-club',
        '/noivas',
        '/sobre',
        '/agendar',
        '/agendar?servico=manicure-tradicional',
        `/agendar?profissional=${professional.id}`,
        '/agendar?pacote=beauty-day',
        '/agendar?ocasiao=1&tipo=WEDDING',
        '/entrar',
        '/cadastrar',
        '/offline',
        '/nao-existe-esta-pagina',
      ],
    },
    {
      label: 'cliente',
      cookie: mariaSession,
      paths: [
        '/minha-conta',
        '/minha-conta/agendamentos',
        mariaAppointment ? `/minha-conta/agendamentos/${mariaAppointment.id}` : '/minha-conta',
        '/minha-conta/historico',
        '/minha-conta/inspiracoes',
        '/minha-conta/pacotes',
        '/minha-conta/perfil',
        mariaAppointment ? `/agendar?remarcar=${mariaAppointment.id}` : '/agendar',
      ],
    },
    {
      label: 'profissional',
      cookie: anaSession,
      paths: [
        '/pro',
        '/pro/agenda',
        '/pro/agenda?vista=semana',
        '/pro/clientes',
        anaClient ? `/pro/clientes/${anaClient.customerId}` : '/pro/clientes',
        anaItem ? `/pro/atendimento/${anaItem.id}` : '/pro',
        '/pro/portfolio',
        '/pro/bloqueios',
      ],
    },
    {
      label: 'gestão',
      cookie: await sessionCookie('dona@lumi.studio'),
      paths: [
        '/admin',
        '/admin/agenda',
        '/admin/agenda?vista=semana',
        '/admin/agenda?vista=lista',
        '/admin/clientes',
        '/admin/clientes?q=maria',
        `/admin/clientes/${customer.id}`,
        '/admin/retencao',
        '/admin/retencao?dias=90',
        '/admin/profissionais',
        '/admin/servicos',
        '/admin/programas',
        '/admin/eventos',
        `/admin/eventos/${event.id}`,
        '/admin/unidades',
      ],
    },
    {
      label: 'produto',
      cookie: await sessionCookie('produto@lumi.studio'),
      paths: ['/studio', '/studio/marca', '/studio/conteudo', '/studio/auditoria'],
    },
    {
      label: 'permissões (cliente tentando áreas internas)',
      cookie: mariaSession,
      paths: ['/admin', '/pro', '/studio'],
    },
  ];

  let failures = 0;

  for (const suite of suites) {
    console.log(`\n── ${suite.label} ───────────────────────────`);
    for (const path of suite.paths) {
      const result = await check(path, suite.cookie);
      const expected404 = path.includes('nao-existe');
      const expectedRedirect = suite.label.startsWith('permissões');
      const ok = expected404
        ? result.status === 404
        : expectedRedirect
          ? result.status === 307 || result.status === 302
          : result.status === 200;
      if (!ok) failures += 1;
      console.log(
        `${ok ? '✔' : '✖'} ${String(result.status).padEnd(3)} ${path}${result.location ? ` → ${result.location}` : ''}`,
      );
    }
  }

  await db.session.deleteMany({ where: { expiresAt: { lte: new Date(Date.now() + 3600_000) } } });
  console.log(`\n${failures === 0 ? '✓ todas as rotas responderam como esperado' : `✖ ${failures} falhas`}`);
  await db.$disconnect();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(async (error) => {
  console.error(error);
  await db.$disconnect();
  process.exit(1);
});
