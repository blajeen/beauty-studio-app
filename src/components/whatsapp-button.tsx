'use client';

import { MessageCircle } from 'lucide-react';
import { useBrand } from '@/components/brand-provider';
import { whatsappLink, cn } from '@/lib/utils';

/**
 * WhatsApp contextualizado (seção 50). A mensagem já vai escrita com o assunto
 * da tela em que a cliente estava — o atendimento começa no meio, não do zero.
 */
export function WhatsAppButton({
  message,
  variant = 'floating',
  label = 'Falar com a equipe',
  className,
}: {
  message?: string;
  variant?: 'floating' | 'inline' | 'ghost';
  label?: string;
  className?: string;
}) {
  const brand = useBrand();
  const href = whatsappLink(
    brand.contact.whatsapp,
    message ?? `Olá! Vim pelo app do ${brand.name} e gostaria de tirar uma dúvida.`,
  );

  if (variant === 'floating') {
    /*
     * Só no desktop. No celular a barra inferior já ocupa esse canto e o botão
     * flutuante acabava cobrindo CTAs — o acesso ao WhatsApp fica no menu, no
     * hero e no rodapé, que é onde a cliente procura.
     */
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className={cn(
          'fixed bottom-8 right-8 z-40 hidden h-12 w-12 items-center justify-center rounded-full',
          'bg-secondary text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-transform',
          'hover:scale-105 active:scale-95 lg:flex',
          className,
        )}
      >
        <MessageCircle size={20} strokeWidth={1.7} />
      </a>
    );
  }

  if (variant === 'ghost') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'inline-flex items-center gap-2 text-[13px] text-ink/70 underline underline-offset-4 decoration-line transition-colors hover:text-ink',
          className,
        )}
      >
        <MessageCircle size={15} />
        {label}
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-md border border-line bg-surface px-5',
        'text-sm font-medium text-ink transition-colors hover:bg-primary-soft',
        className,
      )}
    >
      <MessageCircle size={16} strokeWidth={1.7} />
      {label}
    </a>
  );
}

/** Bloco de ajuda usado no fim das telas de catálogo e agendamento. */
export function HelpBlock({ message, title, description }: { message?: string; title?: string; description?: string }) {
  return (
    <div className="surface-card flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-display text-xl">{title ?? 'Precisa de ajuda?'}</p>
        <p className="mt-1 text-[13.5px] text-muted">
          {description ?? 'A equipe responde no WhatsApp e ajuda a montar o seu horário.'}
        </p>
      </div>
      <WhatsAppButton variant="inline" message={message} />
    </div>
  );
}
