/**
 * WHITE-LABEL — contrato de configuração.
 *
 * Nenhum componente da aplicação conhece o nome, as cores ou os textos do
 * estúdio. Tudo vem daqui, é lido do banco (tabela Setting) e injetado como
 * CSS custom properties + contexto React. Vender a mesma base para outro
 * Beauty Studio = trocar este objeto pelo painel do Product Manager.
 */

export type BrandConfig = {
  /** Nome comercial exibido em toda a aplicação. */
  name: string;
  /** Versão curta para espaços apertados (bottom nav, PWA). */
  shortName: string;
  /** Assinatura de marca. */
  tagline: string;
  /** Monograma usado quando não há logo em imagem. */
  monogram: string;
  logoUrl: string | null;
  faviconEmoji: string;
  colors: {
    /** Cor de ação principal — botões, foco, estados ativos. */
    primary: string;
    primaryContrast: string;
    /** Apoio para superfícies escuras e seções editoriais. */
    secondary: string;
    /** Realce discreto — badges, detalhes, hover. */
    accent: string;
    /** Fundo geral da aplicação. */
    background: string;
    /** Cartões e superfícies elevadas. */
    surface: string;
    /** Texto principal. */
    foreground: string;
    /** Texto de apoio. */
    muted: string;
    /** Linhas e divisores. */
    border: string;
  };
  fonts: {
    /** Tipografia editorial para títulos. */
    display: string;
    /** Tipografia de leitura para interface. */
    body: string;
  };
  radius: 'sharp' | 'soft' | 'round';
  contact: {
    whatsapp: string;
    phone: string;
    email: string;
    instagram: string;
  };
  legal: {
    companyName: string;
    document: string;
  };
  /** Liga/desliga módulos inteiros sem tocar em código. */
  features: {
    packages: boolean;
    beautyClub: boolean;
    events: boolean;
    portfolio: boolean;
    inspiration: boolean;
    waitlist: boolean;
    reviews: boolean;
    multiBranch: boolean;
  };
  policies: {
    cancellationHours: number;
    cancellationText: string;
    lateText: string;
    depositText: string;
  };
  booking: {
    /** Passo da grade de horários, em minutos. */
    slotStep: number;
    /** Antecedência mínima para reservar, em horas. */
    minLeadTimeHours: number;
    /** Janela máxima de agendamento, em dias. */
    maxAdvanceDays: number;
    /** Minutos de preparo somados no cronograma reverso de eventos. */
    eventPrepBuffer: number;
  };
};

export type ContentConfig = {
  hero: {
    eyebrow: string;
    headline: string;
    subheadline: string;
    imageUrl: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  /** Provas de credibilidade abaixo da dobra. */
  highlights: { label: string; value: string }[];
  about: {
    eyebrow: string;
    title: string;
    body: string;
    imageUrl: string;
    signature: string;
  };
  editorial: {
    quote: string;
    author: string;
  };
  /** Imagens da seção de noivas — antes escritas dentro dos componentes. */
  bridal: {
    heroImageUrl: string;
    sectionImageUrl: string;
  };
  faq: { question: string; answer: string }[];
  footerNote: string;
};

export const DEFAULT_BRAND: BrandConfig = {
  name: 'Lumi Beauty Studio',
  shortName: 'Lumi',
  tagline: 'Beleza com assinatura',
  monogram: 'L',
  logoUrl: null,
  faviconEmoji: '✦',
  colors: {
    primary: '#3B2C28',
    primaryContrast: '#FBF8F5',
    secondary: '#1C1512',
    accent: '#B98A76',
    background: '#F7F3EF',
    surface: '#FFFFFF',
    foreground: '#241C19',
    muted: '#8A7C74',
    border: '#E4DCD4',
  },
  fonts: {
    display: "'Cormorant Garamond', 'Times New Roman', serif",
    body: "'Inter', system-ui, -apple-system, sans-serif",
  },
  radius: 'soft',
  contact: {
    whatsapp: '5511987654321',
    phone: '(11) 98765-4321',
    email: 'contato@lumibeautystudio.com.br',
    instagram: 'lumibeautystudio',
  },
  legal: {
    companyName: 'Lumi Beauty Studio LTDA',
    document: '00.000.000/0001-00',
  },
  features: {
    packages: true,
    beautyClub: true,
    events: true,
    portfolio: true,
    inspiration: true,
    waitlist: true,
    reviews: true,
    multiBranch: true,
  },
  policies: {
    cancellationHours: 6,
    cancellationText:
      'Cancelamentos com menos de 6 horas de antecedência podem estar sujeitos às regras do estúdio.',
    lateText: 'Tolerância de 15 minutos. Após esse período o horário pode precisar ser ajustado.',
    depositText: 'Serviços de noiva e eventos podem exigir sinal para reserva de data.',
  },
  booking: {
    slotStep: 15,
    minLeadTimeHours: 2,
    maxAdvanceDays: 90,
    eventPrepBuffer: 15,
  },
};

export const DEFAULT_CONTENT: ContentConfig = {
  hero: {
    eyebrow: 'Beauty Studio',
    headline: 'Sua beleza, no seu melhor momento.',
    subheadline:
      'Unhas, sobrancelhas, cílios, maquiagem e estética em um só lugar — com as profissionais que já conhecem o seu estilo.',
    imageUrl: '/media/hero-home.jpg',
    ctaPrimary: 'Agendar horário',
    ctaSecondary: 'Falar com a equipe',
  },
  highlights: [
    { label: 'Profissionais', value: '8' },
    { label: 'Serviços no catálogo', value: '40+' },
    { label: 'Unidades', value: '2' },
    { label: 'Clientes atendidas', value: '2.400' },
  ],
  about: {
    eyebrow: 'O estúdio',
    title: 'Um lugar pensado para o seu tempo',
    body: 'Nascemos com uma ideia simples: reunir, em um só endereço, as profissionais que cuidam de cada detalhe da sua rotina de beleza. Aqui a sua ficha acompanha você — a técnica das suas unhas, o formato da sua sobrancelha, o tom que combina com a sua pele. Você não precisa explicar tudo de novo a cada visita.',
    imageUrl: '/media/sobre-estudio.jpg',
    signature: 'Equipe Lumi',
  },
  editorial: {
    quote: 'Beleza não é ocasião. É a forma como você se apresenta ao mundo todos os dias.',
    author: 'Lumi Beauty Studio',
  },
  bridal: {
    heroImageUrl: '/media/noivas-hero.jpg',
    sectionImageUrl: '/media/home-noivas.jpg',
  },
  faq: [
    {
      question: 'Preciso pagar antecipado para agendar?',
      answer:
        'Não. O agendamento é confirmado no app e o pagamento acontece no estúdio, conforme as formas aceitas. Serviços de noiva e eventos podem exigir sinal para reserva de data.',
    },
    {
      question: 'Posso agendar vários serviços no mesmo dia?',
      answer:
        'Pode. Selecione tudo o que deseja e o app monta a sequência dos atendimentos, mesmo que sejam com profissionais diferentes. Você vê o roteiro completo antes de confirmar.',
    },
    {
      question: 'Como funciona a maquiagem para eventos?',
      answer:
        'Você informa o horário em que precisa estar pronta e o app calcula o horário ideal de início, somando o tempo de cada serviço e o preparo. Para casamentos existe um fluxo dedicado, com teste incluído.',
    },
    {
      question: 'E se eu precisar remarcar?',
      answer:
        'Você remarca pelo próprio app, na tela do agendamento. Serviços, profissionais e a ordem dos atendimentos são preservados — apenas a disponibilidade é recalculada.',
    },
    {
      question: 'As fotos dos meus atendimentos podem ir para o portfólio?',
      answer:
        'Somente com a sua autorização. Por padrão as fotos ficam restritas à sua ficha e você decide, a qualquer momento, se podem aparecer no portfólio público.',
    },
  ],
  footerNote: 'Feito para quem cuida da própria rotina de beleza com intenção.',
};

/** Garante que configurações antigas ou parciais continuem válidas após um deploy. */
export function mergeBrand(partial: unknown): BrandConfig {
  const value = (partial ?? {}) as Partial<BrandConfig>;
  return {
    ...DEFAULT_BRAND,
    ...value,
    colors: { ...DEFAULT_BRAND.colors, ...(value.colors ?? {}) },
    fonts: { ...DEFAULT_BRAND.fonts, ...(value.fonts ?? {}) },
    contact: { ...DEFAULT_BRAND.contact, ...(value.contact ?? {}) },
    legal: { ...DEFAULT_BRAND.legal, ...(value.legal ?? {}) },
    features: { ...DEFAULT_BRAND.features, ...(value.features ?? {}) },
    policies: { ...DEFAULT_BRAND.policies, ...(value.policies ?? {}) },
    booking: { ...DEFAULT_BRAND.booking, ...(value.booking ?? {}) },
  };
}

export function mergeContent(partial: unknown): ContentConfig {
  const value = (partial ?? {}) as Partial<ContentConfig>;
  return {
    ...DEFAULT_CONTENT,
    ...value,
    hero: { ...DEFAULT_CONTENT.hero, ...(value.hero ?? {}) },
    about: { ...DEFAULT_CONTENT.about, ...(value.about ?? {}) },
    editorial: { ...DEFAULT_CONTENT.editorial, ...(value.editorial ?? {}) },
    bridal: { ...DEFAULT_CONTENT.bridal, ...(value.bridal ?? {}) },
    highlights: value.highlights?.length ? value.highlights : DEFAULT_CONTENT.highlights,
    faq: value.faq?.length ? value.faq : DEFAULT_CONTENT.faq,
  };
}

const RADIUS_SCALE: Record<BrandConfig['radius'], { sm: string; md: string; lg: string; xl: string }> = {
  sharp: { sm: '2px', md: '3px', lg: '4px', xl: '6px' },
  soft: { sm: '6px', md: '10px', lg: '16px', xl: '24px' },
  round: { sm: '10px', md: '16px', lg: '24px', xl: '36px' },
};

/**
 * Converte a configuração em CSS custom properties.
 * É o único ponto onde a marca vira estilo — todo o design system consome estas variáveis.
 */
export function brandToCssVariables(brand: BrandConfig): string {
  const r = RADIUS_SCALE[brand.radius] ?? RADIUS_SCALE.soft;
  const c = brand.colors;
  return [
    `--brand-primary:${c.primary}`,
    `--brand-primary-contrast:${c.primaryContrast}`,
    `--brand-secondary:${c.secondary}`,
    `--brand-accent:${c.accent}`,
    `--brand-bg:${c.background}`,
    `--brand-surface:${c.surface}`,
    `--brand-fg:${c.foreground}`,
    `--brand-muted:${c.muted}`,
    `--brand-border:${c.border}`,
    `--brand-primary-soft:${withAlpha(c.primary, 0.08)}`,
    `--brand-accent-soft:${withAlpha(c.accent, 0.14)}`,
    `--brand-overlay:${withAlpha(c.secondary, 0.55)}`,
    `--font-display:${brand.fonts.display}`,
    `--font-body:${brand.fonts.body}`,
    `--brand-radius-sm:${r.sm}`,
    `--brand-radius-md:${r.md}`,
    `--brand-radius-lg:${r.lg}`,
    `--brand-radius-xl:${r.xl}`,
  ].join(';');
}


/** Mesma configuração, no formato aceito pelo atributo style do React. */
export function brandToStyle(brand: BrandConfig): Record<string, string> {
  return Object.fromEntries(
    brandToCssVariables(brand)
      .split(";")
      .map((entry) => {
        const index = entry.indexOf(":");
        return [entry.slice(0, index), entry.slice(index + 1)];
      }),
  );
}

/** #RRGGBB -> rgba(). Mantém o painel de branding aceitando apenas hex. */
export function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : clean;
  const int = Number.parseInt(full, 16);
  if (Number.isNaN(int) || full.length !== 6) return hex;
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
