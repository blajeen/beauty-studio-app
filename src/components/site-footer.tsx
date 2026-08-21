import Link from 'next/link';
import { Instagram, MapPin, Phone } from 'lucide-react';
import { getBrand, getContent } from '@/lib/brand/server';
import { db } from '@/lib/db';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { Logo } from '@/components/logo';

export async function SiteFooter() {
  const [brand, content, branches] = await Promise.all([
    getBrand(),
    getContent(),
    db.branch.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
  ]);

  const columns = [
    {
      title: 'Serviços',
      links: [
        { href: '/servicos/unhas', label: 'Unhas' },
        { href: '/servicos/sobrancelhas', label: 'Sobrancelhas' },
        { href: '/servicos/cilios', label: 'Cílios' },
        { href: '/servicos/maquiagem', label: 'Maquiagem' },
        { href: '/servicos/estetica-facial', label: 'Estética facial' },
      ],
    },
    {
      title: 'Estúdio',
      links: [
        { href: '/profissionais', label: 'Profissionais' },
        ...(brand.features.portfolio ? [{ href: '/portfolio', label: 'Portfólio' }] : []),
        ...(brand.features.packages ? [{ href: '/pacotes', label: 'Pacotes e combos' }] : []),
        ...(brand.features.beautyClub ? [{ href: '/beauty-club', label: 'Beauty Club' }] : []),
        ...(brand.features.events ? [{ href: '/noivas', label: 'Noivas e eventos' }] : []),
      ],
    },
    {
      title: 'Ajuda',
      links: [
        { href: '/sobre', label: 'Sobre o estúdio' },
        { href: '/sobre#faq', label: 'Perguntas frequentes' },
        { href: '/minha-conta', label: 'Minha conta' },
        { href: '/entrar', label: 'Entrar' },
      ],
    },
  ];

  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-muted">
              {content.footerNote}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <WhatsAppButton variant="inline" />
              <a
                href={`https://instagram.com/${brand.contact.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-line text-ink/70 transition-colors hover:bg-primary-soft hover:text-ink"
                aria-label="Instagram"
              >
                <Instagram size={17} strokeWidth={1.6} />
              </a>
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            {columns.map((column) => (
              <div key={column.title}>
                <p className="eyebrow mb-4">{column.title}</p>
                <ul className="space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="text-[13.5px] text-ink/70 transition-colors hover:text-ink"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 grid gap-8 border-t border-line pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {branches.map((branch) => (
            <div key={branch.id}>
              <p className="text-[13px] font-medium text-ink">{branch.name}</p>
              <p className="mt-1.5 flex items-start gap-1.5 text-[12.5px] leading-relaxed text-muted">
                <MapPin size={13} className="mt-0.5 shrink-0" />
                <span>
                  {branch.address}
                  <br />
                  {branch.district ? `${branch.district} · ` : ''}
                  {branch.city}
                  {branch.state ? `/${branch.state}` : ''}
                </span>
              </p>
              {branch.phone ? (
                <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-muted">
                  <Phone size={13} />
                  {branch.phone}
                </p>
              ) : null}
            </div>
          ))}
          <div className="text-[12.5px] leading-relaxed text-muted">
            <p className="text-[13px] font-medium text-ink">Horário</p>
            <p className="mt-1.5">Terça a sexta · 09:00 às 20:00</p>
            <p>Sábado · 09:00 às 17:00</p>
            <p>Domingo e segunda · fechado</p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-8 text-[12px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {brand.legal.companyName} · CNPJ {brand.legal.document}
          </p>
          <p className="max-w-md">{brand.policies.cancellationText}</p>
        </div>
      </div>
    </footer>
  );
}
