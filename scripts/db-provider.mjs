/**
 * Alinha o provider do Prisma com a string de conexão.
 *
 * O Prisma exige um provider literal no schema — não aceita variável de
 * ambiente. Como o produto roda em SQLite no desenvolvimento e em PostgreSQL
 * na hospedagem, este passo lê `DATABASE_URL` e ajusta a linha antes de
 * `prisma generate`. É idempotente: só escreve quando há diferença.
 *
 * Roda automaticamente no `npm run build`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const schemaPath = join(root, 'prisma', 'schema.prisma');

function providerFor(url) {
  if (!url) return null;
  if (url.startsWith('file:')) return 'sqlite';
  if (url.startsWith('postgres://') || url.startsWith('postgresql://')) return 'postgresql';
  if (url.startsWith('mysql://')) return 'mysql';
  if (url.startsWith('sqlserver://')) return 'sqlserver';
  return null;
}

const url = process.env.DATABASE_URL;
const provider = providerFor(url);

if (!provider) {
  // Sem URL reconhecível, deixamos o schema como está: o Prisma dará a mensagem
  // de erro adequada, mais clara do que qualquer coisa que inventássemos aqui.
  if (url) console.warn(`[db-provider] DATABASE_URL não reconhecida, mantendo o schema atual.`);
  process.exit(0);
}

const schema = readFileSync(schemaPath, 'utf8');
const current = schema.match(/datasource\s+db\s*\{[^}]*?provider\s*=\s*"([^"]+)"/s)?.[1];

if (current === provider) process.exit(0);

const updated = schema.replace(
  /(datasource\s+db\s*\{[^}]*?provider\s*=\s*")[^"]+(")/s,
  `$1${provider}$2`,
);

if (updated === schema) {
  console.error('[db-provider] não encontrei o provider em prisma/schema.prisma');
  process.exit(1);
}

writeFileSync(schemaPath, updated);
console.log(`[db-provider] provider ajustado: ${current} → ${provider}`);
