const COLORS: Record<string, string> = {
  Disponible: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  Prestado: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  Pendiente: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
  Aprobada: 'bg-teal-500/15 text-teal-300 ring-teal-500/30',
  Rechazada: 'bg-rose-500/15 text-rose-300 ring-rose-500/30',
  Finalizada: 'bg-slate-500/20 text-slate-300 ring-slate-500/30',
  Activo: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  Penalizado: 'bg-rose-500/15 text-rose-300 ring-rose-500/30',
};

interface StatusBadgeProps {
  status: string;
  testId?: string;
}

export function StatusBadge({ status, testId }: StatusBadgeProps) {
  const color = COLORS[status] ?? 'bg-slate-700 text-slate-200 ring-slate-600';
  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${color}`}
    >
      {status}
    </span>
  );
}
