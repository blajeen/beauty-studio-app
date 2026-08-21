'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import { Select } from '@/components/ui/primitives';

type Option = { id: string; label: string };

/** Filtros da agenda da gestão (seção 40). Estado vive na URL — link compartilhável. */
export function AgendaFilters({
  branches,
  professionals,
  categories,
  statuses,
  current,
}: {
  branches: { id: string; name: string }[];
  professionals: { id: string; displayName: string }[];
  categories: { id: string; name: string }[];
  statuses: Option[];
  current: Record<'unidade' | 'profissional' | 'categoria' | 'status', string>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const query = new URLSearchParams(params.toString());
    if (value) query.set(key, value);
    else query.delete(key);
    router.push(`${pathname}?${query.toString()}`);
  }

  function clear() {
    const query = new URLSearchParams(params.toString());
    ['unidade', 'profissional', 'categoria', 'status'].forEach((key) => query.delete(key));
    router.push(`${pathname}?${query.toString()}`);
  }

  const hasFilters = Object.values(current).some(Boolean);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={current.unidade}
        onChange={(event) => update('unidade', event.target.value)}
        className="h-10 w-auto min-w-40 text-[13px]"
        aria-label="Unidade"
      >
        <option value="">Todas as unidades</option>
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </Select>

      <Select
        value={current.profissional}
        onChange={(event) => update('profissional', event.target.value)}
        className="h-10 w-auto min-w-44 text-[13px]"
        aria-label="Profissional"
      >
        <option value="">Todas as profissionais</option>
        {professionals.map((professional) => (
          <option key={professional.id} value={professional.id}>
            {professional.displayName}
          </option>
        ))}
      </Select>

      <Select
        value={current.categoria}
        onChange={(event) => update('categoria', event.target.value)}
        className="h-10 w-auto min-w-40 text-[13px]"
        aria-label="Categoria"
      >
        <option value="">Todas as categorias</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </Select>

      <Select
        value={current.status}
        onChange={(event) => update('status', event.target.value)}
        className="h-10 w-auto min-w-40 text-[13px]"
        aria-label="Status"
      >
        <option value="">Todos os status</option>
        {statuses.map((status) => (
          <option key={status.id} value={status.id}>
            {status.label}
          </option>
        ))}
      </Select>

      {hasFilters ? (
        <button
          type="button"
          onClick={clear}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[12.5px] text-muted transition-colors hover:bg-primary-soft hover:text-ink"
        >
          <X size={13} />
          Limpar filtros
        </button>
      ) : null}
    </div>
  );
}
