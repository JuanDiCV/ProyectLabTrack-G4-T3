import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../api/services';
import { Alert } from '../components/Alert';
import { RejectModal } from '../components/RejectModal';
import type { ReservationDetail } from '../types';
import { toUiError } from '../utils/errors';
import { formatDate } from '../utils/time';

type Feedback = { message: string; variant: 'success' | 'error' };

/** HU-04: solicitudes pendientes con acciones Aprobar / Rechazar. */
export function AdminRequestsPage() {
  const [pending, setPending] = useState<ReservationDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [toReject, setToReject] = useState<ReservationDetail | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPending(await adminApi.listPending());
    } catch (error) {
      setFeedback({ message: toUiError(error).message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const approve = async (reservation: ReservationDetail) => {
    setFeedback(null);
    try {
      const result = await adminApi.approve(reservation.id);
      setFeedback({ message: result.message, variant: 'success' });
      await load();
    } catch (error) {
      setFeedback({ message: toUiError(error).message, variant: 'error' });
    }
  };

  const handleRejected = async (message: string) => {
    setToReject(null);
    setFeedback({ message, variant: 'success' });
    await load();
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Solicitudes pendientes</h1>
        <p className="text-sm text-slate-400">Apruebe o rechace las reservas solicitadas por los estudiantes.</p>
      </div>

      <aside className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-400">
        <strong className="text-teal-300">Criterios:</strong> al aprobar se valida que el horario no se cruce con otra
        reserva aprobada del mismo equipo. Para rechazar es obligatorio indicar la justificación.
      </aside>

      {feedback && <Alert message={feedback.message} variant={feedback.variant} />}

      <div className="card overflow-x-auto">
        <table id="pending-table" data-testid="pending-table" className="min-w-full divide-y divide-slate-800">
          <thead>
            <tr>
              <th className="table-head">Estudiante</th>
              <th className="table-head">Equipo</th>
              <th className="table-head">Fecha / Hora solicitada</th>
              <th className="table-head text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {!loading && pending.length === 0 && (
              <tr>
                <td colSpan={4} className="table-cell text-center text-slate-400" data-testid="pending-empty">
                  No hay solicitudes pendientes.
                </td>
              </tr>
            )}
            {pending.map((item) => (
              <tr key={item.id} id={`pending-row-${item.id}`} data-testid={`pending-row-${item.id}`}>
                <td className="table-cell">
                  <span className="font-medium" data-testid="pending-student-name">
                    {item.student.name}
                  </span>
                  <span className="block text-xs text-slate-500">{item.student.studentCode}</span>
                </td>
                <td className="table-cell" data-testid="pending-equipment-name">
                  {item.equipment.name}
                </td>
                <td className="table-cell" data-testid="pending-schedule">
                  {formatDate(item.date)} · {item.startTime} – {item.endTime}
                </td>
                <td className="table-cell">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      id={`btn-approve-${item.id}`}
                      data-testid="btn-approve"
                      className="btn-primary"
                      onClick={() => void approve(item)}
                    >
                      Aprobar
                    </button>
                    <button
                      type="button"
                      id={`btn-reject-${item.id}`}
                      data-testid="btn-reject"
                      className="btn-danger"
                      onClick={() => setToReject(item)}
                    >
                      Rechazar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {toReject && (
        <RejectModal reservation={toReject} onClose={() => setToReject(null)} onRejected={(m) => void handleRejected(m)} />
      )}
    </section>
  );
}
