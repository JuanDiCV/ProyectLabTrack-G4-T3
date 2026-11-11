import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { adminApi } from '../api/services';
import { Alert, type AlertVariant } from '../components/Alert';
import { StatusBadge } from '../components/StatusBadge';
import type { ReservationDetail } from '../types';
import { toUiError } from '../utils/errors';
import { formatDate } from '../utils/time';

type Feedback = { message: string; variant: AlertVariant };

/** HU-05: búsqueda de reservas activas y registro de devolución con penalización automática. */
export function AdminReturnsPage() {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<ReservationDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const search = useCallback(async (term: string) => {
    setLoading(true);
    try {
      setActive(await adminApi.searchActive(term.trim()));
    } catch (error) {
      setFeedback({ message: toUiError(error).message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void search('');
  }, [search]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    void search(query);
  };

  const markReturn = async (reservation: ReservationDetail) => {
    setFeedback(null);
    try {
      const result = await adminApi.markReturn(reservation.id);
      setFeedback({ message: result.message, variant: result.penalized ? 'security' : 'success' });
      await search(query);
    } catch (error) {
      setFeedback({ message: toUiError(error).message, variant: 'error' });
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Devoluciones</h1>
        <p className="text-sm text-slate-400">Busque reservas activas por nombre o código del estudiante.</p>
      </div>

      <form className="flex flex-wrap gap-2" onSubmit={handleSearch} role="search">
        <label htmlFor="input-search-student" className="sr-only">
          Buscar estudiante
        </label>
        <input
          id="input-search-student"
          data-testid="input-search-student"
          className="input max-w-sm"
          placeholder="Ej. Juan Pérez o 20261001"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button id="btn-search" data-testid="btn-search" type="submit" className="btn-secondary">
          Buscar
        </button>
      </form>

      <aside className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-400">
        <strong className="text-teal-300">Penalización automática:</strong> devolver hasta la hora fin (inclusive) no
        penaliza; después, el estudiante pasa a <span className="text-rose-300">Penalizado</span>. El equipo vuelve a{' '}
        <span className="text-emerald-300">Disponible</span> al registrar la devolución.
      </aside>

      {feedback && <Alert message={feedback.message} variant={feedback.variant} />}

      <div className="card overflow-x-auto">
        <table id="active-table" data-testid="active-table" className="min-w-full divide-y divide-slate-800">
          <thead>
            <tr>
              <th className="table-head">Estudiante</th>
              <th className="table-head">Equipo</th>
              <th className="table-head">Fecha / Horario</th>
              <th className="table-head">Estado estudiante</th>
              <th className="table-head text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {!loading && active.length === 0 && (
              <tr>
                <td colSpan={5} className="table-cell text-center text-slate-400" data-testid="active-empty">
                  No se encontraron reservas activas.
                </td>
              </tr>
            )}
            {active.map((item) => (
              <tr key={item.id} id={`active-row-${item.id}`} data-testid={`active-row-${item.id}`}>
                <td className="table-cell">
                  <span className="font-medium">{item.student.name}</span>
                  <span className="block text-xs text-slate-500">{item.student.studentCode}</span>
                </td>
                <td className="table-cell">{item.equipment.name}</td>
                <td className="table-cell">
                  {formatDate(item.date)} · {item.startTime} – {item.endTime}
                </td>
                <td className="table-cell">
                  <StatusBadge status={item.student.status} />
                </td>
                <td className="table-cell text-right">
                  <button
                    type="button"
                    id={`btn-mark-return-${item.id}`}
                    data-testid="btn-mark-return"
                    className="btn-primary"
                    onClick={() => void markReturn(item)}
                  >
                    Marcar Devolución
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
