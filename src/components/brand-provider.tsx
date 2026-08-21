'use client';

import * as React from 'react';
import type { BrandConfig } from '@/lib/brand/config';

const BrandContext = React.createContext<BrandConfig | null>(null);

export function BrandProvider({
  brand,
  children,
}: {
  brand: BrandConfig;
  children: React.ReactNode;
}) {
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

/** Marca no cliente — para componentes interativos (WhatsApp, políticas, features). */
export function useBrand(): BrandConfig {
  const brand = React.useContext(BrandContext);
  if (!brand) throw new Error('useBrand precisa estar dentro de <BrandProvider>');
  return brand;
}
