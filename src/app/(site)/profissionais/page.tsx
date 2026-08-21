import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { Container } from '@/components/ui/primitives';
import { ProfessionalCard } from '@/components/cards';
import { HelpBlock } from '@/components/whatsapp-button';

export const metadata: Metadata = {
  title: 'Profissionais',
  description: 'Conheça a equipe do estúdio, as especialidades de cada uma e o portfólio de trabalhos.',
};

export default async function ProfessionalsPage() {
  const professionals = await db.professional.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      branches: { include: { branch: { select: { name: true } } } },
      services: { select: { serviceId: true } },
    },
  });

  return (
    <Container size="wide" className="py-12 sm:py-16">
      <div className="max-w-2xl">
        <p className="eyebrow">A equipe</p>
        <h1 className="mt-4 font-display text-[2.8rem] leading-[1.04] sm:text-[3.6rem]">
          Escolha quem cuida de você
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          Cada profissional tem um jeito de trabalhar. Veja o portfólio, entenda o estilo e escolha
          com quem você quer marcar — ou deixe o app sugerir quem está disponível primeiro.
        </p>
      </div>

      <div className="stagger mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {professionals.map((professional) => (
          <ProfessionalCard
            key={professional.id}
            professional={professional}
            href={`/profissionais/${professional.id}`}
          />
        ))}
      </div>

      <div className="mt-16">
        <HelpBlock
          title="Não sabe com quem marcar?"
          description="Conte o que você quer fazer e a equipe indica a profissional certa."
          message="Olá! Gostaria de uma indicação de profissional para o meu atendimento."
        />
      </div>
    </Container>
  );
}
