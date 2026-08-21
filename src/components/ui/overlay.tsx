'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── SHEET / MODAL ──────────────────────────────────────────────────────────
 * No celular sobe como bottom sheet; no desktop centraliza como diálogo.
 * É o mesmo componente — o produto é mobile-first, não mobile-adaptado.
 */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <div
        className="animate-fade absolute inset-0 bg-[var(--brand-overlay)] backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={cn(
          'animate-sheet relative z-10 flex max-h-[92vh] w-full flex-col bg-surface',
          'rounded-t-[20px] sm:rounded-lg',
          size === 'sm' && 'sm:max-w-md',
          size === 'md' && 'sm:max-w-xl',
          size === 'lg' && 'sm:max-w-3xl',
        )}
      >
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-line sm:hidden" />
        {title ? (
          <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-5">
            <div className="min-w-0">
              <h2 className="font-display text-2xl leading-tight">{title}</h2>
              {description ? <p className="mt-1 text-[13px] text-muted">{description}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-mr-2 -mt-1 rounded-md p-2 text-muted transition-colors hover:bg-primary-soft hover:text-ink"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">{children}</div>
        {footer ? (
          <div className="safe-bottom flex gap-3 border-t border-line px-6 py-4">{footer}</div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

/* ── LIGHTBOX (portfólio e inspirações) ─────────────────────────────────────── */

export function Lightbox({
  items,
  index,
  onClose,
  onNavigate,
}: {
  items: { imageUrl: string; title: string; caption?: string | null }[];
  index: number | null;
  onClose: () => void;
  onNavigate: (next: number) => void;
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (index === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') onNavigate((index + 1) % items.length);
      if (event.key === 'ArrowLeft') onNavigate((index - 1 + items.length) % items.length);
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [index, items.length, onClose, onNavigate]);

  if (!mounted || index === null || !items[index]) return null;
  const item = items[index];

  return createPortal(
    <div className="animate-fade fixed inset-0 z-[110] flex flex-col bg-[#141110]/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-5 py-4 text-white/80">
        <span className="text-[12px] tracking-wide">
          {index + 1} / {items.length}
        </span>
        <button type="button" onClick={onClose} aria-label="Fechar" className="p-2">
          <X size={20} />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center px-4 pb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageUrl}
          alt={item.title}
          className="max-h-full max-w-full rounded-md object-contain"
        />
      </div>
      <div className="safe-bottom px-6 pb-6 text-center text-white">
        <p className="font-display text-2xl">{item.title}</p>
        {item.caption ? <p className="mt-1 text-[13px] text-white/60">{item.caption}</p> : null}
        {items.length > 1 ? (
          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate((index - 1 + items.length) % items.length)}
              className="rounded-md border border-white/25 px-5 py-2 text-[13px] transition-colors hover:bg-white/10"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => onNavigate((index + 1) % items.length)}
              className="rounded-md border border-white/25 px-5 py-2 text-[13px] transition-colors hover:bg-white/10"
            >
              Próximo
            </button>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

/* ── TOAST ──────────────────────────────────────────────────────────────────── */

type Toast = { id: number; message: string; tone: 'default' | 'success' | 'error' };
type ToastContextValue = {
  toast: (message: string, tone?: Toast['tone']) => void;
};

const ToastContext = React.createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return React.useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback((message: string, tone: Toast['tone'] = 'default') => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, tone }]);
    setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 4200);
  }, []);

  const value = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[120] flex flex-col items-center gap-2 px-4 pb-24 sm:pb-8">
        {toasts.map((item) => (
          <div
            key={item.id}
            role="status"
            className={cn(
              'animate-sheet pointer-events-auto max-w-md rounded-md px-4 py-3 text-[13px] shadow-lg',
              item.tone === 'error'
                ? 'bg-red-700 text-white'
                : item.tone === 'success'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-secondary text-white',
            )}
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ── ACCORDION (FAQ) ────────────────────────────────────────────────────────── */

export function Accordion({ items }: { items: { question: string; answer: string }[] }) {
  const [open, setOpen] = React.useState<number | null>(0);

  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item, index) => {
        const isOpen = open === index;
        return (
          <div key={item.question}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : index)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-6 py-5 text-left"
            >
              <span className="font-display text-lg leading-snug sm:text-xl">{item.question}</span>
              <span
                className={cn(
                  'shrink-0 text-muted transition-transform duration-300',
                  isOpen && 'rotate-45',
                )}
                aria-hidden="true"
              >
                +
              </span>
            </button>
            <div
              className={cn(
                'grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
              )}
            >
              <div className="overflow-hidden">
                <p className="pb-6 pr-10 text-[14px] leading-relaxed text-muted">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
