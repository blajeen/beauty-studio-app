/**
 * Vocabulário do domínio. Strings (não enums do Prisma) porque o datasource é
 * SQLite — os tipos abaixo garantem a segurança em tempo de compilação.
 */

export const ROLES = ['OWNER', 'MANAGER', 'PROFESSIONAL', 'CUSTOMER', 'PRODUCT_MANAGER'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  OWNER: 'Proprietária',
  MANAGER: 'Gestão',
  PROFESSIONAL: 'Profissional',
  CUSTOMER: 'Cliente',
  PRODUCT_MANAGER: 'Gestor do produto',
};

/** Rota inicial de cada perfil após o login. */
export const ROLE_HOME: Record<Role, string> = {
  OWNER: '/admin',
  MANAGER: '/admin',
  PROFESSIONAL: '/pro',
  CUSTOMER: '/minha-conta',
  PRODUCT_MANAGER: '/studio',
};

export const APPOINTMENT_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  PENDING: 'Aguardando confirmação',
  CONFIRMED: 'Confirmado',
  IN_PROGRESS: 'Em atendimento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  NO_SHOW: 'Não compareceu',
};

/** Estados que ocupam a agenda e disputam horário. */
export const BLOCKING_STATUSES: AppointmentStatus[] = ['PENDING', 'CONFIRMED', 'IN_PROGRESS'];

export const EVENT_STATUSES = ['DRAFT', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  DRAFT: 'Em planejamento',
  CONFIRMED: 'Confirmado',
  COMPLETED: 'Realizado',
  CANCELLED: 'Cancelado',
};

export const EVENT_TYPES = [
  'WEDDING',
  'GRADUATION',
  'BIRTHDAY',
  'PARTY',
  'PHOTOSHOOT',
  'CORPORATE',
  'OTHER',
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  WEDDING: 'Casamento',
  GRADUATION: 'Formatura',
  BIRTHDAY: 'Aniversário',
  PARTY: 'Festa',
  PHOTOSHOOT: 'Ensaio fotográfico',
  CORPORATE: 'Evento corporativo',
  OTHER: 'Outro',
};

export const PRICE_TYPES = ['FIXED', 'FROM', 'CUSTOM', 'CONSULTATION'] as const;
export type PriceType = (typeof PRICE_TYPES)[number];

export const VISIBILITIES = ['PRIVATE', 'CLIENT_VISIBLE', 'PUBLIC_PORTFOLIO'] as const;
export type Visibility = (typeof VISIBILITIES)[number];

export const VISIBILITY_LABEL: Record<Visibility, string> = {
  PRIVATE: 'Somente o estúdio',
  CLIENT_VISIBLE: 'Visível para a cliente',
  PUBLIC_PORTFOLIO: 'Portfólio público',
};

export const VISIBILITY_HINT: Record<Visibility, string> = {
  PRIVATE: 'Uso interno. Fica na ficha técnica e não é exibida a ninguém fora do estúdio.',
  CLIENT_VISIBLE: 'A cliente vê no histórico dela. Não aparece no portfólio público.',
  PUBLIC_PORTFOLIO: 'Aparece no portfólio. Exige consentimento explícito da cliente.',
};

export const PARTICIPANT_ROLES = ['BRIDE', 'GROOM', 'MOTHER', 'BRIDESMAID', 'GUEST', 'OTHER'] as const;
export type ParticipantRole = (typeof PARTICIPANT_ROLES)[number];

export const PARTICIPANT_ROLE_LABEL: Record<ParticipantRole, string> = {
  BRIDE: 'Noiva',
  GROOM: 'Noivo',
  MOTHER: 'Mãe',
  BRIDESMAID: 'Madrinha',
  GUEST: 'Convidada',
  OTHER: 'Outro',
};

export const WEEKDAYS = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
] as const;

export const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

export const PERIODS = [
  { id: 'MORNING', label: 'Manhã', from: '00:00', to: '12:00' },
  { id: 'AFTERNOON', label: 'Tarde', from: '12:00', to: '18:00' },
  { id: 'EVENING', label: 'Noite', from: '18:00', to: '23:59' },
] as const;
export type PeriodId = (typeof PERIODS)[number]['id'];

/**
 * Perfis de ficha técnica. Cada serviço aponta para um deles (Service.recordSchema)
 * e a profissional vê apenas os campos que fazem sentido para a especialidade —
 * nunca um formulário gigante.
 */
export const RECORD_SCHEMAS = {
  nail: {
    label: 'Unhas',
    fields: ['technique', 'shape', 'lengthSpec', 'color', 'decoration', 'materials', 'observations'],
  },
  brow: {
    label: 'Sobrancelhas',
    fields: ['technique', 'shape', 'color', 'product', 'observations'],
  },
  lash: {
    label: 'Cílios',
    fields: ['technique', 'curvature', 'lengthSpec', 'effect', 'volume', 'observations'],
  },
  makeup: {
    label: 'Maquiagem',
    fields: ['style', 'color', 'product', 'observations'],
  },
  skin: {
    label: 'Estética',
    fields: ['technique', 'product', 'observations'],
  },
  body: {
    label: 'Corporal',
    fields: ['technique', 'product', 'observations'],
  },
} as const;

export type RecordSchemaKey = keyof typeof RECORD_SCHEMAS;

export const RECORD_FIELD_LABEL: Record<string, string> = {
  technique: 'Técnica',
  shape: 'Formato',
  lengthSpec: 'Comprimento',
  color: 'Cor',
  style: 'Estilo',
  decoration: 'Decoração',
  curvature: 'Curvatura',
  effect: 'Efeito',
  volume: 'Volume',
  product: 'Produto',
  materials: 'Material utilizado',
  observations: 'Observações',
};

export const RECORD_FIELD_PLACEHOLDER: Record<string, string> = {
  technique: 'Ex.: fibra de vidro, molde F1',
  shape: 'Ex.: amendoado, quadrado suave',
  lengthSpec: 'Ex.: médio (nº 3)',
  color: 'Ex.: nude rosado 214',
  style: 'Ex.: glow natural, olhos marcados',
  decoration: 'Ex.: francesinha fina + chrome',
  curvature: 'Ex.: curvatura D',
  effect: 'Ex.: efeito boneca',
  volume: 'Ex.: 3D',
  product: 'Ex.: henna castanho médio',
  materials: 'Ex.: gel builder + top coat',
  observations: 'O que vale lembrar no próximo atendimento',
};

/** Sugestões rápidas por campo — reduzem digitação durante o atendimento. */
export const RECORD_FIELD_SUGGESTIONS: Record<string, string[]> = {
  shape: ['Amendoado', 'Quadrado', 'Quadrado suave', 'Bailarina', 'Oval', 'Stiletto'],
  lengthSpec: ['Curto', 'Médio', 'Longo', 'Extra longo'],
  curvature: ['Curvatura C', 'Curvatura CC', 'Curvatura D', 'Curvatura L'],
  effect: ['Efeito boneca', 'Efeito gatinho', 'Efeito esquilo', 'Natural'],
  volume: ['Clássico 1:1', 'Brasileiro 2D', 'Russo 3D', 'Russo 4D+'],
  style: ['Natural', 'Glam', 'Noiva', 'Festa', 'Editorial'],
};

export const CANCEL_REASONS = [
  'Imprevisto pessoal',
  'Problema de saúde',
  'Conflito de agenda',
  'Remarquei para outra data',
  'Outro motivo',
];
