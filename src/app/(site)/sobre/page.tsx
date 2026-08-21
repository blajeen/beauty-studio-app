import type { Metadata } from 'next';
import { getBrand, getContent } from '@/lib/brand/server';
import { getBranches } from '@/lib/data/catalog';
import { WEEKDAYS } from '@/lib/constants';
import { Badge, Button, Card, Container, SectionHeading } from '@/components/ui/primitives';
import { SmartImage } from '@/components/ui/media';
import { Accordion } from '@/components/ui/overlay';
import { HelpBlock } from '@/components/whatsapp-button';

export const metadata: Metadata = { title: 'O estúdio' };

export default async function AboutPage() {
  const [brand, content, branches] = await Promise.all([getBrand(), getContent(), getBranches()]);

  return (
    <Container size="wide" className="py-12 sm:py-16">
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <p className="eyebrow">{content.about.eyebrow}</p>
          <h1 className="mt-4 font-display text-[2.8rem] leading-[1.04] sm:text-[3.6rem]">
            {content.about.title}
          </h1>
          <p className="mt-5 text-[16px] leading-relaxed text-muted">{content.about.body}</p>
          <p className="mt-6 font-display text-xl text-ink/70">— {content.about.signature}</p>
        </div>
        <SmartImage
          src={content.about.imageUrl}
          alt={content.about.title}
          seed={brand.name}
          ratio="landscape"
          className="rounded-lg"
        />
      </div>

      <section className="mt-20">
        <SectionHeading eyebrow="Onde nos encontrar" title="Unidades e horários" />
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
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
                  {branch.zip ? ` · ${branch.zip}` : ''}
                </p>
                {branch.phone ? (
                  <p className="mt-1.5 text-[13px] text-muted">{branch.phone}</p>
                ) : null}

                <dl className="mt-5 divide-y divide-line border-y border-line">
                  {branch.businessHours.map((hours) => (
                    <div key={hours.id} className="flex justify-between py-2 text-[13px]">
                      <dt className="text-muted">{WEEKDAYS[hours.weekday]}</dt>
                      <dd className={hours.isClosed ? 'text-muted' : 'font-medium text-ink'}>
                        {hours.isClosed ? 'Fechado' : `${hours.openTime} – ${hours.closeTime}`}
                      </dd>
                    </div>
                  ))}
                </dl>

                {branch.notes ? (
                  <p className="mt-4 text-[12.5px] text-muted">{branch.notes}</p>
                ) : null}

                <Button href={`/agendar?unidade=${branch.slug}`} variant="secondary" className="mt-5">
                  Agendar aqui
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-20">
        <SectionHeading eyebrow="Combinados" title="Nossas políticas" />
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {[
            { title: 'Cancelamento', body: brand.policies.cancellationText },
            { title: 'Atrasos', body: brand.policies.lateText },
            { title: 'Sinal e reservas', body: brand.policies.depositText },
          ].map((policy) => (
            <Card key={policy.title} className="p-6">
              <p className="eyebrow mb-3">{policy.title}</p>
              <p className="text-[13.5px] leading-relaxed text-ink/80">{policy.body}</p>
            </Card>
          ))}
        </div>
        <Card className="mt-5 p-6">
          <p className="eyebrow mb-3">Fotos e privacidade</p>
          <p className="max-w-3xl text-[13.5px] leading-relaxed text-ink/80">
            As fotos dos seus atendimentos ficam guardadas na sua ficha técnica e servem para a
            profissional repetir o resultado. Elas só aparecem no portfólio público com a sua
            autorização — e você pode retirar essa autorização quando quiser, pela sua conta.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="outline">Somente o estúdio</Badge>
            <Badge tone="outline">Visível para a cliente</Badge>
            <Badge tone="accent">Portfólio público — com autorização</Badge>
          </div>
        </Card>
      </section>

      <section id="faq" className="mx-auto mt-20 max-w-3xl scroll-mt-28">
        <SectionHeading eyebrow="Dúvidas" title="Perguntas frequentes" align="center" />
        <div className="mt-10">
          <Accordion items={content.faq} />
        </div>
      </section>

      <div className="mt-16">
        <HelpBlock />
      </div>
    </Container>
  );
}
