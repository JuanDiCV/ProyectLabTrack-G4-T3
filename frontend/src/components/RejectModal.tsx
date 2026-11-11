import { useState, type FormEvent } from 'react';
import { adminApi } from '../api/services';
import type { ReservationDetail } from '../types';
import { toUiError } from '../utils/errors';
import { Alert } from './Alert';
import { Modal } from './Modal';

interface RejectModalProps {
  reservation: ReservationDetail;
  onClose: () => void;
  onRejected: (message: string) => void;
}

/**
 * HU-04: el rechazo exige justificación. La validación definitiva la hace el backend
 * (HTTP 400 si el motivo está vacío) y su mensaje se muestra aquí.
 */
export function RejectModal({ reservation, onClose, onRejected }: RejectModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await adminApi.reject(reservation.id, reason);
      onRejected(result.message);
    } catch (err) {
      setError(toUiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Rechazar solicitud" testId="reject-modal" onClose={onClose}>
      <p className="mb-4 text-sm text-slate-400">
        {reservation.student.name} · {reservation.equipment.name} · {reservation.date} {reservation.startTime}–
        {reservation.endTime}
      </p>
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="input-rejection-reason" className="label">
            Motivo del rechazo <span className="text-rose-400">*</span>
          </label>
          <textarea
            id="input-rejection-reason"
            data-testid="input-rejection-reason"
            className="input min-h-24"
            placeholder="Ej. Equipo en mantenimiento"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
        {error && <Alert variant="error" message={error} id="reject-alert-message" />}
        <div className="flex justify-end gap-2">
          <button type="button" id="btn-cancel-reject" data-testid="btn-cancel-reject" className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            id="btn-confirm-reject"
            data-testid="btn-confirm-reject"
            className="btn-danger"
            disabled={submitting}
          >
            Confirmar rechazo
          </button>
        </div>
      </form>
    </Modal>
  );
}
