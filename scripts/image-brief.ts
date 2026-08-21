/**
 * Gera o briefing de imagens do estúdio a partir do banco.
 *
 * O app consome imagem em slots com proporções fixas, definidas no design
 * system. Este script lê o que está cadastrado e escreve `docs/image-brief.md`
 * com nome de arquivo, proporção, tamanho e assunto de cada peça — para
 * produzir, encomendar ou gerar o conjunto sem adivinhação.
 *
 *   npm run brief
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { parseList } from '../src/lib/utils';

const db = new PrismaClient();

/** Proporções reais dos slots — conferidas contra os componentes que os usam. */
const SLOTS = {
  category: { ratio: '1:1', size: '1600×1600', note: 'recortada em 3:4 e 4:3 na grade da Home' },
  service: { ratio: '4:3', size: '1600×1200', note: 'cartão de serviço no catálogo' },
  avatar: { ratio: '1:1', size: '800×800', note: 'exibida em círculo, rosto centralizado' },
  cover: { ratio: '3:4', size: '1200×1600', note: 'capa do perfil e cartão da equipe' },
  portfolio: { ratio: '1:1', size: '1400×1400', note: 'galeria e lightbox' },
  package: { ratio: '4:3', size: '1600×1200', note: 'cartão de pacote' },
  branch: { ratio: '16:9', size: '1920×1080', note: 'cartão de unidade' },
  inspiration: { ratio: '1:1', size: '1000×1000', note: 'quadro de inspirações da cliente' },
  hero: { ratio: '4:3', size: '1920×1440', note: 'hero da Home' },
  editorial: { ratio: '3:2', size: '2400×1600', note: 'faixa de página inteira' },
} as const;

type Row = {
  file: string;
  slot: keyof typeof SLOTS;
  subject: string;
  /** Mão e unha em close são onde modelos generativos falham com mais frequência. */
  risky: boolean;
  field: string;
};

function slug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const HANDS = /unha|manicure|pedicure|alongamento|nail|gel|francesinha|chrome|blindagem|esmalt|remo/i;

async function main() {
  const [categories, services, professionals, portfolio, packages, branches, inspirations] =
    await Promise.all([
      db.serviceCategory.findMany({ orderBy: { sortOrder: 'asc' } }),
      db.service.findMany({
        where: { imageUrl: { not: null } },
        orderBy: { sortOrder: 'asc' },
        include: { category: { select: { name: true } } },
      }),
      db.professional.findMany({ orderBy: { sortOrder: 'asc' } }),
      db.portfolioItem.findMany({
        orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
        include: {
          professional: { select: { displayName: true, title: true } },
          service: { select: { name: true } },
        },
      }),
      db.package.findMany({ orderBy: { sortOrder: 'asc' } }),
      db.branch.findMany({ orderBy: { sortOrder: 'asc' } }),
      db.inspirationImage.findMany({ orderBy: { createdAt: 'asc' } }),
    ]);

  const rows: Row[] = [];

  for (const category of categories) {
    rows.push({
      file: `categoria-${category.slug}.jpg`,
      slot: 'category',
      subject: `${category.name} — ${category.tagline ?? ''}`.trim(),
      risky: HANDS.test(category.name),
      field: `ServiceCategory("${category.slug}").coverImage`,
    });
  }

  for (const service of services) {
    rows.push({
      file: `servico-${service.slug}.jpg`,
      slot: 'service',
      subject: `${service.name} (${service.category.name}) — ${service.shortDescription ?? ''}`.trim(),
      risky: HANDS.test(service.name),
      field: `Service("${service.slug}").imageUrl`,
    });
  }

  for (const professional of professionals) {
    const key = slug(professional.displayName);
    rows.push({
      file: `equipe-${key}-avatar.jpg`,
      slot: 'avatar',
      subject: `Retrato de ${professional.displayName}, ${professional.title ?? 'profissional'} — olhar para a câmera, fundo neutro`,
      risky: false,
      field: `Professional("${professional.displayName}").avatarUrl`,
    });
    rows.push({
      file: `equipe-${key}-capa.jpg`,
      slot: 'cover',
      subject: `${professional.displayName} em contexto de trabalho: ${parseList(professional.specialties).join(', ') || professional.title}`,
      risky: HANDS.test(professional.specialties ?? ''),
      field: `Professional("${professional.displayName}").coverUrl`,
    });
  }

  for (const item of portfolio) {
    rows.push({
      file: `portfolio-${slug(item.title)}.jpg`,
      slot: 'portfolio',
      subject: `${item.title} — ${item.service?.name ?? ''} por ${item.professional?.displayName ?? 'equipe'}${item.styleTags ? ` · estilo: ${item.styleTags}` : ''}`,
      risky: HANDS.test(`${item.title} ${item.service?.name ?? ''} ${item.styleTags ?? ''}`),
      field: `PortfolioItem("${item.title}").imageUrl`,
    });
  }

  for (const pack of packages) {
    rows.push({
      file: `pacote-${pack.slug}.jpg`,
      slot: 'package',
      subject: `${pack.name} — ${pack.tagline ?? ''}`.trim(),
      risky: HANDS.test(pack.tagline ?? ''),
      field: `Package("${pack.slug}").imageUrl`,
    });
  }

  for (const branch of branches) {
    rows.push({
      file: `unidade-${branch.slug}.jpg`,
      slot: 'branch',
      subject: `Interior do ${branch.name} — ${branch.district ?? branch.city}, ambiente do estúdio sem pessoas`,
      risky: false,
      field: `Branch("${branch.slug}").imageUrl`,
    });
  }

  inspirations.forEach((inspiration, index) => {
    rows.push({
      file: `inspiracao-${index + 1}.jpg`,
      slot: 'inspiration',
      subject: `Referência salva pela cliente${inspiration.note ? `: "${inspiration.note}"` : ''}`,
      risky: HANDS.test(inspiration.note ?? ''),
      field: `InspirationImage[${index}].imageUrl`,
    });
  });

  // Slots que vivem na configuração e nas páginas, não no banco.
  rows.push(
    {
      file: 'hero-home.jpg',
      slot: 'hero',
      subject: 'Ambiente do estúdio, luz natural — imagem principal da Home',
      risky: false,
      field: 'DEFAULT_CONTENT.hero.imageUrl (src/lib/brand/config.ts)',
    },
    {
      file: 'sobre-estudio.jpg',
      slot: 'service',
      subject: 'Detalhe do estúdio para a seção "O estúdio"',
      risky: false,
      field: 'DEFAULT_CONTENT.about.imageUrl (src/lib/brand/config.ts)',
    },
    {
      file: 'noivas-hero.jpg',
      slot: 'editorial',
      subject: 'Produção de noiva — faixa de página inteira em /noivas',
      risky: false,
      field: 'src/app/(site)/noivas/page.tsx',
    },
    {
      file: 'home-noivas.jpg',
      slot: 'service',
      subject: 'Produção de noiva — seção de eventos na Home',
      risky: false,
      field: 'src/app/(site)/page.tsx',
    },
  );

  const risky = rows.filter((row) => row.risky);

  const lines = [
    '# Briefing de imagens',
    '',
    `Gerado por \`npm run brief\` a partir do banco. **${rows.length} imagens.**`,
    '',
    'Todas vão para `public/media/`. O nome do arquivo é o contrato: o seed e a',
    'configuração passam a apontar para `/media/<arquivo>`.',
    '',
    '## Direção de arte',
    '',
    'Editorial e sóbria, como catálogo de marca de beleza — não como banco de',
    'imagens de salão. Luz natural difusa, paleta quente e neutra (bege, cacau,',
    'terracota suave, off-white), fundo limpo, profundidade rasa. Sem texto na',
    'imagem, sem marca d\'água, sem colagem, sem saturação alta, sem glitter, sem',
    'moldura decorativa. Enquadramento com respiro: parte da composição precisa',
    'sobreviver a recortes de 1:1, 3:4 e 4:3.',
    '',
    '## Atenção',
    '',
    `${risky.length} das ${rows.length} imagens têm mão ou unha em primeiro plano — é onde modelos`,
    'generativos falham (dedo a mais, unha deformada, junta impossível). Confira',
    'uma a uma em tamanho real e descarte o que não passar. Nas demais o risco é',
    'baixo.',
    '',
    '## Proporções',
    '',
    '| Slot | Proporção | Tamanho | Uso |',
    '| --- | --- | --- | --- |',
    ...Object.entries(SLOTS).map(
      ([key, value]) => `| \`${key}\` | ${value.ratio} | ${value.size} | ${value.note} |`,
    ),
    '',
    '## Peças',
    '',
    '| # | Arquivo | Slot | Assunto | Mão/unha | Campo |',
    '| --- | --- | --- | --- | --- | --- |',
    ...rows.map(
      (row, index) =>
        `| ${index + 1} | \`${row.file}\` | ${row.slot} | ${row.subject.replace(/\|/g, '/')} | ${row.risky ? '⚠ sim' : '—'} | \`${row.field}\` |`,
    ),
    '',
  ];

  mkdirSync(join(process.cwd(), 'docs'), { recursive: true });
  writeFileSync(join(process.cwd(), 'docs', 'image-brief.md'), lines.join('\n'));

  console.log(`✓ docs/image-brief.md — ${rows.length} imagens (${risky.length} com mão/unha)`);
  await db.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await db.$disconnect();
  process.exit(1);
});
