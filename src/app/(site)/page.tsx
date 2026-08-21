import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Clock, MapPin, Sparkles, Star } from 'lucide-react';
import { getBrand, getContent } from '@/lib/brand/server';
import {
  getBranches,
  getCategories,
  getFeaturedServices,
  getFirstAvailableHighlight,
  getPackages,
  getPlans,
  getProfessionals,
  getPublicPortfolio,
  getPublicReviews,
} from '@/lib/data/catalog';
import { formatDuration, formatRelativeDay, formatTime } from '@/lib/datetime';
import { formatPriceShort } from '@/lib/utils';
import { Avatar, Badge, Button, Card, Container, SectionHeading } from '@/components/ui/primitives';
import { SmartImage } from '@/components/ui/media';
import { Accordion } from '@/components/ui/overlay';
import { CategoryCard, PackageCard, PlanCard, ProfessionalCard, ServiceCard } from '@/components/cards';
import { WhatsAppButton } from '@/components/whatsapp-button';

export default async function HomePage() {
  const [brand, content] = await Promise.all([getBrand(), getContent()]);

  return (
    <>
      <Hero />
      <FirstAvailable />
      <Categories />
      <HowItWorks />
      <FeaturedServices />
      <Team />
      {brand.features.portfolio ? <PortfolioStrip /> : null}
      {brand.features.packages ? <Packages /> : null}
      {brand.features.beautyClub ? <BeautyClub /> : null}
      {brand.features.events ? <Bridal /> : null}
      {brand.features.reviews ? <Reviews /> : null}
      <About />
      <Faq />
      <Locations />
      <FinalCta />
      <p className="sr-only">{content.editorial.quote}</p>
    </>
  );
}

/* ── HERO ─────────────────────────────────────────────────────────────────── */

async function Hero() {
  const content = await getContent();

  return (
    <section className="relative overflow-hidden">
      <Container size="wide" className="pt-6 sm:pt-10">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <div className="animate-rise order-2 max-w-xl lg:order-1">
            <p className="eyebrow">{content.hero.eyebrow}</p>
            <h1 className="mt-5 text-[2.9rem] leading-[1.02] sm:text-[3.8rem] lg:text-[4.4rem]">
              {content.hero.headline}
            </h1>
            <p className="mt-6 max-w-lg text-[15.5px] leading-relaxed text-muted sm:text-base">
              {content.hero.subheadline}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button href="/agendar" size="lg" className="sm:min-w-52">
                {content.hero.ctaPrimary}
                <ArrowRight size={16} />
              </Button>
              <WhatsAppButton
                variant="inline"
                label={content.hero.ctaSecondary}
                className="h-[52px] px-7"
              />
            </div>
          </div>

          <div className="animate-fade order-1 lg:order-2">
            <SmartImage
              src={content.hero.imageUrl}
              alt="Atendimento no estúdio"
              seed="Beauty"
              ratio="landscape"
              priority
              className="rounded-lg lg:aspect-[5/4]"
            />
          </div>
        </div>

        <ul className="mt-14 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-line pt-10 sm:grid-cols-4 lg:mt-20">
          {content.highlights.map((item) => (
            <li key={item.label}>
              <p className="font-display text-[2.2rem] leading-none">{item.value}</p>
              <p className="mt-2 text-[12.5px] text-muted">{item.label}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ── PRIMEIRO DISPONÍVEL ──────────────────────────────────────────────────── */

async function FirstAvailable() {
  const highlight = await getFirstAvailableHighlight();
  if (!highlight) return null;

  const { service, professional, branch, start } = highlight;

  return (
    <Container size="wide" className="mt-16 sm:mt-24">
      <Card className="flex flex-col gap-6 overflow-hidden p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex items-start gap-5">
          <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-ink sm:flex">
            <Sparkles size={19} strokeWidth={1.6} />
          </span>
          <div>
            <p className="eyebrow">Primeiro horário disponível</p>
            <p className="mt-2.5 font-display text-[2rem] leading-none">
              {formatRelativeDay(start)} — {formatTime(start)}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted">
              {professional ? (
                <span className="flex items-center gap-2">
                  <Avatar name={professional.displayName} src={professional.avatarUrl} size="xs" />
                  com {professional.displayName}
                </span>
              ) : null}
              <span className="flex items-center gap-1.5">
                <Clock size={12} />
                {service.name} · {formatDuration(service.duration)}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={12} />
                {branch.name}
              </span>
            </div>
          </div>
        </div>

        <Button
          href={`/agendar?servico=${service.slug}${professional ? `&profissional=${professional.id}` : ''}`}
          size="lg"
          className="shrink-0"
        >
          Reservar este horário
        </Button>
      </Card>
    </Container>
  );
}

/* ── CATEGORIAS ───────────────────────────────────────────────────────────── */

async function Categories() {
  const [categories, brand] = await Promise.all([getCategories(), getBrand()]);
  const promoCount = Number(brand.features.packages) + Number(brand.features.events);

  return (
    <Container size="wide" className="mt-24 sm:mt-32">
      <SectionHeading
        eyebrow="O que você quer fazer hoje"
        title="Escolha por onde começar"
        description="Cada especialidade tem a sua profissional, o seu ritmo e a sua ficha técnica — mas tudo acontece no mesmo lugar."
        action={
          <Button href="/servicos" variant="link">
            Ver catálogo completo
            <ArrowUpRight size={15} />
          </Button>
        }
      />

      {/*
        Bento de 4 colunas: a primeira categoria ocupa 2x2 e a última se alarga
        para fechar a linha final junto dos dois atalhos — sem vão no canto.
      */}
      <div className="stagger mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5">
        {categories.map((category, index) => (
          <CategoryCard
            key={category.id}
            href={`/servicos/${category.slug}`}
            title={category.name}
            tagline={category.tagline}
            imageUrl={category.coverImage}
            count={category._count.services}
            large={index === 0}
            wide={index === categories.length - 1 && promoCount === 2}
          />
        ))}

        {brand.features.packages ? (
          <Link
            href="/pacotes"
            className="group flex flex-col justify-between rounded-lg bg-accent-soft p-5 transition-colors hover:bg-accent/25"
          >
            <span className="eyebrow">Combinados</span>
            <span>
              <span className="block font-display text-2xl">Pacotes</span>
              <span className="mt-1.5 block text-[12.5px] leading-relaxed text-ink/65">
                Vários serviços em uma tarde, com preço fechado.
              </span>
              <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-ink/70">
                Ver pacotes
                <ArrowUpRight
                  size={13}
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </span>
            </span>
          </Link>
        ) : null}

        {brand.features.events ? (
          <Link
            href="/noivas"
            className="group flex flex-col justify-between rounded-lg bg-secondary p-5 text-white transition-opacity hover:opacity-95"
          >
            <span className="text-[11px] uppercase tracking-[0.18em] text-white/50">Ocasiões</span>
            <span>
              <span className="block font-display text-2xl">Noivas &amp; eventos</span>
              <span className="mt-1.5 block text-[12.5px] leading-relaxed text-white/60">
                Diga a que horas precisa estar pronta. Nós montamos o cronograma.
              </span>
              <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-white/80">
                Montar cronograma
                <ArrowUpRight
                  size={13}
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </span>
            </span>
          </Link>
        ) : null}
      </div>
    </Container>
  );
}

/* ── COMO FUNCIONA ────────────────────────────────────────────────────────── */

function HowItWorks() {
  const steps = [
    {
      title: 'Escolha o que quer fazer',
      body: 'Um serviço ou vários. Se preferir, comece pela profissional — ou peça o primeiro horário livre.',
    },
    {
      title: 'Veja o roteiro montado',
      body: 'O app encaixa os atendimentos em sequência, mesmo com profissionais diferentes, e mostra o horário de cada um.',
    },
    {
      title: 'Confirme e pronto',
      body: 'Você recebe o lembrete, remarca em dois toques e o histórico fica guardado para a próxima visita.',
    },
  ];

  return (
    <Container size="wide" className="mt-24 sm:mt-32">
      <div className="grid gap-10 border-y border-line py-14 sm:grid-cols-3 sm:gap-8">
        {steps.map((step, index) => (
          <div key={step.title}>
            <span className="font-display text-[2.4rem] leading-none text-accent">
              {String(index + 1).padStart(2, '0')}
            </span>
            <h3 className="mt-4 font-display text-xl">{step.title}</h3>
            <p className="mt-2 max-w-xs text-[13.5px] leading-relaxed text-muted">{step.body}</p>
          </div>
        ))}
      </div>
    </Container>
  );
}

/* ── SERVIÇOS EM DESTAQUE ─────────────────────────────────────────────────── */

async function FeaturedServices() {
  // A vitrine só mostra o que tem fotografia própria — cartão sem foto vira
  // buraco visual em uma seção que existe para vender pelo olhar.
  const services = (await getFeaturedServices(12)).filter((service) => service.imageUrl).slice(0, 6);

  return (
    <Container size="wide" className="mt-24 sm:mt-32">
      <SectionHeading
        eyebrow="Mais procurados"
        title="Os favoritos da casa"
        action={
          <Button href="/servicos" variant="link">
            Todos os serviços
            <ArrowUpRight size={15} />
          </Button>
        }
      />
      <div className="stagger mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            href={`/agendar?servico=${service.slug}`}
            action={
              <span className="text-[12px] uppercase tracking-[0.12em] text-ink/60">Agendar</span>
            }
          />
        ))}
      </div>
    </Container>
  );
}

/* ── EQUIPE ───────────────────────────────────────────────────────────────── */

async function Team() {
  const professionals = await getProfessionals();

  return (
    <Container size="wide" className="mt-24 sm:mt-32">
      <SectionHeading
        eyebrow="Quem cuida de você"
        title="A equipe"
        description="Escolha pela especialidade, pelo estilo do trabalho ou simplesmente por quem já conhece as suas preferências."
        action={
          <Button href="/profissionais" variant="link">
            Conhecer todas
            <ArrowUpRight size={15} />
          </Button>
        }
      />
      <div className="scrollbar-none -mx-5 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {professionals.slice(0, 8).map((professional) => (
          <div
            key={professional.id}
            className="w-[68vw] shrink-0 snap-start sm:w-auto sm:shrink"
          >
            <ProfessionalCard
              professional={professional}
              href={`/profissionais/${professional.id}`}
            />
          </div>
        ))}
      </div>
    </Container>
  );
}

/* ── PORTFÓLIO ────────────────────────────────────────────────────────────── */

async function PortfolioStrip() {
  const items = await getPublicPortfolio(8);
  if (items.length === 0) return null;

  return (
    <section className="mt-24 bg-surface py-20 sm:mt-32">
      <Container size="wide">
        <SectionHeading
          eyebrow="Portfólio"
          title="Veja antes de escolher"
          description="Trabalhos reais das nossas profissionais. Salve o que gostar e envie como referência na hora de agendar."
          action={
            <Button href="/portfolio" variant="link">
              Abrir galeria
              <ArrowUpRight size={15} />
            </Button>
          }
        />
        <div className="stagger mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {items.map((item) => (
            <Link key={item.id} href="/portfolio" className="group block">
              <SmartImage
                src={item.imageUrl}
                alt={item.title}
                seed={item.title}
                ratio="square"
                className="rounded-md"
                imgClassName="group-hover:scale-[1.05]"
              />
              <p className="mt-2.5 truncate text-[12.5px] text-ink">{item.title}</p>
              <p className="truncate text-[11.5px] text-muted">
                {item.professional?.displayName}
              </p>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ── PACOTES ──────────────────────────────────────────────────────────────── */

async function Packages() {
  const packages = await getPackages();
  const combos = packages.filter((item) => item.isCombo).slice(0, 3);
  if (combos.length === 0) return null;

  return (
    <Container size="wide" className="mt-24 sm:mt-32">
      <SectionHeading
        eyebrow="Combinados"
        title="Resolva tudo em uma visita"
        description="Serviços que fazem sentido juntos, com preço fechado e sequência montada pelo app."
        action={
          <Button href="/pacotes" variant="link">
            Ver todos os pacotes
            <ArrowUpRight size={15} />
          </Button>
        }
      />
      <div className="stagger mt-10 grid gap-5 lg:grid-cols-3">
        {combos.map((pack) => (
          <PackageCard
            key={pack.id}
            pack={pack}
            action={
              <Button href={`/agendar?pacote=${pack.slug}`} size="sm">
                Agendar
              </Button>
            }
          />
        ))}
      </div>
    </Container>
  );
}

/* ── BEAUTY CLUB ──────────────────────────────────────────────────────────── */

async function BeautyClub() {
  const plans = await getPlans();
  if (plans.length === 0) return null;

  return (
    <section className="mt-24 bg-secondary py-20 text-white sm:mt-32 sm:py-28">
      <Container size="wide">
        <div className="max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Assinatura</p>
          <h2 className="mt-4 font-display text-[2.4rem] leading-[1.05] sm:text-[3.2rem]">
            Beauty Club
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/65">
            Para quem vem sempre. A rotina do mês fica reservada, com prioridade na agenda e um
            valor melhor do que avulso.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              action={
                <Button
                  href="/beauty-club"
                  variant={plan.highlight ? 'primary' : 'secondary'}
                  fullWidth
                >
                  Conhecer o plano
                </Button>
              }
            />
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ── NOIVAS & EVENTOS ─────────────────────────────────────────────────────── */

async function Bridal() {
  const content = await getContent();

  return (
    <Container size="wide" className="mt-24 sm:mt-32">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <SmartImage
          src={content.bridal.sectionImageUrl}
          alt="Produção de noiva"
          seed="Noiva"
          ratio="landscape"
          className="rounded-lg"
        />
        <div>
          <p className="eyebrow">Noivas &amp; eventos</p>
          <h2 className="mt-4 font-display text-[2.4rem] leading-[1.05] sm:text-[3rem]">
            Você diz a que horas precisa estar pronta
          </h2>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted">
            O app soma a duração de cada serviço, acrescenta o preparo e calcula o horário ideal de
            início. Para casamentos, organiza também o teste, as madrinhas e o cronograma do dia.
          </p>

          <div className="mt-8 rounded-lg border border-line bg-surface p-5">
            <p className="eyebrow mb-4">Exemplo de cronograma</p>
            <ul className="space-y-0">
              {[
                { time: '14:15', label: 'Chegada e preparo', muted: true },
                { time: '14:30', label: 'Maquiagem — 90 min' },
                { time: '16:00', label: 'Cabelo — 90 min' },
                { time: '17:30', label: 'Sobrancelha — 30 min' },
                { time: '18:00', label: 'Pronta', highlight: true },
              ].map((step) => (
                <li
                  key={step.time}
                  className="flex items-center gap-4 border-b border-line/70 py-2.5 last:border-0"
                >
                  <span className="w-12 font-display text-lg tabular-nums text-ink/80">
                    {step.time}
                  </span>
                  <span
                    className={
                      step.highlight
                        ? 'text-[14px] font-medium text-ink'
                        : step.muted
                          ? 'text-[13.5px] text-muted'
                          : 'text-[13.5px] text-ink/80'
                    }
                  >
                    {step.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="/noivas" size="lg">
              Montar meu cronograma
            </Button>
            <Button href="/agendar?ocasiao=1" variant="secondary" size="lg">
              Tenho um evento
            </Button>
          </div>
        </div>
      </div>
    </Container>
  );
}

/* ── AVALIAÇÕES ───────────────────────────────────────────────────────────── */

async function Reviews() {
  const reviews = await getPublicReviews(4);
  if (reviews.length === 0) return null;

  return (
    <Container size="wide" className="mt-24 sm:mt-32">
      <SectionHeading eyebrow="Quem já veio" title="O que dizem sobre o estúdio" />
      <div className="stagger mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {reviews.map((review) => (
          <Card key={review.id} className="flex flex-col p-6">
            <div className="flex gap-0.5 text-accent" aria-label={`${review.rating} de 5`}>
              {Array.from({ length: review.rating }).map((_, index) => (
                <Star key={index} size={13} fill="currentColor" strokeWidth={0} />
              ))}
            </div>
            <p className="mt-4 flex-1 text-[14px] leading-relaxed text-ink/85">
              “{review.comment}”
            </p>
            <div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
              <Avatar
                name={review.professional?.displayName ?? review.customer.name}
                src={review.professional?.avatarUrl}
                size="sm"
              />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium">{review.customer.name}</p>
                {review.professional ? (
                  <p className="truncate text-[12px] text-muted">
                    atendida por {review.professional.displayName}
                  </p>
                ) : null}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Container>
  );
}

/* ── SOBRE ────────────────────────────────────────────────────────────────── */

async function About() {
  const content = await getContent();

  return (
    <Container size="wide" className="mt-24 sm:mt-32">
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <p className="eyebrow">{content.about.eyebrow}</p>
          <h2 className="mt-4 font-display text-[2.4rem] leading-[1.05] sm:text-[3rem]">
            {content.about.title}
          </h2>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-muted">
            {content.about.body}
          </p>
          <p className="mt-6 font-display text-xl text-ink/70">— {content.about.signature}</p>
          <Button href="/sobre" variant="link" className="mt-6">
            Conhecer o estúdio
            <ArrowUpRight size={15} />
          </Button>
        </div>
        <SmartImage
          src={content.about.imageUrl}
          alt={content.about.title}
          seed={content.about.title}
          ratio="landscape"
          className="rounded-lg"
        />
      </div>

      <blockquote className="mt-20 border-y border-line py-14 text-center">
        <p className="mx-auto max-w-3xl font-display text-[1.8rem] leading-snug sm:text-[2.4rem]">
          “{content.editorial.quote}”
        </p>
        <footer className="eyebrow mt-6">{content.editorial.author}</footer>
      </blockquote>
    </Container>
  );
}

/* ── FAQ ──────────────────────────────────────────────────────────────────── */

async function Faq() {
  const content = await getContent();

  return (
    <Container size="narrow" className="mt-24 sm:mt-32">
      <SectionHeading eyebrow="Dúvidas" title="Perguntas frequentes" align="center" />
      <div className="mt-10">
        <Accordion items={content.faq} />
      </div>
    </Container>
  );
}

/* ── UNIDADES ─────────────────────────────────────────────────────────────── */

async function Locations() {
  const [branches, brand] = await Promise.all([getBranches(), getBrand()]);
  if (!brand.features.multiBranch && branches.length <= 1) return null;

  return (
    <Container size="wide" className="mt-24 sm:mt-32">
      <SectionHeading
        eyebrow="Onde nos encontrar"
        title={branches.length > 1 ? 'Duas unidades, a mesma ficha' : 'Nosso endereço'}
        description={
          branches.length > 1
            ? 'Seu histórico, seus pacotes e suas preferências acompanham você em qualquer uma delas.'
            : undefined
        }
      />
      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {branches.map((branch) => (
          <Card key={branch.id} className="overflow-hidden">
            <SmartImage src={branch.imageUrl} alt={branch.name} seed={branch.name} ratio="wide" />
            <div className="p-6">
              <h3 className="font-display text-2xl">{branch.name}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
                {branch.address}
                <br />
                {branch.district ? `${branch.district} · ` : ''}
                {branch.city}
                {branch.state ? `/${branch.state}` : ''}
              </p>
              {branch.notes ? (
                <p className="mt-3 text-[12.5px] text-muted">{branch.notes}</p>
              ) : null}
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge tone="outline">Ter a sex · 09:00–20:00</Badge>
                <Badge tone="outline">Sáb · 09:00–17:00</Badge>
              </div>
              <Button href={`/agendar?unidade=${branch.slug}`} variant="secondary" className="mt-6">
                Agendar nesta unidade
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </Container>
  );
}

/* ── CTA FINAL ────────────────────────────────────────────────────────────── */

async function FinalCta() {
  const brand = await getBrand();

  return (
    <Container size="wide" className="mt-24 sm:mt-32">
      <div className="rounded-lg bg-primary px-8 py-16 text-center text-primary-contrast sm:px-16 sm:py-24">
        <p className="text-[11px] uppercase tracking-[0.18em] opacity-50">{brand.tagline}</p>
        <h2 className="mx-auto mt-5 max-w-2xl font-display text-[2.4rem] leading-[1.05] sm:text-[3.4rem]">
          Sua próxima visita começa aqui
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed opacity-70">
          Escolha o serviço, veja quem está disponível e reserve em menos de um minuto.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            href="/agendar"
            size="lg"
            className="bg-primary-contrast text-primary hover:opacity-90"
          >
            Agendar horário
          </Button>
          <Button
            href="/servicos"
            size="lg"
            className="border border-white/25 bg-transparent text-primary-contrast hover:bg-white/10"
          >
            Ver serviços
          </Button>
        </div>
      </div>
    </Container>
  );
}
