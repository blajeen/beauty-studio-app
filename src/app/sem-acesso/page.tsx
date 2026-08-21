import type { Metadata } from 'next';
import { ForbiddenState } from '@/components/ui/states';

export const metadata: Metadata = { title: 'Acesso restrito' };

export default function ForbiddenPage() {
  return <ForbiddenState />;
}
