import Link from 'next/link';
import { getBrand, getContent } from '@/lib/brand/server';
import { Logo } from '@/components/logo';
import { SmartImage } from '@/components/ui/media';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const [brand, content] = await Promise.all([getBrand(), getContent()]);

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-5 py-8 sm:px-10 lg:px-16 lg:py-12">
        <Link href="/" aria-label={brand.name}>
          <Logo />
        </Link>
        <div className="flex flex-1 items-center py-12">
          <div className="mx-auto w-full max-w-sm">{children}</div>
        </div>
        <p className="text-[12px] text-muted">
          © {new Date().getFullYear()} {brand.legal.companyName}
        </p>
      </div>

      {/* Painel editorial: reforça a marca sem competir com o formulário. */}
      <div className="relative hidden lg:block">
        <SmartImage
          src={content.hero.imageUrl}
          alt={brand.name}
          seed={brand.name}
          className="h-full"
          overlay
        />
        <div className="absolute inset-x-0 bottom-0 p-12">
          <p className="font-display text-[2.6rem] leading-[1.08] text-white">
            {content.editorial.quote}
          </p>
          <p className="mt-5 text-[11px] uppercase tracking-[0.18em] text-white/55">
            {content.editorial.author}
          </p>
        </div>
      </div>
    </div>
  );
}
