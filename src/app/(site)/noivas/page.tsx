import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getBrand, getContent } from '@/lib/brand/server';
import { formatCurrency } from '@/lib/utils';
import { formatDuration } from '@/lib/datetime';
import { Avatar, Badge, Button, Card, Container, SectionHeading } from '@/components/ui/primitives';
import { SmartImage } from '@/components/ui/media';
import { Accordion } from '@/components/ui/overlay';
import { Notice } from '@/components/ui/states';
import { HelpBlock } from '@/components/whatsapp-button';

export const metadata: Metadata = {
  title: 'Noivas e eventos',
  description:
    'Produção de noiva, teste de maquiagem e cronograma para eventos. Você diz a que horas precisa estar pronta.',
};

export default async function BridalPage() {
  const [brand, content] = await Promise.all([getBrand(), getContent()]);
  if (!brand.features.events) notFound();

  const [bridalPackages, bridalServices, specialists] = await Promise.all([
    db.package.findMany({
      where: { isActive: true, slug: { startsWith: 'bridal' } },
      orderBy: { sortOrder: 'asc' },
      include: { items: { include: { service: { select: { name: true } } } } },
    }),
    db.service.findMany({
      where: { isActive: true, category: { slug: 'maquiagem' } },
      orderBy: { sortOrder: 'asc' },
    }),
    db.professional.findMany({
      where: {
        isActive: true,
        services: { some: { service: { slug: { in: ['maquiagem-noiva', 'teste-noiva'] } } } },
      },
      orderBy: { sortOrder: 'asc' },
    }),
  ]);

  const steps = [
    { title: 'Data do casamento', body: 'Você informa o dia e o local da produção.' },
    { title: 'Horário para estar pronta', body: 'O app calcula o horário de início a partir daí.' },
    { title: 'Serviços', body: 'Maquiagem, cabelo, pele, unhas e sobrancelha — o que você quiser.' },
    { title: 'Profissionais', body: 'Escolha quem faz cada parte ou deixe o app montar a equipe.' },
    { title: 'Teste', body: 'Agende o teste antes da data. O resultado fica registrado na sua ficha.' },
    { title: 'Agendamento', body: 'Cronograma confirmado, com madrinhas e convidadas no mesmo evento.' },
  ];

  const faq = [
    {
      question: 'Quando devo fazer o teste de maquiagem?',
      answer:
        'O ideal é entre 30 e 60 dias antes do casamento. No teste registramos base, tons e o que você não gosta — no dia, a produção sai igual, sem improviso.',
    },
    {
      question: 'Vocês atendem madrinhas e mãe da noiva?',
      answer:
        'Sim. Todas entram no mesmo evento, com horários encadeados para que ninguém fique esperando e todo mundo esteja pronto junto.',
    },
    {
      question: 'Como o horário de início é calculado?',
      answer:
        'A partir do horário em que você precisa estar pronta, subtraindo a duração de cada serviço e o tempo de preparo. Você vê o cronograma completo antes de confirmar.',
    },
    {
      question: 'É possível atender fora do estúdio?',
      answer:
        'Para casamentos, sim, mediante consulta. Informe o local no agendamento e a equipe confirma a disponibilidade e as condições.',
    },
  ];

  return (
    <>
      <div className="relative">
        <SmartImage
          src={content.bridal.heroImageUrl}
          alt="Produção de noiva"
          seed="Noiva"
          overlay
          className="h-[56vh] min-h-[400px] w-full"
        />
        <Container size="wide" className="absolute inset-x-0 bottom-0 pb-12">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">Noivas &amp; eventos</p>
          <h1 className="mt-4 max-w-3xl font-display text-[2.8rem] leading-[1.02] text-white sm:text-[4.4rem]">
            O dia é seu. O cronograma é com a gente.
          </h1>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="/agendar?ocasiao=1&tipo=WEDDING" size="lg">
              Montar meu cronograma
            </Button>
            <Button
              href="/agendar?servico=teste-noiva"
              size="lg"
              className="border border-white/30 bg-transparent text-white hover:bg-white/10"
            >
              Agendar teste
            </Button>
          </div>
        </Container>
      </div>

      <Container size="wide" className="py-14 sm:py-20">
        <SectionHeading
          eyebrow="Como funciona"
          title="Seis passos até estar pronta"
          description="O fluxo de noiva é diferente do agendamento comum: ele começa pelo horário em que você precisa estar pronta, não pelo horário de início."
        />
        <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title}>
              <span className="font-display text-[2.2rem] leading-none text-accent">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-3 font-display text-xl">{step.title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>

        <section className="mt-20">
          <SectionHeading eyebrow="Pacotes" title="Bridal" />
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {bridalPackages.map((pack) => (
              <Card key={pack.id} className="flex flex-col overflow-hidden lg:flex-row">
                <SmartImage
                  src={pack.imageUrl}
                  alt={pack.name}
                  seed={pack.name}
                  className="lg:w-56 lg:shrink-0"
                  ratio="landscape"
                />
                <div className="flex flex-1 flex-col p-6">
                  {pack.highlight ? (
                    <Badge tone="accent" className="mb-3 self-start">
                      Mais escolhido
                    </Badge>
                  ) : null}
                  <h3 className="font-display text-2xl">{pack.name}</h3>
                  {pack.tagline ? (
                    <p className="mt-1.5 text-[13px] text-muted">{pack.tagline}</p>
                  ) : null}
                  <ul className="mt-4 space-y-1.5 border-t border-line pt-4 text-[13.5px] text-ink/80">
                    {pack.items.map((item) => (
                      <li key={item.id}>{item.service.name}</li>
                    ))}
                  </ul>
                  <div className="mt-auto flex items-end justify-between gap-4 pt-6">
                    <div>
                      <p className="font-display text-3xl">{formatCurrency(pack.price)}</p>
                      <p className="text-[12px] text-muted">valor de referência</p>
                    </div>
                    <Button href={`/agendar?pacote=${pack.slug}&ocasiao=1`} size="sm">
                      Começar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-20">
          <SectionHeading eyebrow="Serviços" title="Maquiagem e produção" />
          <div className="mt-10 divide-y divide-line border-y border-line">
            {bridalServices.map((service) => (
              <div key={service.id} className="flex items-center justify-between gap-6 py-4">
                <div className="min-w-0">
                  <p className="text-[15px] font-medium">{service.name}</p>
                  <p className="mt-0.5 text-[12.5px] text-muted">
                    {formatDuration(service.duration)}
                    {service.shortDescription ? ` · ${service.shortDescription}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <span className="whitespace-nowrap text-[14px]">
                    {service.priceType === 'FROM' ? 'a partir de ' : ''}
                    {formatCurrency(service.price)}
                  </span>
                  <Button href={`/agendar?servico=${service.slug}`} variant="secondary" size="sm">
                    Agendar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {specialists.length ? (
          <section className="mt-20">
            <SectionHeading eyebrow="Equipe" title="Quem conduz o seu dia" />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {specialists.map((professional) => (
                <Card key={professional.id} className="flex gap-4 p-5">
                  <Avatar
                    name={professional.displayName}
                    src={professional.avatarUrl}
                    size="lg"
                    className="shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-display text-xl leading-tight">{professional.displayName}</p>
                    <p className="mt-0.5 text-[12.5px] text-muted">{professional.title}</p>
                    {professional.bio ? (
                      <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-muted">
                        {professional.bio}
                      </p>
                    ) : null}
                    <Button
                      href={`/profissionais/${professional.id}`}
                      variant="link"
                      className="mt-2 text-[13px]"
                    >
                      Ver portfólio
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        <Notice tone="accent" className="mt-16" title="Reserva de data">
          {brand.policies.depositText}
        </Notice>

        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-center font-display text-[2rem]">Perguntas de noiva</h2>
          <div className="mt-8">
            <Accordion items={faq} />
          </div>
        </div>

        <div className="mt-14">
          <HelpBlock
            title="Vamos falar sobre o seu casamento?"
            description="Conte a data e o horário da cerimônia. A equipe responde com uma proposta de cronograma."
            message="Olá! Gostaria de agendar maquiagem para o meu casamento. A data é "
          />
        </div>
      </Container>
    </>
  );
}
