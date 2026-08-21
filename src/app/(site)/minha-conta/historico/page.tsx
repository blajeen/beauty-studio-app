import type { Metadata } from 'next';
import { Sparkles } from 'lucide-react';
import { requireCustomer } from '@/lib/auth/guards';
import { getProcedureHistory } from '@/lib/data/customer';
import { db } from '@/lib/db';
import { formatDayDistance } from '@/lib/datetime';
import { Avatar, Button, Card } from '@/components/ui/primitives';
import { EmptyState } from '@/components/ui/states';
import { SmartImage } from '@/components/ui/media';
import { ProcedureDetails } from '@/components/procedure-record';

export const metadata: Metadata = { title: 'Histórico' };

export default async function HistoryPage() {
  const user = await requireCustomer();

  const [records, serviceSlugs] = await Promise.all([
    getProcedureHistory(user.customerId, 30),
    db.service.findMany({ select: { id: true, slug: true } }),
  ]);

  const slugById = new Map(serviceSlugs.map((service) => [service.id, service.slug]));

  return (
    <div className="max-w-3xl">
      <h2 className="font-display text-2xl">Sua ficha</h2>
      <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-muted">
        Tudo o que foi usado em cada atendimento fica registrado aqui: técnica, formato, cor e o que
        a profissional anotou para a próxima vez. É por isso que você não precisa explicar de novo.
      </p>

      <div className="mt-8 space-y-4">
        {records.length === 0 ? (
          <EmptyState
            icon={<Sparkles size={20} />}
            title="Sua ficha começa no primeiro atendimento"
            description="A partir dele, a profissional registra os detalhes e você acompanha tudo por aqui."
            action={<Button href="/agendar">Agendar horário</Button>}
          />
        ) : (
          records.map((record) => (
            <Card key={record.id} className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-xl leading-tight">{record.service.name}</h3>
                  <p className="mt-1 text-[12.5px] text-muted">
                    {record.performedAt.toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}{' '}
                    · {formatDayDistance(record.performedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <Avatar
                    name={record.professional.displayName}
                    src={record.professional.avatarUrl}
                    size="sm"
                  />
                  <span className="text-[13px] text-muted">{record.professional.displayName}</span>
                </div>
              </div>

              <ProcedureDetails record={record} className="mt-5" />

              {record.photos.length ? (
                <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {record.photos.map((photo) => (
                    <SmartImage
                      key={photo.id}
                      src={photo.imageUrl}
                      alt={photo.caption ?? record.service.name}
                      seed={record.service.name}
                      ratio="square"
                      className="rounded-md"
                    />
                  ))}
                </div>
              ) : null}

              {record.nextRecommendedAt ? (
                <p className="mt-5 border-t border-line pt-4 text-[12.5px] text-muted">
                  Retorno recomendado para{' '}
                  {record.nextRecommendedAt.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                  })}
                  .
                </p>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
                <Button
                  href={`/agendar?servico=${slugById.get(record.serviceId) ?? ''}&profissional=${record.professional.id}`}
                  size="sm"
                >
                  Repetir serviço
                </Button>
                <Button
                  href={`/profissionais/${record.professional.id}`}
                  variant="secondary"
                  size="sm"
                >
                  Ver portfólio
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
