import { Button } from '@/components/ui/primitives';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-5">
      <div className="max-w-md text-center">
        <p className="eyebrow">Erro 404</p>
        <h1 className="mt-4 font-display text-[3rem] leading-none">Página não encontrada</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          O endereço que você abriu não existe mais — ou nunca existiu. Vamos recomeçar do início.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="/">Ir para o início</Button>
          <Button href="/agendar" variant="secondary">
            Agendar horário
          </Button>
        </div>
      </div>
    </div>
  );
}
