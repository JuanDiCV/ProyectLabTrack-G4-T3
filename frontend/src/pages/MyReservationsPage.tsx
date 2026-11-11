import { useEffect, useState } from 'react';
import { reservationApi } from '../api/services';
import { Alert } from '../components/Alert';
import { StatusBadge } from '../components/StatusBadge';
import type { ReservationDetail } from '../types';
import { toUiError } from '../utils/errors';
import { formatDate } from '../utils/time';

export function MyReservationsPage() {
  const [reservations, setReservations] = useState<ReservationDetail[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reservationApi
      .listMine()
      .then(setReservations)
      .catch((err: unknown) => setError(toUiError(err).message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mis reservas</h1>
        <p className="text-sm text-slate-400">Estado de sus solicitudes de préstamo.</p>
      </div>

      <aside
        aria-label="Significado de los estados"
        data-testid="reservations-legend"
        className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-400"
      >
        <span><StatusBadge status="Pendiente" /> en revisión por el encargado</span>
        <span><StatusBadge status="Aprobada" /> retira el equipo en el laboratorio</span>
        <span><StatusBadge status="Rechazada" /> consulta el motivo en Observación</span>
        <span><StatusBadge status="Finalizada" /> equipo devuelto</span>
      </aside>

      {error && <Alert message={error} variant="error" />}

      <div className="card overflow-x-auto">
        <table id="my-reservations-table" data-testid="my-reservations-table" className="min-w-full divide-y divide-slate-800">
          <thead>
            <tr>
              <th className="table-head">Equipo</th>
              <th className="table-head">Fecha</th>
              <th className="table-head">Horario</th>
              <th className="table-head">Estado</th>
              <th className="table-head">Observación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {!loading && reservations.length === 0 && (
              <tr>
                <td colSpan={5} className="table-cell text-center text-slate-400" data-testid="my-reservations-empty">
                  Aún no tiene reservas registradas.
                </td>
              </tr>
            )}
            {reservations.map((item) => (
              <tr key={item.id} data-testid={`my-reservation-row-${item.id}`}>
                <td className="table-cell font-medium">{item.equipment.name}</td>
                <td className="table-cell">{formatDate(item.date)}</td>
                <td className="table-cell">
                  {item.startTime} – {item.endTime}
                </td>
                <td className="table-cell">
                  <StatusBadge status={item.status} testId="reservation-status" />
                </td>
                <td className="table-cell text-slate-400">{item.rejectionReason ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
