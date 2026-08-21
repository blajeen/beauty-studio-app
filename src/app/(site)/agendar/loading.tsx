import { Container } from '@/components/ui/primitives';
import { LoadingState } from '@/components/ui/states';

export default function Loading() {
  return (
    <Container size="default" className="py-12">
      <LoadingState label="Preparando o agendamento…" />
    </Container>
  );
}
