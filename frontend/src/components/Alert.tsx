export type AlertVariant = 'success' | 'error' | 'security' | 'info';

interface AlertProps {
  message: string;
  variant?: AlertVariant;
  id?: string;
  testId?: string;
}

const STYLES: Record<AlertVariant, string> = {
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  error: 'border-rose-500/40 bg-rose-500/10 text-rose-200',
  security: 'border-amber-400/60 bg-amber-500/15 text-amber-100',
  info: 'border-sky-500/40 bg-sky-500/10 text-sky-200',
};

const ICONS: Record<AlertVariant, string> = {
  success: '✓',
  error: '!',
  security: '⛨',
  info: 'i',
};

/** Alerta accesible con selectores estables para Selenium (data-testid="alert-message"). */
export function Alert({ message, variant = 'info', id = 'alert-message', testId = 'alert-message' }: AlertProps) {
  return (
    <div
      id={id}
      data-testid={testId}
      data-variant={variant}
      role={variant === 'success' || variant === 'info' ? 'status' : 'alert'}
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${STYLES[variant]}`}
    >
      <span aria-hidden="true" className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/10 font-bold">
        {ICONS[variant]}
      </span>
      <span className={variant === 'security' ? 'font-medium' : undefined}>{message}</span>
    </div>
  );
}
