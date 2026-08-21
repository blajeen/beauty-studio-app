import { Container } from '@/components/ui/primitives';
import { CardGridSkeleton } from '@/components/ui/states';

export default function Loading() {
  return (
    <Container size="wide" className="py-12 sm:py-16">
      <div className="h-12 w-72 animate-pulse rounded-md bg-primary-soft" />
      <CardGridSkeleton className="mt-12" count={6} />
    </Container>
  );
}
