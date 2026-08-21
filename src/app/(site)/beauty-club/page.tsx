import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBrand } from '@/lib/brand/server';
import { getPlans } from '@/lib/data/catalog';
import { Button, Container } from '@/components/ui/primitives';
import { PlanCard } from '@/components/cards';
import { Accordion } from '@/components/ui/overlay';
import { HelpBlock } from '@/components/whatsapp-button';

export const metadata: Metadata = {
  title: 'Beauty Club',
  description: 'Assinatura mensal do estúdio: sua rotina de beleza reservada, com prioridade na agenda.',
};

export default async function BeautyClubPage() {
  const brand = await getBrand();
  if (!brand.features.beautyClub) notFound();

  const plans = await getPlans();

  const faq = [
    {
      question: 'Como uso os serviços do meu plano?',
      answer:
        'Você agenda normalmente pelo app. Quando o serviço faz parte do seu plano, ele aparece como incluído e o saldo do ciclo é descontado automaticamente.',
    },
    {
      question: 'O que acontece se eu não usar tudo no mês?',
      answer:
        'O ciclo é mensal e os serviços não usados não acumulam. Por isso os planos foram desenhados a partir do que as clientes realmente fazem por mês.',
    },
    {
      question: 'Posso pausar ou cancelar?',
      answer:
        'Pode, a qualquer momento, pela sua conta. O plano segue ativo até o fim do ciclo já iniciado.',
    },
    {
      question: 'Serviços extras têm desconto?',
      answer:
        'Sim, nos planos que incluem esse benefício. O desconto aparece no resumo antes de você confirmar o agendamento.',
    },
  ];

  return (
    <>
      <section className="bg-secondary py-20 text-white sm:py-28">
        <Container size="wide">
          <div className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Assinatura</p>
            <h1 className="mt-5 font-display text-[3rem] leading-[1.02] sm:text-[4.2rem]">
              Beauty Club
            </h1>
            <p className="mt-5 text-[16px] leading-relaxed text-white/65">
              Para quem já tem uma rotina. Sua manicure, sua sobrancelha e o que mais fizer parte do
              seu mês ficam reservados — com prioridade na agenda e um valor melhor do que avulso.
            </p>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                action={
                  <Button
                    href={`/minha-conta/beauty-club?plano=${plan.slug}`}
                    variant={plan.highlight ? 'primary' : 'secondary'}
                    fullWidth
                  >
                    Assinar {plan.name.replace('Beauty Club', '').trim() || 'plano'}
                  </Button>
                }
              />
            ))}
          </div>
        </Container>
      </section>

      <Container size="wide" className="py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-3">
          {[
            {
              title: 'Prioridade na agenda',
              body: 'Assinantes enxergam horários liberados antes e têm preferência em encaixes de última hora.',
            },
            {
              title: 'Sem surpresa no valor',
              body: 'Você sabe quanto vai gastar no mês. O plano cobre o que estava combinado, sem taxa extra.',
            },
            {
              title: 'Sua ficha sempre atualizada',
              body: 'Como a frequência é constante, a profissional acompanha a evolução e ajusta o intervalo ideal.',
            },
          ].map((item) => (
            <div key={item.title}>
              <h2 className="font-display text-[1.6rem]">{item.title}</h2>
              <p className="mt-2.5 text-[14px] leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-20 max-w-3xl">
          <h2 className="text-center font-display text-[2rem]">Dúvidas sobre o clube</h2>
          <div className="mt-8">
            <Accordion items={faq} />
          </div>
        </div>

        <div className="mt-14">
          <HelpBlock
            title="Quer ajuda para escolher o plano?"
            description="A equipe olha o seu histórico e indica o que faz mais sentido."
            message="Olá! Gostaria de entender qual plano do Beauty Club combina com a minha rotina."
          />
        </div>
      </Container>
    </>
  );
}
