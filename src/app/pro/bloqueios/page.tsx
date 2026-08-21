import type { Metadata } from 'next';
import { requireProfessional } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { WEEKDAYS } from '@/lib/constants';
import { BlocksManager } from './blocks-manager';
import { Card } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Bloqueios' };
export const dynamic = 'force-dynamic';

export default async function ProBlocksPage() {
  const user = await requireProfessional();

  const [blocks, hours] = await Promise.all([
    db.blockedSlot.findMany({
      where: { professionalId: user.professionalId, endAt: { gte: new Date() } },
      orderBy: { startAt: 'asc' },
    }),
    db.professionalHours.findMany({
      where: { professionalId: user.professionalId },
      orderBy: { weekday: 'asc' },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8">
        <p className="eyebrow">Sua disponibilidade</p>
        <h1 className="mt-3 font-display text-[2.4rem] leading-none">Bloqueios</h1>
        <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-muted">
          Bloqueie períodos em que você não pode atender. O horário some da agenda pública na hora —
          nenhuma cliente consegue reservar depois disso.
        </p>
      </header>

      <BlocksManager
        blocks={blocks.map((block) => ({
          id: block.id,
          startAt: block.startAt.toISOString(),
          endAt: block.endAt.toISOString(),
          reason: block.reason,
          type: block.type,
        }))}
      />

      <Card className="mt-8 p-6">
        <p className="eyebrow mb-4">Sua escala fixa</p>
        <dl className="divide-y divide-line border-y border-line">
          {hours.map((shift) => (
            <div key={shift.id} className="flex justify-between gap-6 py-2.5 text-[13.5px]">
              <dt className="text-muted">{WEEKDAYS[shift.weekday]}</dt>
              <dd className={shift.isOff ? 'text-muted' : 'font-medium'}>
                {shift.isOff
                  ? 'Folga'
                  : `${shift.startTime} – ${shift.endTime}${
                      shift.breakStart ? ` · pausa ${shift.breakStart}–${shift.breakEnd}` : ''
                    }`}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-[12.5px] leading-relaxed text-muted">
          Para alterar a escala fixa, fale com a gestão — ela vale para toda a agenda e afeta o
          cálculo de ocupação do estúdio.
        </p>
      </Card>
    </div>
  );
}
