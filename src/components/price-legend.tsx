import { cn } from '@/lib/utils';

/**
 * Explica os tipos de preço do catálogo (seção 31). Sem isso, "a partir de"
 * vira dúvida — e dúvida no catálogo custa agendamento.
 */
export function PriceLegend({ className }: { className?: string }) {
  const entries = [
    { term: 'Valor fechado', description: 'O preço exibido é o que você paga.' },
    {
      term: 'A partir de',
      description: 'O valor final depende do comprimento, da técnica ou da quantidade.',
    },
    { term: 'Sob orçamento', description: 'Montado caso a caso — comum em noivas e eventos.' },
    {
      term: 'Mediante avaliação',
      description: 'Definido depois de uma avaliação rápida no dia do atendimento.',
    },
  ];

  return (
    <div className={cn('rounded-lg border border-line bg-surface p-6 sm:p-8', className)}>
      <p className="eyebrow mb-5">Como ler os preços</p>
      <dl className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
        {entries.map((entry) => (
          <div key={entry.term} className="flex gap-3">
            <dt className="w-32 shrink-0 text-[13px] font-medium text-ink">{entry.term}</dt>
            <dd className="text-[13px] leading-relaxed text-muted">{entry.description}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
