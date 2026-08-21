import { RECORD_FIELD_LABEL } from '@/lib/constants';
import { cn } from '@/lib/utils';

export type ProcedureFields = Record<string, unknown>;

const ORDER = [
  'technique',
  'shape',
  'lengthSpec',
  'curvature',
  'effect',
  'volume',
  'color',
  'style',
  'decoration',
  'product',
  'materials',
];

/**
 * Leitura da ficha técnica. Mostra apenas os campos preenchidos — a mesma
 * ficha serve para unhas, sobrancelhas, cílios, maquiagem e estética, sem
 * transformar a tela num formulário genérico.
 */
export function ProcedureDetails({
  record,
  className,
  columns = 2,
}: {
  record: ProcedureFields;
  className?: string;
  columns?: 1 | 2;
}) {
  const entries = ORDER.filter((key) => {
    const value = record[key];
    return typeof value === 'string' && value.trim().length > 0;
  }).map((key) => [key, String(record[key])] as const);

  const observations =
    typeof record.observations === 'string' && record.observations.trim()
      ? record.observations
      : null;

  if (entries.length === 0 && !observations) {
    return (
      <p className={cn('text-[13px] text-muted', className)}>
        Sem detalhes técnicos registrados neste atendimento.
      </p>
    );
  }

  return (
    <div className={className}>
      {entries.length ? (
        <dl className={cn('grid gap-x-8 gap-y-2.5', columns === 2 && 'sm:grid-cols-2')}>
          {entries.map(([key, value]) => (
            <div key={key} className="flex justify-between gap-4 border-b border-line/60 pb-2">
              <dt className="text-[12.5px] text-muted">{RECORD_FIELD_LABEL[key] ?? key}</dt>
              <dd className="text-right text-[13px] font-medium text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {observations ? (
        <div className={cn(entries.length && 'mt-4')}>
          <p className="text-[12.5px] text-muted">{RECORD_FIELD_LABEL.observations}</p>
          <p className="mt-1 text-[13.5px] leading-relaxed text-ink/85">{observations}</p>
        </div>
      ) : null}
    </div>
  );
}
