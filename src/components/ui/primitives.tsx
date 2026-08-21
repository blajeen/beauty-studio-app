import * as React from 'react';
import Link from 'next/link';
import { cn, initials as toInitials } from '@/lib/utils';

/* ── BUTTON ─────────────────────────────────────────────────────────────────
 * Uma única escala de botões para todo o produto. `href` transforma o botão em
 * link sem duplicar estilos — o que mantém a hierarquia visual consistente
 * entre CTA de marketing e ação de formulário.
 */

const BUTTON_VARIANTS = {
  primary:
    'bg-primary text-primary-contrast hover:opacity-90 active:opacity-100 shadow-[0_1px_2px_rgba(0,0,0,0.08)]',
  secondary: 'bg-surface text-ink border border-line hover:bg-primary-soft',
  ghost: 'text-ink hover:bg-primary-soft',
  outline: 'border border-ink/25 text-ink hover:border-ink/60',
  accent: 'bg-accent text-white hover:opacity-90',
  danger: 'bg-surface text-red-700 border border-red-200 hover:bg-red-50',
  link: 'text-ink underline underline-offset-4 decoration-line hover:decoration-ink px-0',
} as const;

const BUTTON_SIZES = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5 rounded-md',
  md: 'h-11 px-5 text-sm gap-2 rounded-md',
  lg: 'h-[52px] px-7 text-[15px] gap-2.5 rounded-md',
  icon: 'h-10 w-10 rounded-md',
} as const;

type ButtonBaseProps = {
  variant?: keyof typeof BUTTON_VARIANTS;
  size?: keyof typeof BUTTON_SIZES;
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
};

export function buttonClass({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
}: ButtonBaseProps = {}) {
  return cn(
    'inline-flex items-center justify-center font-medium tracking-[0.01em] whitespace-nowrap',
    'transition-[opacity,background-color,border-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
    'active:scale-[0.985] disabled:pointer-events-none disabled:opacity-45',
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    fullWidth && 'w-full',
    className,
  );
}

type ButtonProps = ButtonBaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
    href?: string;
    target?: string;
    rel?: string;
    prefetch?: boolean;
  };

export function Button({
  variant,
  size,
  fullWidth,
  className,
  children,
  href,
  prefetch,
  ...rest
}: ButtonProps) {
  const classes = buttonClass({ variant, size, fullWidth, className });

  if (href) {
    const { type: _type, disabled: _disabled, ...anchorProps } = rest;
    return (
      <Link
        href={href}
        prefetch={prefetch}
        className={classes}
        {...(anchorProps as React.ComponentPropsWithoutRef<'a'>)}
      >
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}

/* ── BADGE ────────────────────────────────────────────────────────────────── */

const BADGE_TONES = {
  neutral: 'bg-primary-soft text-ink/75',
  accent: 'bg-accent-soft text-ink',
  solid: 'bg-primary text-primary-contrast',
  outline: 'border border-line text-muted',
  success: 'bg-emerald-50 text-emerald-800 border border-emerald-100',
  warning: 'bg-amber-50 text-amber-800 border border-amber-100',
  danger: 'bg-red-50 text-red-700 border border-red-100',
  info: 'bg-sky-50 text-sky-800 border border-sky-100',
} as const;

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: keyof typeof BADGE_TONES;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium leading-none',
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ── CARD ─────────────────────────────────────────────────────────────────── */

export function Card({
  className,
  children,
  as: Tag = 'div',
  ...rest
}: React.HTMLAttributes<HTMLElement> & { as?: 'div' | 'section' | 'article' | 'li' }) {
  return (
    <Tag
      className={cn(
        'bg-surface border border-line rounded-lg',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 p-5 pb-0', className)}>
      <div className="min-w-0">
        <h3 className="font-display text-xl">{title}</h3>
        {description ? <p className="mt-1 text-[13px] text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

/* ── FORMULÁRIO ───────────────────────────────────────────────────────────── */

const FIELD_BASE =
  'w-full bg-surface border border-line rounded-md px-3.5 text-[15px] text-ink placeholder:text-muted/60 ' +
  'transition-colors duration-200 focus:border-ink/40 focus:outline-none focus:ring-2 focus:ring-primary/10 ' +
  'disabled:opacity-50 disabled:bg-primary-soft';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(FIELD_BASE, 'h-11', className)} {...props} />;
  },
);

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(FIELD_BASE, 'py-2.5 min-h-24 leading-relaxed', className)} {...props} />;
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        FIELD_BASE,
        'h-11 appearance-none pr-9',
        "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%238A7C74%22 stroke-width=%221.5%22><path d=%22M6 9l6 6 6-6%22/></svg>')]",
        'bg-[length:18px] bg-[right_0.75rem_center] bg-no-repeat',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      {label ? (
        <span className="mb-1.5 flex items-baseline justify-between gap-3">
          <span className="text-[13px] font-medium text-ink">
            {label}
            {required ? <span className="ml-0.5 text-accent">*</span> : null}
          </span>
          {hint ? <span className="text-[11px] text-muted">{hint}</span> : null}
        </span>
      ) : null}
      {children}
      {error ? <span className="mt-1.5 block text-[12px] text-red-700">{error}</span> : null}
    </label>
  );
}

/** Alternativa aos rádios nativos: opções em cartão, com área de toque generosa. */
export function OptionCard({
  selected,
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        'w-full text-left rounded-lg border px-4 py-3.5 transition-all duration-200',
        'ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.99]',
        selected
          ? 'border-ink/70 bg-primary-soft'
          : 'border-line bg-surface hover:border-ink/25',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ── AVATAR ───────────────────────────────────────────────────────────────── */

const AVATAR_SIZES = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-9 w-9 text-[11px]',
  md: 'h-12 w-12 text-xs',
  lg: 'h-16 w-16 text-sm',
  xl: 'h-24 w-24 text-lg',
} as const;

export function Avatar({
  name,
  src,
  size = 'md',
  className,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof AVATAR_SIZES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        'bg-primary-soft text-ink/70 font-medium tracking-wide select-none',
        AVATAR_SIZES[size],
        className,
      )}
      aria-hidden={false}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        toInitials(name)
      )}
    </span>
  );
}

/* ── ESTRUTURA ────────────────────────────────────────────────────────────── */

export function Container({
  className,
  children,
  size = 'default',
}: {
  className?: string;
  children: React.ReactNode;
  size?: 'narrow' | 'default' | 'wide';
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-5 sm:px-8',
        size === 'narrow' && 'max-w-3xl',
        size === 'default' && 'max-w-6xl',
        size === 'wide' && 'max-w-[1400px]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = 'left',
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-end justify-between gap-x-8 gap-y-4',
        align === 'center' && 'flex-col items-center text-center',
        className,
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
        <h2 className="font-display text-[2rem] leading-[1.1] sm:text-[2.6rem]">{title}</h2>
        {description ? (
          <p className="mt-3 text-[15px] leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-0 border-t border-line', className)} />;
}

/** Par rótulo/valor usado em fichas, resumos e detalhes. */
export function DataRow({
  label,
  value,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-baseline justify-between gap-6 py-2.5', className)}>
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="text-right text-[14px] font-medium text-ink">{value}</dd>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-primary-soft', className)}
      aria-hidden="true"
    />
  );
}
