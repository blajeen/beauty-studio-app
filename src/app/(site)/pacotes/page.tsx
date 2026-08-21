import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBrand } from '@/lib/brand/server';
import { getPackages } from '@/lib/data/catalog';
import { formatDuration } from '@/lib/datetime';
import { formatCurrency } from '@/lib/utils';
import { Button, Card, Container, SectionHeading } from '@/components/ui/primitives';
import { PackageCard } from '@/components/cards';
import { Notice } from '@/components/ui/states';
import { HelpBlock } from '@/components/whatsapp-button';

export const metadata: Metadata = {
  title: 'Pacotes e combos',
  description: 'Serviços combinados com preço fechado e pacotes de sessões para a sua manutenção.',
};

export default async function PackagesPage() {
  const brand = await getBrand();
  if (!brand.features.packages) notFound();

  const packages = await getPackages();
  const combos = packages.filter((item) => item.isCombo);
  const sessionPacks = packages.filter((item) => !item.isCombo);

  return (
    <Container size="wide" className="py-12 sm:py-16">
      <div className="max-w-2xl">
        <p className="eyebrow">Combinados</p>
        <h1 className="mt-4 font-display text-[2.8rem] leading-[1.04] sm:text-[3.6rem]">
          Pacotes e combos
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          Duas formas de economizar tempo: combos que resolvem tudo em uma visita e pacotes de
          sessões para quem tem manutenção fixa.
        </p>
      </div>

      <section className="mt-14">
        <SectionHeading
          eyebrow="Em uma visita"
          title="Combos"
          description="Serviços que fazem sentido juntos. O app monta a sequência e encaixa as profissionais."
        />
        <div className="stagger mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
      </section>

      <section className="mt-20">
        <SectionHeading
          eyebrow="Para a manutenção"
          title="Pacotes de sessões"
          description="Você compra um número de sessões e usa quando quiser, dentro da validade. O app controla o saldo."
        />
        <div className="stagger mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sessionPacks.map((pack) => {
            const perSession = Math.round(pack.price / Math.max(pack.sessions, 1));
            return (
              <Card key={pack.id} className="flex flex-col p-6">
                <p className="eyebrow">{pack.sessions} sessões</p>
                <h3 className="mt-3 font-display text-2xl leading-tight">{pack.name}</h3>
                {pack.tagline ? (
                  <p className="mt-1.5 text-[13px] text-muted">{pack.tagline}</p>
                ) : null}
                {pack.description ? (
                  <p className="mt-3 text-[13.5px] leading-relaxed text-muted">{pack.description}</p>
                ) : null}
                <div className="mt-6 border-t border-line pt-5">
                  <p className="font-display text-3xl">{formatCurrency(pack.price)}</p>
                  <p className="mt-1 text-[12.5px] text-muted">
                    {formatCurrency(perSession)} por sessão · validade de {pack.validityDays} dias
                  </p>
                </div>
                <Button
                  href={`/agendar?pacote=${pack.slug}`}
                  variant="secondary"
                  className="mt-6"
                  fullWidth
                >
                  Quero este pacote
                </Button>
              </Card>
            );
          })}
        </div>
      </section>

      <Notice tone="neutral" className="mt-12" title="Como funciona a utilização">
        Ao contratar, o saldo aparece na sua conta. A cada atendimento o app desconta uma sessão e
        mostra quantas restam e até quando podem ser usadas. O pagamento é feito no estúdio.
      </Notice>

      <div className="mt-8">
        <HelpBlock
          title="Quer um pacote sob medida?"
          description="A equipe monta uma combinação com os serviços que você já faz."
          message="Olá! Gostaria de montar um pacote personalizado."
        />
      </div>
    </Container>
  );
}
