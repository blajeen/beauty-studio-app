/**
 * LUMI BEAUTY STUDIO — dados demonstrativos.
 *
 * O produto nunca começa vazio (seção 74): duas unidades, oito profissionais,
 * catálogo completo, portfólio, clientes com histórico, pacotes, Beauty Club,
 * um casamento em produção e uma agenda de hoje que alimenta o dashboard.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DEFAULT_BRAND, DEFAULT_CONTENT } from '../src/lib/brand/config';

const db = new PrismaClient();

const PASSWORD = 'lumi1234';

// ── utilidades de tempo (fuso local do servidor) ─────────────────────────────
const DAY = 24 * 60 * 60 * 1000;
const today = new Date();
today.setHours(0, 0, 0, 0);

function day(offset: number): Date {
  return new Date(today.getTime() + offset * DAY);
}
function at(base: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}
function plus(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}
function code(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}
/** Empurra a data para o próximo dia útil do estúdio (o domingo é fechado). */
function businessDay(offset: number): Date {
  let d = day(offset);
  while (d.getDay() === 0) d = new Date(d.getTime() + DAY);
  return d;
}

const img = (file: string) => `/media/${file}`;

async function main() {
  console.log('› limpando base…');
  await db.$transaction([
    db.procedurePhoto.deleteMany(),
    db.procedureRecord.deleteMany(),
    db.packageUsage.deleteMany(),
    db.subscriptionUsage.deleteMany(),
    db.appointmentItem.deleteMany(),
    db.appointment.deleteMany(),
    db.eventParticipant.deleteMany(),
    db.event.deleteMany(),
    db.customerPackage.deleteMany(),
    db.subscription.deleteMany(),
    db.packageItem.deleteMany(),
    db.package.deleteMany(),
    db.planItem.deleteMany(),
    db.plan.deleteMany(),
    db.portfolioItem.deleteMany(),
    db.inspirationImage.deleteMany(),
    db.customerPreference.deleteMany(),
    db.notification.deleteMany(),
    db.review.deleteMany(),
    db.waitlistEntry.deleteMany(),
    db.blockedSlot.deleteMany(),
    db.professionalHours.deleteMany(),
    db.professionalService.deleteMany(),
    db.professionalBranch.deleteMany(),
    db.professional.deleteMany(),
    db.customer.deleteMany(),
    db.session.deleteMany(),
    db.auditLog.deleteMany(),
    db.user.deleteMany(),
    db.service.deleteMany(),
    db.serviceCategory.deleteMany(),
    db.businessHours.deleteMany(),
    db.branch.deleteMany(),
    db.setting.deleteMany(),
    db.media.deleteMany(),
  ]);

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // ── white-label ────────────────────────────────────────────────────────────
  await db.setting.createMany({
    data: [
      { key: 'brand', published: JSON.stringify(DEFAULT_BRAND) },
      { key: 'content', published: JSON.stringify(DEFAULT_CONTENT) },
    ],
  });

  // ── unidades ───────────────────────────────────────────────────────────────
  console.log('› unidades');
  const centro = await db.branch.create({
    data: {
      name: 'Unidade Centro',
      slug: 'centro',
      address: 'Rua Augusta, 1.412 — loja 3',
      district: 'Consolação',
      city: 'São Paulo',
      state: 'SP',
      zip: '01304-001',
      phone: '(11) 3555-1200',
      imageUrl: img('unidade-centro.jpg'),
      sortOrder: 0,
      notes: 'Estacionamento conveniado no número 1.400.',
    },
  });

  const jardins = await db.branch.create({
    data: {
      name: 'Unidade Jardins',
      slug: 'jardins',
      address: 'Alameda Lorena, 890',
      district: 'Jardim Paulista',
      city: 'São Paulo',
      state: 'SP',
      zip: '01424-001',
      phone: '(11) 3555-1300',
      imageUrl: img('unidade-jardins.jpg'),
      sortOrder: 1,
      notes: 'Atendimento de noivas e eventos com sala reservada.',
    },
  });

  const hours = (branchId: string) =>
    [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
      branchId,
      weekday,
      openTime: weekday === 6 ? '09:00' : '09:00',
      closeTime: weekday === 6 ? '17:00' : '20:00',
      isClosed: weekday === 0,
    }));

  await db.businessHours.createMany({ data: [...hours(centro.id), ...hours(jardins.id)] });

  // ── categorias ─────────────────────────────────────────────────────────────
  console.log('› catálogo');
  const categoryData = [
    {
      name: 'Unhas',
      slug: 'unhas',
      tagline: 'Manicure, gel, alongamento e nail art',
      description: 'Do clássico bem-feito ao alongamento autoral. Sua técnica e seu formato ficam registrados na ficha.',
      coverImage: img('categoria-unhas.jpg'),
      sortOrder: 0,
    },
    {
      name: 'Sobrancelhas',
      slug: 'sobrancelhas',
      tagline: 'Design, henna e laminação',
      description: 'Formato desenhado a partir da sua expressão — e mantido igual a cada visita.',
      coverImage: img('categoria-sobrancelhas.jpg'),
      sortOrder: 1,
    },
    {
      name: 'Cílios',
      slug: 'cilios',
      tagline: 'Extensão, volume e lash lifting',
      description: 'Curvatura, comprimento e efeito registrados para a manutenção sair idêntica.',
      coverImage: img('categoria-cilios.jpg'),
      sortOrder: 2,
    },
    {
      name: 'Maquiagem',
      slug: 'maquiagem',
      tagline: 'Social, festa, fotos e noivas',
      description: 'Com fluxo próprio para eventos: você diz a que horas precisa estar pronta e nós montamos o cronograma.',
      coverImage: img('categoria-maquiagem.jpg'),
      sortOrder: 3,
    },
    {
      name: 'Estética facial',
      slug: 'estetica-facial',
      tagline: 'Limpeza, peeling e hidratação',
      description: 'Protocolos de pele com avaliação e recomendação de retorno.',
      coverImage: img('categoria-estetica-facial.jpg'),
      sortOrder: 4,
    },
    {
      name: 'Estética corporal',
      slug: 'estetica-corporal',
      tagline: 'Massagem, drenagem e spa',
      description: 'Cuidado corporal com sessões avulsas ou em pacote.',
      coverImage: img('categoria-estetica-corporal.jpg'),
      sortOrder: 5,
    },
  ];

  const categories: Record<string, string> = {};
  for (const data of categoryData) {
    const created = await db.serviceCategory.create({ data });
    categories[data.slug] = created.id;
  }

  type ServiceSeed = {
    slug: string;
    name: string;
    category: string;
    price: number;
    duration: number;
    priceType?: string;
    returnIntervalDays?: number;
    recordSchema: string;
    shortDescription: string;
    isFeatured?: boolean;
    requiresPatchTest?: boolean;
    bufferAfter?: number;
    tags?: string;
    imageUrl?: string;
  };

  const serviceSeeds: ServiceSeed[] = [
    // Unhas
    { slug: 'manicure-tradicional', name: 'Manicure tradicional', category: 'unhas', price: 3500, duration: 40, returnIntervalDays: 21, recordSchema: 'nail', shortDescription: 'Cutícula, lixamento e esmaltação em esmalte comum.', isFeatured: true, imageUrl: img('servico-manicure-tradicional.jpg') },
    { slug: 'pedicure', name: 'Pedicure', category: 'unhas', price: 4000, duration: 45, returnIntervalDays: 30, recordSchema: 'nail', shortDescription: 'Cuidado completo dos pés com esfoliação leve.' },
    { slug: 'manicure-pedicure', name: 'Manicure + Pedicure', category: 'unhas', price: 7000, duration: 80, returnIntervalDays: 25, recordSchema: 'nail', shortDescription: 'Mãos e pés no mesmo atendimento.', isFeatured: true },
    { slug: 'esmaltacao-gel', name: 'Esmaltação em gel', category: 'unhas', price: 8000, duration: 60, returnIntervalDays: 21, recordSchema: 'nail', shortDescription: 'Brilho e resistência por até três semanas.', isFeatured: true, imageUrl: img('servico-esmaltacao-gel.jpg') },
    { slug: 'blindagem', name: 'Blindagem', category: 'unhas', price: 10000, duration: 75, returnIntervalDays: 30, recordSchema: 'nail', shortDescription: 'Reforço da unha natural com acabamento discreto.' },
    { slug: 'alongamento-gel', name: 'Alongamento em gel', category: 'unhas', price: 15000, duration: 120, priceType: 'FROM', returnIntervalDays: 21, recordSchema: 'nail', shortDescription: 'Extensão em gel com formato desenhado para a sua mão.', isFeatured: true, imageUrl: img('servico-alongamento-gel.jpg') },
    { slug: 'alongamento-fibra', name: 'Alongamento em fibra de vidro', category: 'unhas', price: 18000, duration: 150, priceType: 'FROM', returnIntervalDays: 21, recordSchema: 'nail', shortDescription: 'Leveza e naturalidade para quem usa alongamento no dia a dia.' },
    { slug: 'manutencao-alongamento', name: 'Manutenção de alongamento', category: 'unhas', price: 10000, duration: 90, priceType: 'FROM', returnIntervalDays: 20, recordSchema: 'nail', shortDescription: 'Reequilíbrio do crescimento e troca do acabamento.' },
    { slug: 'remocao', name: 'Remoção', category: 'unhas', price: 4000, duration: 30, recordSchema: 'nail', shortDescription: 'Remoção segura, sem agredir a unha natural.' },
    { slug: 'nail-art', name: 'Nail Art', category: 'unhas', price: 1500, duration: 15, priceType: 'FROM', recordSchema: 'nail', shortDescription: 'Desenho autoral por unha. Combine com qualquer serviço.', imageUrl: img('servico-nail-art.jpg') },

    // Sobrancelhas
    { slug: 'design-sobrancelhas', name: 'Design de sobrancelhas', category: 'sobrancelhas', price: 3500, duration: 30, returnIntervalDays: 25, recordSchema: 'brow', shortDescription: 'Mapeamento do formato a partir da sua expressão.', isFeatured: true, imageUrl: img('servico-design-sobrancelhas.jpg') },
    { slug: 'design-henna', name: 'Design + Henna', category: 'sobrancelhas', price: 5500, duration: 40, returnIntervalDays: 25, recordSchema: 'brow', shortDescription: 'Preenchimento com henna na cor combinada com você.', isFeatured: true },
    { slug: 'brow-lamination', name: 'Brow Lamination', category: 'sobrancelhas', price: 10000, duration: 60, returnIntervalDays: 45, recordSchema: 'brow', shortDescription: 'Fios alinhados e efeito volumoso por semanas.', imageUrl: img('servico-brow-lamination.jpg') },
    { slug: 'tintura-sobrancelha', name: 'Tintura', category: 'sobrancelhas', price: 4500, duration: 30, returnIntervalDays: 30, recordSchema: 'brow', shortDescription: 'Uniformiza a cor dos fios com resultado natural.' },
    { slug: 'brow-spa', name: 'Brow Spa', category: 'sobrancelhas', price: 8000, duration: 50, returnIntervalDays: 30, recordSchema: 'brow', shortDescription: 'Design, esfoliação, hidratação e finalização.' },

    // Cílios
    { slug: 'extensao-classica', name: 'Extensão clássica', category: 'cilios', price: 16000, duration: 120, returnIntervalDays: 21, recordSchema: 'lash', requiresPatchTest: true, shortDescription: 'Um fio por cílio natural. Resultado discreto e elegante.', isFeatured: true, imageUrl: img('servico-extensao-classica.jpg') },
    { slug: 'volume-brasileiro', name: 'Volume brasileiro', category: 'cilios', price: 18000, duration: 150, returnIntervalDays: 21, recordSchema: 'lash', requiresPatchTest: true, shortDescription: 'Fios em Y para densidade sem peso.' },
    { slug: 'volume-russo', name: 'Volume russo', category: 'cilios', price: 22000, duration: 180, returnIntervalDays: 21, recordSchema: 'lash', requiresPatchTest: true, shortDescription: 'Máximo volume com fios ultrafinos.' },
    { slug: 'manutencao-cilios', name: 'Manutenção de cílios', category: 'cilios', price: 10000, duration: 90, priceType: 'FROM', returnIntervalDays: 21, recordSchema: 'lash', shortDescription: 'Reposição dos fios mantendo o mesmo mapa.' },
    { slug: 'lash-lifting', name: 'Lash Lifting', category: 'cilios', price: 12000, duration: 60, returnIntervalDays: 45, recordSchema: 'lash', shortDescription: 'Curvatura nos seus próprios cílios, sem extensão.', isFeatured: true },

    // Maquiagem
    { slug: 'maquiagem-social', name: 'Maquiagem social', category: 'maquiagem', price: 18000, duration: 90, recordSchema: 'makeup', shortDescription: 'Para jantares, reuniões e compromissos do dia.', isFeatured: true, imageUrl: img('servico-maquiagem-social.jpg') },
    { slug: 'maquiagem-festa', name: 'Maquiagem para festa', category: 'maquiagem', price: 22000, duration: 120, recordSchema: 'makeup', shortDescription: 'Alta fixação para a noite inteira.', isFeatured: true },
    { slug: 'maquiagem-express', name: 'Maquiagem express', category: 'maquiagem', price: 12000, duration: 60, recordSchema: 'makeup', shortDescription: 'Produção rápida quando o tempo é curto.' },
    { slug: 'maquiagem-fotos', name: 'Maquiagem para fotos', category: 'maquiagem', price: 20000, duration: 90, recordSchema: 'makeup', shortDescription: 'Ajustada para luz de estúdio e câmera.' },
    { slug: 'maquiagem-noiva', name: 'Maquiagem para noiva', category: 'maquiagem', price: 45000, duration: 150, priceType: 'FROM', recordSchema: 'makeup', shortDescription: 'No dia do casamento, com acompanhamento e retoque.', isFeatured: true, imageUrl: img('servico-maquiagem-noiva.jpg') },
    { slug: 'teste-noiva', name: 'Teste de maquiagem para noiva', category: 'maquiagem', price: 25000, duration: 120, priceType: 'FROM', recordSchema: 'makeup', shortDescription: 'Definimos o visual antes da data, com registro na ficha.' },
    { slug: 'maquiagem-cabelo', name: 'Maquiagem + cabelo', category: 'maquiagem', price: 35000, duration: 180, priceType: 'FROM', recordSchema: 'makeup', shortDescription: 'Produção completa para eventos.' },

    // Estética facial
    { slug: 'limpeza-pele', name: 'Limpeza de pele', category: 'estetica-facial', price: 12000, duration: 60, returnIntervalDays: 30, recordSchema: 'skin', shortDescription: 'Higienização profunda com extração.', isFeatured: true, imageUrl: img('servico-limpeza-pele.jpg') },
    { slug: 'limpeza-premium', name: 'Limpeza premium', category: 'estetica-facial', price: 18000, duration: 90, returnIntervalDays: 30, recordSchema: 'skin', shortDescription: 'Protocolo estendido com máscara e alta frequência.' },
    { slug: 'peeling', name: 'Peeling', category: 'estetica-facial', price: 15000, duration: 60, priceType: 'FROM', returnIntervalDays: 21, recordSchema: 'skin', shortDescription: 'Renovação celular conforme avaliação da pele.' },
    { slug: 'hidratacao-facial', name: 'Hidratação facial', category: 'estetica-facial', price: 10000, duration: 60, returnIntervalDays: 30, recordSchema: 'skin', shortDescription: 'Reposição de água e barreira cutânea.' },
    { slug: 'spa-facial', name: 'Spa facial', category: 'estetica-facial', price: 16000, duration: 90, returnIntervalDays: 45, recordSchema: 'skin', shortDescription: 'Ritual completo de relaxamento e viço.' },

    // Estética corporal
    { slug: 'massagem-relaxante', name: 'Massagem relaxante', category: 'estetica-corporal', price: 12000, duration: 60, recordSchema: 'body', shortDescription: 'Alívio de tensão com pressão personalizada.' },
    { slug: 'drenagem', name: 'Drenagem linfática', category: 'estetica-corporal', price: 12000, duration: 60, returnIntervalDays: 7, recordSchema: 'body', shortDescription: 'Estímulo à circulação e redução de inchaço.' },
    { slug: 'massagem-modeladora', name: 'Massagem modeladora', category: 'estetica-corporal', price: 13000, duration: 60, returnIntervalDays: 7, recordSchema: 'body', shortDescription: 'Movimentos firmes para contorno corporal.' },
    { slug: 'spa-corporal', name: 'Spa corporal', category: 'estetica-corporal', price: 18000, duration: 90, recordSchema: 'body', shortDescription: 'Esfoliação, hidratação e massagem em sequência.' },
  ];

  const services: Record<string, { id: string; duration: number; price: number; name: string }> = {};
  for (const [index, seed] of serviceSeeds.entries()) {
    const created = await db.service.create({
      data: {
        categoryId: categories[seed.category],
        name: seed.name,
        slug: seed.slug,
        shortDescription: seed.shortDescription,
        description: seed.shortDescription,
        imageUrl: seed.imageUrl ?? null,
        priceType: seed.priceType ?? 'FIXED',
        price: seed.price,
        duration: seed.duration,
        bufferAfter: seed.bufferAfter ?? 10,
        returnIntervalDays: seed.returnIntervalDays ?? null,
        requiresPatchTest: seed.requiresPatchTest ?? false,
        recordSchema: seed.recordSchema,
        isFeatured: seed.isFeatured ?? false,
        sortOrder: index,
        tags: seed.tags ?? null,
      },
    });
    services[seed.slug] = {
      id: created.id,
      duration: created.duration,
      price: created.price,
      name: created.name,
    };
  }

  // ── equipe ─────────────────────────────────────────────────────────────────
  console.log('› equipe');
  const ownerUser = await db.user.create({
    data: {
      email: 'dona@lumi.studio',
      passwordHash,
      name: 'Helena Lumi',
      phone: '(11) 99900-0001',
      role: 'OWNER',
      avatarUrl: img('equipe-ana-ribeiro-avatar.jpg'),
    },
  });

  await db.user.create({
    data: {
      email: 'produto@lumi.studio',
      passwordHash,
      name: 'Gestor do Produto',
      role: 'PRODUCT_MANAGER',
    },
  });

  await db.user.create({
    data: {
      email: 'gestao@lumi.studio',
      passwordHash,
      name: 'Beatriz Souza',
      phone: '(11) 99900-0002',
      role: 'MANAGER',
    },
  });

  type ProSeed = {
    key: string;
    email: string;
    name: string;
    title: string;
    bio: string;
    avatar: string;
    cover: string;
    specialties: string;
    services: string[];
    branches: string[];
    instagram: string;
  };

  const proSeeds: ProSeed[] = [
    {
      key: 'ana',
      email: 'ana@lumi.studio',
      name: 'Ana Ribeiro',
      title: 'Nail designer',
      bio: 'Trabalha com alongamento há nove anos e é referência em formato amendoado. Gosta de acabamento discreto e durabilidade real.',
      avatar: img('equipe-ana-ribeiro-avatar.jpg'),
      cover: img('equipe-ana-ribeiro-capa.jpg'),
      specialties: 'Alongamento em gel,Manutenção,Esmaltação em gel',
      services: ['manicure-tradicional', 'pedicure', 'manicure-pedicure', 'esmaltacao-gel', 'blindagem', 'alongamento-gel', 'alongamento-fibra', 'manutencao-alongamento', 'remocao', 'nail-art'],
      branches: ['centro', 'jardins'],
      instagram: 'ana.nails',
    },
    {
      key: 'bruna',
      email: 'bruna@lumi.studio',
      name: 'Bruna Camargo',
      title: 'Manicure e pedicure',
      bio: 'Especialista em pés e mãos bem cuidados. Atendimento calmo, cutícula impecável e conversa boa.',
      avatar: img('equipe-bruna-camargo-avatar.jpg'),
      cover: img('equipe-bruna-camargo-capa.jpg'),
      specialties: 'Manicure,Pedicure,Blindagem',
      services: ['manicure-tradicional', 'pedicure', 'manicure-pedicure', 'esmaltacao-gel', 'blindagem', 'remocao'],
      branches: ['centro'],
      instagram: 'bruna.camargo',
    },
    {
      key: 'paula',
      email: 'paula@lumi.studio',
      name: 'Paula Nunes',
      title: 'Nail artist',
      bio: 'Autoral. Cria desenhos exclusivos, do minimalista ao chrome, e adora um projeto difícil.',
      avatar: img('equipe-paula-nunes-avatar.jpg'),
      cover: img('equipe-paula-nunes-capa.jpg'),
      specialties: 'Nail Art,Chrome,Francesinha',
      services: ['manicure-tradicional', 'esmaltacao-gel', 'alongamento-gel', 'manutencao-alongamento', 'nail-art'],
      branches: ['jardins'],
      instagram: 'paula.nailart',
    },
    {
      key: 'julia',
      email: 'julia@lumi.studio',
      name: 'Julia Nakamura',
      title: 'Designer de sobrancelhas',
      bio: 'Mapeia o formato a partir da expressão do rosto. Trabalha com henna e laminação e é obsessiva por simetria.',
      avatar: img('equipe-julia-nakamura-avatar.jpg'),
      cover: img('equipe-julia-nakamura-capa.jpg'),
      specialties: 'Design,Henna,Brow Lamination',
      services: ['design-sobrancelhas', 'design-henna', 'brow-lamination', 'tintura-sobrancelha', 'brow-spa'],
      branches: ['centro', 'jardins'],
      instagram: 'julia.browstudio',
    },
    {
      key: 'larissa',
      email: 'larissa@lumi.studio',
      name: 'Larissa Prado',
      title: 'Lash designer',
      bio: 'Volume russo é a assinatura dela. Monta mapas personalizados e registra tudo para a manutenção sair idêntica.',
      avatar: img('equipe-larissa-prado-avatar.jpg'),
      cover: img('equipe-larissa-prado-capa.jpg'),
      specialties: 'Volume russo,Extensão clássica,Lash Lifting',
      services: ['extensao-classica', 'volume-brasileiro', 'volume-russo', 'manutencao-cilios', 'lash-lifting'],
      branches: ['centro'],
      instagram: 'larissa.lash',
    },
    {
      key: 'carla',
      email: 'carla@lumi.studio',
      name: 'Carla Meireles',
      title: 'Maquiadora',
      bio: 'Pele leve e luminosa, do social ao editorial. Trabalha com referências enviadas pela cliente antes do atendimento.',
      avatar: img('equipe-carla-meireles-avatar.jpg'),
      cover: img('equipe-carla-meireles-capa.jpg'),
      specialties: 'Maquiagem social,Festa,Fotos',
      services: ['maquiagem-social', 'maquiagem-festa', 'maquiagem-express', 'maquiagem-fotos'],
      branches: ['centro', 'jardins'],
      instagram: 'carla.makes',
    },
    {
      key: 'sofia',
      email: 'sofia@lumi.studio',
      name: 'Sofia Duarte',
      title: 'Maquiadora — noivas e eventos',
      bio: 'Conduz casamentos de ponta a ponta: teste, cronograma do dia e produção da noiva e das madrinhas.',
      avatar: img('equipe-sofia-duarte-avatar.jpg'),
      cover: img('equipe-sofia-duarte-capa.jpg'),
      specialties: 'Noivas,Eventos,Maquiagem + cabelo',
      services: ['maquiagem-noiva', 'teste-noiva', 'maquiagem-cabelo', 'maquiagem-festa', 'maquiagem-social'],
      branches: ['jardins'],
      instagram: 'sofia.bridal',
    },
    {
      key: 'renata',
      email: 'renata@lumi.studio',
      name: 'Renata Alves',
      title: 'Esteticista',
      bio: 'Avalia a pele antes de qualquer protocolo e monta um plano de retorno realista para a rotina da cliente.',
      avatar: img('equipe-renata-alves-avatar.jpg'),
      cover: img('equipe-renata-alves-capa.jpg'),
      specialties: 'Limpeza de pele,Peeling,Drenagem',
      services: ['limpeza-pele', 'limpeza-premium', 'peeling', 'hidratacao-facial', 'spa-facial', 'massagem-relaxante', 'drenagem', 'massagem-modeladora', 'spa-corporal'],
      branches: ['centro', 'jardins'],
      instagram: 'renata.estetica',
    },
  ];

  const branchIds: Record<string, string> = { centro: centro.id, jardins: jardins.id };
  const pros: Record<string, { id: string; name: string; userId: string }> = {};

  for (const [index, seed] of proSeeds.entries()) {
    const user = await db.user.create({
      data: {
        email: seed.email,
        passwordHash,
        name: seed.name,
        role: 'PROFESSIONAL',
        avatarUrl: seed.avatar,
        phone: `(11) 9${8000 + index}-10${index}0`,
      },
    });

    const professional = await db.professional.create({
      data: {
        userId: user.id,
        displayName: seed.name,
        title: seed.title,
        bio: seed.bio,
        avatarUrl: seed.avatar,
        coverUrl: seed.cover,
        instagram: seed.instagram,
        specialties: seed.specialties,
        sortOrder: index,
      },
    });

    pros[seed.key] = { id: professional.id, name: seed.name, userId: user.id };

    await db.professionalBranch.createMany({
      data: seed.branches.map((slug) => ({ professionalId: professional.id, branchId: branchIds[slug] })),
    });

    await db.professionalService.createMany({
      data: seed.services.map((slug, i) => ({
        professionalId: professional.id,
        serviceId: services[slug].id,
        isPrimary: i === 0,
      })),
    });

    // Escala: terça a sábado, com almoço. Ninguém trabalha domingo/segunda.
    await db.professionalHours.createMany({
      data: [1, 2, 3, 4, 5, 6].map((weekday) => ({
        professionalId: professional.id,
        weekday,
        startTime: weekday === 6 ? '09:00' : '09:00',
        endTime: weekday === 6 ? '17:00' : '19:30',
        breakStart: '13:00',
        breakEnd: '14:00',
        isOff: weekday === 1 && index % 3 === 0,
      })),
    });
  }

  // Ana tem preço próprio de alongamento — o motor respeita a exceção.
  await db.professionalService.update({
    where: {
      professionalId_serviceId: {
        professionalId: pros.ana.id,
        serviceId: services['alongamento-gel'].id,
      },
    },
    data: { customPrice: 17000, customDuration: 130 },
  });

  // ── pacotes e combos ───────────────────────────────────────────────────────
  console.log('› pacotes e Beauty Club');
  const packageSeeds = [
    {
      name: 'Beauty Day', slug: 'beauty-day', price: 12000, sessions: 1, isCombo: true, highlight: true,
      tagline: 'Manicure + Pedicure + Sobrancelha',
      description: 'Três serviços em sequência, no mesmo dia, com o roteiro montado para você.',
      imageUrl: img('pacote-beauty-day.jpg'),
      items: [['manicure-tradicional', 1], ['pedicure', 1], ['design-sobrancelhas', 1]] as [string, number][],
    },
    {
      name: 'Glow', slug: 'glow', price: 25000, sessions: 1, isCombo: true,
      tagline: 'Limpeza facial + Design + Lash Lifting',
      description: 'Pele limpa, olhar aberto e sobrancelha desenhada — o combo que rende semanas.',
      imageUrl: img('pacote-glow.jpg'),
      items: [['limpeza-pele', 1], ['design-sobrancelhas', 1], ['lash-lifting', 1]] as [string, number][],
    },
    {
      name: 'Event Ready', slug: 'event-ready', price: 30000, sessions: 1, isCombo: true, highlight: true,
      tagline: 'Manicure + Sobrancelha + Maquiagem',
      description: 'Tudo o que você precisa antes de um evento, resolvido em uma tarde.',
      imageUrl: img('pacote-event-ready.jpg'),
      items: [['manicure-tradicional', 1], ['design-sobrancelhas', 1], ['maquiagem-festa', 1]] as [string, number][],
    },
    {
      name: 'Bridal Experience', slug: 'bridal-experience', price: 70000, sessions: 1, isCombo: true, highlight: true,
      tagline: 'Teste + Maquiagem no dia + Preparação de pele',
      description: 'O essencial do casamento em um pacote fechado, com teste incluído.',
      imageUrl: img('pacote-bridal-experience.jpg'),
      items: [['teste-noiva', 1], ['maquiagem-noiva', 1], ['limpeza-premium', 1]] as [string, number][],
    },
    {
      name: 'Bridal Premium', slug: 'bridal-premium', price: 120000, sessions: 1, isCombo: true,
      tagline: 'Teste + Maquiagem + Cabelo + Preparação',
      description: 'Produção completa da noiva, do preparo da pele ao retoque final.',
      imageUrl: img('pacote-bridal-premium.jpg'),
      items: [['teste-noiva', 1], ['maquiagem-cabelo', 1], ['limpeza-premium', 1], ['design-henna', 1]] as [string, number][],
    },
    {
      name: 'Nail Package', slug: 'nail-package', price: 15000, sessions: 5, service: 'manicure-tradicional',
      tagline: '5 manicures', description: 'Sua manutenção do mês resolvida, com desconto por sessão.',
      imageUrl: img('pacote-nail-package.jpg'), items: [] as [string, number][],
    },
    {
      name: 'Brow Package', slug: 'brow-package', price: 12000, sessions: 4, service: 'design-sobrancelhas',
      tagline: '4 designs', description: 'Quatro manutenções de sobrancelha para usar quando quiser.',
      imageUrl: img('pacote-brow-package.jpg'), items: [] as [string, number][],
    },
    {
      name: 'Lash Package', slug: 'lash-package', price: 27000, sessions: 3, service: 'manutencao-cilios',
      tagline: '3 manutenções', description: 'Manutenções de cílios no intervalo recomendado.',
      imageUrl: img('pacote-lash-package.jpg'), items: [] as [string, number][],
    },
  ];

  const packages: Record<string, string> = {};
  for (const [index, seed] of packageSeeds.entries()) {
    const created = await db.package.create({
      data: {
        name: seed.name,
        slug: seed.slug,
        tagline: seed.tagline,
        description: seed.description,
        imageUrl: seed.imageUrl,
        price: seed.price,
        sessions: seed.sessions,
        isCombo: seed.isCombo ?? false,
        highlight: seed.highlight ?? false,
        validityDays: seed.sessions > 1 ? 120 : 90,
        sortOrder: index,
        serviceId: seed.service ? services[seed.service].id : null,
        items: {
          create: seed.items.map(([slug, quantity]) => ({
            serviceId: services[slug].id,
            quantity,
          })),
        },
      },
    });
    packages[seed.slug] = created.id;
  }

  const planSeeds = [
    {
      name: 'Beauty Club Essential', slug: 'essential', monthlyPrice: 9900,
      tagline: 'Para quem mantém o básico sempre em dia',
      benefits: 'Agendamento prioritário,Reagendamento sem custo',
      items: [['manicure-tradicional', 1], ['design-sobrancelhas', 1]] as [string, number][],
    },
    {
      name: 'Beauty Club', slug: 'club', monthlyPrice: 16900, highlight: true,
      tagline: 'A rotina completa do mês',
      benefits: 'Agendamento prioritário,10% em serviços extras,Reagendamento sem custo',
      items: [['manicure-tradicional', 2], ['pedicure', 1], ['design-sobrancelhas', 1]] as [string, number][],
    },
    {
      name: 'Beauty Club Premium', slug: 'premium', monthlyPrice: 24900,
      tagline: 'Tudo incluído, com prioridade máxima',
      benefits: 'Prioridade máxima na agenda,15% em serviços extras,Nail art inclusa,Convidada do mês com 20%',
      items: [['manicure-tradicional', 2], ['pedicure', 1], ['design-sobrancelhas', 1], ['lash-lifting', 1]] as [string, number][],
    },
  ];

  const plans: Record<string, string> = {};
  for (const [index, seed] of planSeeds.entries()) {
    const created = await db.plan.create({
      data: {
        name: seed.name,
        slug: seed.slug,
        tagline: seed.tagline,
        monthlyPrice: seed.monthlyPrice,
        benefits: seed.benefits,
        highlight: seed.highlight ?? false,
        sortOrder: index,
        items: {
          create: seed.items.map(([slug, quantityPerCycle]) => ({
            serviceId: services[slug].id,
            quantityPerCycle,
          })),
        },
      },
    });
    plans[seed.slug] = created.id;
  }

  // ── clientes ───────────────────────────────────────────────────────────────
  console.log('› clientes');
  const customerSeeds = [
    { key: 'maria', name: 'Maria Antunes', phone: '11991110001', email: 'maria@cliente.com', login: true, preferred: 'ana', visits: 24, consentPhotos: true },
    { key: 'juliana', name: 'Juliana Ferraz', phone: '11991110002', email: 'juliana@cliente.com', login: true, preferred: 'julia', visits: 18, consentPhotos: true },
    { key: 'camila', name: 'Camila Rocha', phone: '11991110003', email: 'camila@cliente.com', preferred: 'larissa', visits: 12 },
    { key: 'patricia', name: 'Patrícia Lemos', phone: '11991110004', email: 'patricia@cliente.com', preferred: 'ana', visits: 31, consentPhotos: true },
    { key: 'fernanda', name: 'Fernanda Dias', phone: '11991110005', email: 'fernanda@cliente.com', preferred: 'carla', visits: 7 },
    { key: 'leticia', name: 'Letícia Moraes', phone: '11991110006', preferred: 'bruna', visits: 9 },
    { key: 'aline', name: 'Aline Prado', phone: '11991110007', preferred: 'renata', visits: 5 },
    { key: 'bianca', name: 'Bianca Teixeira', phone: '11991110008', preferred: 'paula', visits: 14, consentPhotos: true },
    { key: 'rafaela', name: 'Rafaela Souza', phone: '11991110009', visits: 3 },
    { key: 'tatiana', name: 'Tatiana Vieira', phone: '11991110010', preferred: 'julia', visits: 21 },
    { key: 'sabrina', name: 'Sabrina Lopes', phone: '11991110011', visits: 2 },
    { key: 'monica', name: 'Mônica Barros', phone: '11991110012', preferred: 'renata', visits: 11 },
  ];

  const customers: Record<string, { id: string; name: string }> = {};
  for (const [index, seed] of customerSeeds.entries()) {
    let userId: string | null = null;
    if (seed.login && seed.email) {
      const user = await db.user.create({
        data: {
          email: seed.email,
          passwordHash,
          name: seed.name,
          phone: seed.phone,
          role: 'CUSTOMER',
        },
      });
      userId = user.id;
    }

    const created = await db.customer.create({
      data: {
        userId,
        name: seed.name,
        phone: seed.phone,
        email: seed.email ?? null,
        preferredProfessionalId: seed.preferred ? pros[seed.preferred].id : null,
        totalVisits: seed.visits,
        consentPhotos: seed.consentPhotos ?? false,
        firstVisitAt: day(-(200 + index * 13)),
        tags: index % 4 === 0 ? 'VIP' : null,
      },
    });
    customers[seed.key] = { id: created.id, name: created.name };
  }

  await db.customerPreference.createMany({
    data: [
      { customerId: customers.maria.id, key: 'Alergia', value: 'Sensibilidade a acetona' },
      { customerId: customers.maria.id, key: 'Bebida', value: 'Café sem açúcar' },
      { customerId: customers.juliana.id, key: 'Preferência', value: 'Prefere horários após as 18h' },
      { customerId: customers.patricia.id, key: 'Formato favorito', value: 'Amendoado médio' },
    ],
  });

  // ── agenda ─────────────────────────────────────────────────────────────────
  console.log('› agenda');

  /** Controle simples de ocupação para os dados demonstrativos não colidirem. */
  const busy = new Map<string, { start: number; end: number }[]>();
  function free(proId: string, start: Date, end: Date): boolean {
    const list = busy.get(proId) ?? [];
    return !list.some((slot) => start.getTime() < slot.end && slot.start < end.getTime());
  }
  function occupy(proId: string, start: Date, end: Date) {
    if (!busy.has(proId)) busy.set(proId, []);
    busy.get(proId)!.push({ start: start.getTime(), end: end.getTime() + 10 * 60000 });
  }

  type BookingSeed = {
    customer: string;
    branch: string;
    date: Date;
    time: string;
    status?: string;
    items: { service: string; pro: string }[];
    eventId?: string;
    readyBy?: Date;
    notes?: string;
  };

  async function book(seed: BookingSeed) {
    let cursor = at(seed.date, seed.time);
    const planned: { serviceId: string; professionalId: string; start: Date; end: Date; duration: number; price: number }[] = [];

    for (const item of seed.items) {
      const service = services[item.service];
      const proId = pros[item.pro].id;
      const start = cursor;
      const end = plus(start, service.duration);
      if (!free(proId, start, end)) return null;
      planned.push({ serviceId: service.id, professionalId: proId, start, end, duration: service.duration, price: service.price });
      cursor = end;
    }

    planned.forEach((item) => occupy(item.professionalId, item.start, item.end));

    const start = planned[0].start;
    const end = planned[planned.length - 1].end;

    return db.appointment.create({
      data: {
        code: code(),
        customerId: customers[seed.customer].id,
        branchId: branchIds[seed.branch],
        eventId: seed.eventId ?? null,
        status: seed.status ?? 'CONFIRMED',
        startAt: start,
        endAt: end,
        totalDuration: Math.round((end.getTime() - start.getTime()) / 60000),
        totalPrice: planned.reduce((sum, item) => sum + item.price, 0),
        readyByAt: seed.readyBy ?? null,
        notes: seed.notes ?? null,
        source: 'APP',
        items: {
          create: planned.map((item, index) => ({
            serviceId: item.serviceId,
            professionalId: item.professionalId,
            startAt: item.start,
            endAt: item.end,
            duration: item.duration,
            price: item.price,
            sortOrder: index,
            status: seed.status === 'COMPLETED' ? 'COMPLETED' : 'CONFIRMED',
          })),
        },
      },
      include: { items: true },
    });
  }

  // Histórico — alimenta recorrência, ficha técnica e retenção.
  const history: BookingSeed[] = [
    { customer: 'maria', branch: 'centro', date: businessDay(-22), time: '14:00', status: 'COMPLETED', items: [{ service: 'manicure-tradicional', pro: 'ana' }] },
    { customer: 'maria', branch: 'centro', date: businessDay(-35), time: '15:00', status: 'COMPLETED', items: [{ service: 'design-sobrancelhas', pro: 'julia' }] },
    { customer: 'maria', branch: 'centro', date: businessDay(-48), time: '10:00', status: 'COMPLETED', items: [{ service: 'alongamento-gel', pro: 'ana' }] },
    { customer: 'maria', branch: 'jardins', date: businessDay(-90), time: '16:00', status: 'COMPLETED', items: [{ service: 'maquiagem-social', pro: 'carla' }] },
    { customer: 'juliana', branch: 'centro', date: businessDay(-28), time: '18:30', status: 'COMPLETED', items: [{ service: 'design-henna', pro: 'julia' }] },
    { customer: 'juliana', branch: 'centro', date: businessDay(-56), time: '18:30', status: 'COMPLETED', items: [{ service: 'brow-lamination', pro: 'julia' }] },
    { customer: 'camila', branch: 'centro', date: businessDay(-24), time: '09:30', status: 'COMPLETED', items: [{ service: 'volume-russo', pro: 'larissa' }] },
    { customer: 'patricia', branch: 'centro', date: businessDay(-19), time: '11:00', status: 'COMPLETED', items: [{ service: 'manutencao-alongamento', pro: 'ana' }] },
    { customer: 'patricia', branch: 'centro', date: businessDay(-40), time: '11:00', status: 'COMPLETED', items: [{ service: 'alongamento-fibra', pro: 'ana' }] },
    { customer: 'bianca', branch: 'jardins', date: businessDay(-30), time: '15:00', status: 'COMPLETED', items: [{ service: 'esmaltacao-gel', pro: 'paula' }, { service: 'nail-art', pro: 'paula' }] },
    { customer: 'leticia', branch: 'centro', date: businessDay(-33), time: '10:00', status: 'COMPLETED', items: [{ service: 'manicure-pedicure', pro: 'bruna' }] },
    { customer: 'aline', branch: 'jardins', date: businessDay(-45), time: '14:00', status: 'COMPLETED', items: [{ service: 'limpeza-pele', pro: 'renata' }] },
    { customer: 'tatiana', branch: 'jardins', date: businessDay(-26), time: '16:30', status: 'COMPLETED', items: [{ service: 'design-sobrancelhas', pro: 'julia' }] },
    { customer: 'monica', branch: 'centro', date: businessDay(-60), time: '09:00', status: 'COMPLETED', items: [{ service: 'drenagem', pro: 'renata' }] },
    { customer: 'fernanda', branch: 'centro', date: businessDay(-12), time: '17:00', status: 'COMPLETED', items: [{ service: 'maquiagem-express', pro: 'carla' }] },
    { customer: 'rafaela', branch: 'centro', date: businessDay(-8), time: '13:00', status: 'NO_SHOW', items: [{ service: 'manicure-tradicional', pro: 'bruna' }] },
    { customer: 'sabrina', branch: 'centro', date: businessDay(-6), time: '16:00', status: 'CANCELLED', items: [{ service: 'design-sobrancelhas', pro: 'julia' }] },
  ];

  const historyRecords = [];
  for (const seed of history) {
    const created = await book(seed);
    if (created) historyRecords.push({ seed, appointment: created });
  }

  // Fichas técnicas — o que a profissional precisa lembrar na próxima visita.
  const recordSeeds: Record<string, Record<string, string>> = {
    'manicure-tradicional': { technique: 'Esmalte comum', shape: 'Quadrado suave', color: 'Nude rosado 214', observations: 'Cutícula sensível — pressão leve.' },
    'alongamento-gel': { technique: 'Molde F1 em gel', shape: 'Amendoado', lengthSpec: 'Médio (nº 3)', color: 'Nude leitoso', materials: 'Gel builder + top coat matte', observations: 'Cliente digita muito: manter comprimento médio.' },
    'alongamento-fibra': { technique: 'Fibra de vidro', shape: 'Amendoado', lengthSpec: 'Médio', color: 'Francesinha fina', materials: 'Fibra + resina', observations: 'Prefere acabamento brilhante.' },
    'manutencao-alongamento': { technique: 'Reequilíbrio', shape: 'Amendoado', lengthSpec: 'Médio', color: 'Nude leitoso', observations: 'Retorno ideal em 20 dias.' },
    'design-sobrancelhas': { technique: 'Pinça + navalha', shape: 'Arco suave', color: 'Castanho médio', observations: 'Não retirar a cauda — cliente quer preencher.' },
    'design-henna': { technique: 'Henna', shape: 'Arco suave', color: 'Castanho escuro', product: 'Henna profissional 2.0', observations: 'Pele oleosa: pigmento dura ~10 dias.' },
    'brow-lamination': { technique: 'Laminação', shape: 'Arco alto', product: 'Kit laminação passo 1 e 2', observations: 'Não molhar por 24h.' },
    'volume-russo': { technique: 'Volume russo 4D', curvature: 'Curvatura D', lengthSpec: '9 a 12 mm', effect: 'Efeito boneca', volume: '4D', observations: 'Olho sensível ao vapor — manter distância.' },
    'esmaltacao-gel': { technique: 'Gel', shape: 'Oval', color: 'Vermelho clássico', observations: 'Gosta de acabamento espesso.' },
    'maquiagem-social': { style: 'Glow natural', color: 'Base 3.5 quente', product: 'Base fluida + blush cremoso', observations: 'Não gosta de contorno marcado.' },
    'maquiagem-express': { style: 'Natural', color: 'Base 4 neutra', observations: 'Retoque de batom entregue à parte.' },
    'limpeza-pele': { technique: 'Extração manual', product: 'Ácido mandélico 5%', observations: 'Zona T oleosa. Retorno em 30 dias.' },
    'drenagem': { technique: 'Manual — método Vodder', observations: 'Pressão média. Focar em membros inferiores.' },
    'manicure-pedicure': { technique: 'Esmalte comum', shape: 'Quadrado', color: 'Rosa claro', observations: 'Pé com calosidade leve.' },
    'nail-art': { technique: 'Pincel fino', decoration: 'Chrome + francesinha invertida', observations: 'Cliente traz referência do Instagram.' },
  };

  for (const { seed, appointment } of historyRecords) {
    if (seed.status !== 'COMPLETED') continue;
    for (const [index, item] of appointment.items.entries()) {
      const slug = seed.items[index]?.service;
      const fields = slug ? recordSeeds[slug] : undefined;
      if (!fields) continue;
      const service = services[slug!];
      await db.procedureRecord.create({
        data: {
          appointmentItemId: item.id,
          customerId: appointment.customerId,
          professionalId: item.professionalId,
          serviceId: service.id,
          performedAt: item.startAt,
          ...fields,
        },
      });
    }
    await db.customer.update({
      where: { id: appointment.customerId },
      data: { lastVisitAt: appointment.startAt },
    });
  }

  // Hoje — a agenda que a dona vê no dashboard.
  const todayBusiness = businessDay(0);
  const todaySeeds: BookingSeed[] = [
    { customer: 'maria', branch: 'centro', date: todayBusiness, time: '09:30', status: 'COMPLETED', items: [{ service: 'manicure-tradicional', pro: 'bruna' }] },
    { customer: 'juliana', branch: 'centro', date: todayBusiness, time: '09:00', status: 'COMPLETED', items: [{ service: 'design-henna', pro: 'julia' }] },
    { customer: 'camila', branch: 'centro', date: todayBusiness, time: '09:00', status: 'IN_PROGRESS', items: [{ service: 'manutencao-cilios', pro: 'larissa' }] },
    { customer: 'patricia', branch: 'centro', date: todayBusiness, time: '10:30', status: 'CONFIRMED', items: [{ service: 'manutencao-alongamento', pro: 'ana' }] },
    { customer: 'leticia', branch: 'centro', date: todayBusiness, time: '11:00', status: 'CONFIRMED', items: [{ service: 'pedicure', pro: 'bruna' }] },
    { customer: 'aline', branch: 'centro', date: todayBusiness, time: '10:00', status: 'CONFIRMED', items: [{ service: 'limpeza-pele', pro: 'renata' }] },
    { customer: 'tatiana', branch: 'centro', date: todayBusiness, time: '10:00', status: 'CONFIRMED', items: [{ service: 'design-sobrancelhas', pro: 'julia' }] },
    { customer: 'monica', branch: 'centro', date: todayBusiness, time: '14:00', status: 'CONFIRMED', items: [{ service: 'drenagem', pro: 'renata' }] },
    { customer: 'fernanda', branch: 'centro', date: todayBusiness, time: '15:30', status: 'CONFIRMED', items: [{ service: 'maquiagem-social', pro: 'carla' }] },
    { customer: 'rafaela', branch: 'centro', date: todayBusiness, time: '14:00', status: 'CONFIRMED', items: [{ service: 'esmaltacao-gel', pro: 'ana' }] },
    { customer: 'bianca', branch: 'jardins', date: todayBusiness, time: '14:00', status: 'CONFIRMED', items: [{ service: 'alongamento-gel', pro: 'paula' }] },
    { customer: 'sabrina', branch: 'centro', date: todayBusiness, time: '16:00', status: 'CONFIRMED', items: [{ service: 'lash-lifting', pro: 'larissa' }] },
    // Beauty Day: três serviços, três profissionais, uma única reserva (seção 34).
    { customer: 'maria', branch: 'centro', date: todayBusiness, time: '15:00', status: 'CONFIRMED', items: [{ service: 'manicure-tradicional', pro: 'bruna' }, { service: 'design-sobrancelhas', pro: 'julia' }, { service: 'maquiagem-social', pro: 'carla' }], notes: 'Jantar de aniversário às 20h.' },
  ];
  for (const seed of todaySeeds) await book(seed);

  // Próximos dias — a cliente precisa ver algo em "meus horários".
  const upcoming: BookingSeed[] = [
    { customer: 'maria', branch: 'centro', date: businessDay(3), time: '10:00', items: [{ service: 'manutencao-alongamento', pro: 'ana' }] },
    { customer: 'juliana', branch: 'centro', date: businessDay(2), time: '18:30', items: [{ service: 'design-sobrancelhas', pro: 'julia' }] },
    { customer: 'camila', branch: 'centro', date: businessDay(5), time: '09:00', items: [{ service: 'manutencao-cilios', pro: 'larissa' }] },
    { customer: 'patricia', branch: 'centro', date: businessDay(4), time: '15:00', items: [{ service: 'esmaltacao-gel', pro: 'ana' }] },
    { customer: 'bianca', branch: 'jardins', date: businessDay(6), time: '11:00', items: [{ service: 'nail-art', pro: 'paula' }] },
    { customer: 'fernanda', branch: 'centro', date: businessDay(1), time: '16:00', items: [{ service: 'maquiagem-festa', pro: 'carla' }] },
    { customer: 'monica', branch: 'centro', date: businessDay(7), time: '09:00', items: [{ service: 'drenagem', pro: 'renata' }] },
  ];
  for (const seed of upcoming) await book(seed);

  // ── evento: casamento ──────────────────────────────────────────────────────
  console.log('› eventos');
  const weddingDate = businessDay(21);
  const wedding = await db.event.create({
    data: {
      customerId: customers.juliana.id,
      name: 'Casamento da Juliana',
      type: 'WEDDING',
      eventDate: weddingDate,
      readyByTime: '18:00',
      venue: 'Espaço Villa Bisutti — Vila Olímpia',
      guestCount: 4,
      status: 'CONFIRMED',
      notes: 'Cerimônia às 19h. Fotógrafo chega às 17h30 para o making of.',
      participants: {
        create: [
          { name: 'Juliana Ferraz', role: 'BRIDE', customerId: customers.juliana.id },
          { name: 'Regina Ferraz', role: 'MOTHER', phone: '11991110022' },
          { name: 'Camila Rocha', role: 'BRIDESMAID', customerId: customers.camila.id },
          { name: 'Tatiana Vieira', role: 'BRIDESMAID', customerId: customers.tatiana.id },
        ],
      },
    },
  });

  // Cronograma reverso: pronta às 18:00 no dia do casamento.
  await book({
    customer: 'juliana', branch: 'jardins', date: weddingDate, time: '15:15',
    items: [{ service: 'maquiagem-noiva', pro: 'sofia' }],
    eventId: wedding.id, readyBy: at(weddingDate, '18:00'),
    notes: 'Pronta às 18:00. Véu curto, batom nude.',
  });
  await book({
    customer: 'camila', branch: 'jardins', date: weddingDate, time: '14:00',
    items: [{ service: 'maquiagem-festa', pro: 'carla' }],
    eventId: wedding.id, readyBy: at(weddingDate, '18:00'),
  });
  await book({
    customer: 'tatiana', branch: 'jardins', date: weddingDate, time: '16:00',
    items: [{ service: 'maquiagem-festa', pro: 'carla' }],
    eventId: wedding.id, readyBy: at(weddingDate, '18:00'),
  });
  // Teste de maquiagem antes da data.
  await book({
    customer: 'juliana', branch: 'jardins', date: businessDay(8), time: '14:00',
    items: [{ service: 'teste-noiva', pro: 'sofia' }],
    eventId: wedding.id,
    notes: 'Teste — levar o véu e a foto do vestido.',
  });

  // ── pacotes e assinaturas ativos ───────────────────────────────────────────
  console.log('› utilização de pacotes');
  await db.customerPackage.create({
    data: {
      customerId: customers.maria.id,
      packageId: packages['nail-package'],
      totalSessions: 5,
      usedSessions: 3,
      pricePaid: 15000,
      expiresAt: day(41),
    },
  });
  await db.customerPackage.create({
    data: {
      customerId: customers.juliana.id,
      packageId: packages['brow-package'],
      totalSessions: 4,
      usedSessions: 2,
      pricePaid: 12000,
      expiresAt: day(63),
    },
  });
  await db.customerPackage.create({
    data: {
      customerId: customers.camila.id,
      packageId: packages['lash-package'],
      totalSessions: 3,
      usedSessions: 1,
      pricePaid: 27000,
      expiresAt: day(75),
    },
  });

  const cycleStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const cycleEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
  for (const [customerKey, planKey] of [['maria', 'club'], ['patricia', 'premium'], ['tatiana', 'essential'], ['bianca', 'club']] as const) {
    await db.subscription.create({
      data: {
        customerId: customers[customerKey].id,
        planId: plans[planKey],
        cycleStart,
        cycleEnd,
        startedAt: day(-120),
      },
    });
  }

  // ── portfólio ──────────────────────────────────────────────────────────────
  console.log('› portfólio');
  const portfolioSeeds: { pro: string; service: string; title: string; tags: string; image: string; featured?: boolean }[] = [
    { pro: 'ana', service: 'alongamento-gel', title: 'Amendoado nude leitoso', tags: 'Alongamento,Minimalista', image: img('portfolio-amendoado-nude-leitoso.jpg'), featured: true },
    { pro: 'ana', service: 'esmaltacao-gel', title: 'Gel vermelho clássico', tags: 'Esmaltação,Clássico', image: img('portfolio-gel-vermelho-classico.jpg') },
    { pro: 'ana', service: 'alongamento-fibra', title: 'Fibra com francesinha fina', tags: 'Alongamento,Francesinha', image: img('portfolio-fibra-com-francesinha-fina.jpg'), featured: true },
    { pro: 'paula', service: 'nail-art', title: 'Chrome espelhado', tags: 'Nail Art,Chrome', image: img('portfolio-chrome-espelhado.jpg'), featured: true },
    { pro: 'paula', service: 'nail-art', title: 'Linhas minimalistas', tags: 'Nail Art,Minimalista', image: img('portfolio-linhas-minimalistas.jpg') },
    { pro: 'paula', service: 'esmaltacao-gel', title: 'Francesinha invertida', tags: 'Francesinha,Nail Art', image: img('portfolio-francesinha-invertida.jpg') },
    { pro: 'bruna', service: 'manicure-pedicure', title: 'Rosa leitoso', tags: 'Minimalista,Clássico', image: img('portfolio-rosa-leitoso.jpg') },
    { pro: 'julia', service: 'design-henna', title: 'Arco suave com henna', tags: 'Sobrancelhas,Henna', image: img('portfolio-arco-suave-com-henna.jpg'), featured: true },
    { pro: 'julia', service: 'brow-lamination', title: 'Laminação efeito volume', tags: 'Sobrancelhas,Laminação', image: img('portfolio-laminacao-efeito-volume.jpg') },
    { pro: 'larissa', service: 'volume-russo', title: 'Volume russo 4D', tags: 'Cílios,Volume', image: img('portfolio-volume-russo-4d.jpg'), featured: true },
    { pro: 'larissa', service: 'lash-lifting', title: 'Lash lifting natural', tags: 'Cílios,Natural', image: img('portfolio-lash-lifting-natural.jpg') },
    { pro: 'carla', service: 'maquiagem-social', title: 'Glow natural', tags: 'Maquiagem,Natural', image: img('portfolio-glow-natural.jpg'), featured: true },
    { pro: 'carla', service: 'maquiagem-festa', title: 'Olhos esfumados', tags: 'Maquiagem,Glam,Festa', image: img('portfolio-olhos-esfumados.jpg') },
    { pro: 'sofia', service: 'maquiagem-noiva', title: 'Noiva clássica', tags: 'Maquiagem,Noiva', image: img('portfolio-noiva-classica.jpg'), featured: true },
    { pro: 'sofia', service: 'maquiagem-cabelo', title: 'Coque baixo e pele luminosa', tags: 'Maquiagem,Noiva,Cabelo', image: img('portfolio-coque-baixo-e-pele-luminosa.jpg') },
    { pro: 'renata', service: 'limpeza-pele', title: 'Pele renovada', tags: 'Estética,Pele', image: img('portfolio-pele-renovada.jpg') },
  ];

  const categoryByService: Record<string, string> = {};
  for (const seed of serviceSeeds) categoryByService[seed.slug] = seed.category;

  await db.portfolioItem.createMany({
    data: portfolioSeeds.map((seed, index) => ({
      professionalId: pros[seed.pro].id,
      serviceId: services[seed.service].id,
      categoryId: categories[categoryByService[seed.service]],
      title: seed.title,
      imageUrl: seed.image,
      styleTags: seed.tags,
      visibility: 'PUBLIC_PORTFOLIO',
      consentGiven: true,
      isFeatured: seed.featured ?? false,
      sortOrder: index,
    })),
  });

  await db.inspirationImage.createMany({
    data: [
      { customerId: customers.maria.id, imageUrl: img('inspiracao-1.jpg'), note: 'Quero algo assim, mas em nude.', categorySlug: 'unhas' },
      { customerId: customers.maria.id, imageUrl: img('inspiracao-2.jpg'), note: 'Referência para o jantar.', categorySlug: 'maquiagem', sharedWithId: pros.carla.id },
      { customerId: customers.juliana.id, imageUrl: img('inspiracao-3.jpg'), note: 'Pele natural, batom nude rosado.', categorySlug: 'maquiagem', sharedWithId: pros.sofia.id },
      { customerId: customers.juliana.id, imageUrl: img('inspiracao-4.jpg'), note: 'Cabelo preso, mas com movimento.', categorySlug: 'maquiagem', sharedWithId: pros.sofia.id },
    ],
  });

  // ── bloqueios, avisos e avaliações ─────────────────────────────────────────
  await db.blockedSlot.create({
    data: {
      professionalId: pros.carla.id,
      startAt: at(businessDay(2), '12:00'),
      endAt: at(businessDay(2), '15:00'),
      reason: 'Curso de aperfeiçoamento',
      type: 'BLOCK',
    },
  });
  await db.blockedSlot.create({
    data: {
      professionalId: pros.ana.id,
      startAt: at(businessDay(9), '09:00'),
      endAt: at(businessDay(11), '20:00'),
      reason: 'Férias',
      type: 'VACATION',
    },
  });

  await db.notification.createMany({
    data: [
      { customerId: customers.maria.id, type: 'REMINDER', title: 'Seu horário é amanhã', body: 'Manutenção de alongamento com Ana às 10:00, na Unidade Centro.', actionUrl: '/minha-conta/agendamentos' },
      { customerId: customers.maria.id, type: 'RECURRENCE', title: 'Está na hora do seu design', body: 'Seu último design de sobrancelhas foi há 35 dias.', actionUrl: '/agendar' },
      { customerId: customers.juliana.id, type: 'REMINDER', title: 'Teste de maquiagem marcado', body: 'Seu teste com Sofia está confirmado. Leve o véu e a foto do vestido.', actionUrl: '/minha-conta/agendamentos' },
      { userId: ownerUser.id, type: 'OPS', title: 'Agenda de hoje', body: 'Você tem 13 atendimentos hoje.', actionUrl: '/admin/agenda', audience: 'OWNER' },
    ],
  });

  await db.review.createMany({
    data: [
      { customerId: customers.maria.id, professionalId: pros.ana.id, rating: 5, comment: 'A Ana entende exatamente o formato que eu gosto. Nunca precisei explicar duas vezes.', isPublic: true },
      { customerId: customers.juliana.id, professionalId: pros.julia.id, rating: 5, comment: 'Sobrancelha simétrica de verdade. E o registro da cor da henna faz toda diferença.', isPublic: true },
      { customerId: customers.camila.id, professionalId: pros.larissa.id, rating: 5, comment: 'Volume russo impecável e a manutenção sai idêntica todas as vezes.', isPublic: true },
      { customerId: customers.bianca.id, professionalId: pros.paula.id, rating: 5, comment: 'Levo uma referência e ela devolve algo melhor.', isPublic: true },
    ],
  });

  await db.waitlistEntry.create({
    data: {
      customerId: customers.sabrina.id,
      serviceId: services['volume-russo'].id,
      professionalId: pros.larissa.id,
      branchId: centro.id,
      preferredFrom: businessDay(1),
      preferredTo: businessDay(7),
      preferredPeriod: 'AFTERNOON',
      notes: 'Qualquer horário à tarde serve.',
    },
  });

  const counts = await Promise.all([
    db.service.count(),
    db.professional.count(),
    db.customer.count(),
    db.appointment.count(),
    db.portfolioItem.count(),
  ]);

  console.log('\n✓ Lumi Beauty Studio pronto');
  console.log(`  ${counts[0]} serviços · ${counts[1]} profissionais · ${counts[2]} clientes · ${counts[3]} agendamentos · ${counts[4]} trabalhos no portfólio`);
  console.log('\n  Acessos de demonstração (senha: lumi1234)');
  console.log('  dona@lumi.studio      → dona do estúdio');
  console.log('  gestao@lumi.studio    → gestão');
  console.log('  ana@lumi.studio       → profissional (nail designer)');
  console.log('  julia@lumi.studio     → profissional (sobrancelhas)');
  console.log('  sofia@lumi.studio     → profissional (noivas)');
  console.log('  maria@cliente.com     → cliente com histórico');
  console.log('  juliana@cliente.com   → cliente noiva');
  console.log('  produto@lumi.studio   → gestor do produto (white-label)\n');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
