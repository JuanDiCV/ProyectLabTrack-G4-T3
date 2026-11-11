import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  title: string;
  testId: string;
  onClose: () => void;
  children: ReactNode;
}

/** Modal HTML estándar (fuera de cualquier canvas) para mantener los selectores de Selenium. */
export function Modal({ title, testId, onClose, children }: ModalProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${testId}-title`}
        id={testId}
        data-testid={testId}
        className="card w-full max-w-md p-6"
      >
        <h2 id={`${testId}-title`} className="mb-4 text-lg font-semibold">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
