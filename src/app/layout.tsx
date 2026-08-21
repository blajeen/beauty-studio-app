import type { Metadata, Viewport } from 'next';
import './globals.css';
import { getBrand, isPreviewMode } from '@/lib/brand/server';
import { brandToStyle } from '@/lib/brand/config';
import { BrandProvider } from '@/components/brand-provider';
import { ToastProvider } from '@/components/ui/overlay';
import { PreviewBanner } from '@/components/preview-banner';
import { ServiceWorker } from '@/components/service-worker';

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrand();
  const favicon = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="${brand.colors.primary}"/><text y="50%" x="50%" dy=".36em" text-anchor="middle" font-size="58" fill="${brand.colors.primaryContrast}" font-family="Georgia, serif">${brand.monogram}</text></svg>`,
  )}`;

  return {
    title: {
      default: `${brand.name} — ${brand.tagline}`,
      template: `%s · ${brand.name}`,
    },
    description:
      'Agende unhas, sobrancelhas, cílios, maquiagem e estética com as profissionais do estúdio. Histórico, pacotes e produção para eventos em um só aplicativo.',
    applicationName: brand.name,
    manifest: '/manifest.webmanifest',
    icons: { icon: favicon, apple: favicon },
    appleWebApp: { capable: true, title: brand.shortName, statusBarStyle: 'default' },
    formatDetection: { telephone: false },
    openGraph: {
      title: `${brand.name} — ${brand.tagline}`,
      description: 'O aplicativo oficial do estúdio. Agende, acompanhe e guarde a sua rotina de beleza.',
      type: 'website',
    },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const brand = await getBrand();
  return {
    themeColor: brand.colors.background,
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    viewportFit: 'cover',
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [brand, preview] = await Promise.all([getBrand(), isPreviewMode()]);

  return (
    <html lang="pt-BR" style={brandToStyle(brand) as React.CSSProperties}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh antialiased">
        <BrandProvider brand={brand}>
          <ToastProvider>
            {preview ? <PreviewBanner /> : null}
            {children}
          </ToastProvider>
        </BrandProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
