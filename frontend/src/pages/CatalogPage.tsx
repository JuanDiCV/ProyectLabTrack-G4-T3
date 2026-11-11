import { useCallback, useEffect, useState } from 'react';
import { catalogApi } from '../api/services';
import { Alert } from '../components/Alert';
import { ReservationModal } from '../components/ReservationModal';
import { StatusBadge } from '../components/StatusBadge';
import { CATEGORIES, type CatalogResponse, type Category, type Equipment } from '../types';
import { toUiError } from '../utils/errors';

type Feedback = { message: string; variant: 'success' | 'error' };

/** HU-02 (catálogo y filtro) + punto de entrada de HU-03 (reservar). */
export function CatalogPage() {
  const [category, setCategory] = useState<Category | ''>('');
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [selected, setSelected] = useState<Equipment | null>(null);

  const loadCatalog = useCallback(async (value: Category | '') => {
    setLoading(true);
    try {
      setCatalog(await catalogApi.list(value));
    } catch (error) {
      setFeedback({ message: toUiError(error).message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog(category);
  }, [category, loadCatalog]);

  const openReservation = (equipment: Equipment) => {
    setFeedback(null);
    setSelected(equipment);
  };

  const handleReserved = (message: string) => {
    setSelected(null);
    setFeedback({ message, variant: 'success' });
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Catálogo de equipos</h1>
          <p className="text-sm text-slate-400">Seleccione un equipo y solicite su reserva por bloque horario.</p>
        </div>
        <div className="w-56">
          <label htmlFor="filter-category" className="label">
            Filtrar por categoría
          </label>
          <select
            id="filter-category"
            data-testid="filter-category"
            className="input"
            value={category}
            onChange={(event) => setCategory(event.target.value as Category | '')}
          >
            <option value="">Todas</option>
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <aside
        aria-label="Cómo reservar"
        data-testid="catalog-guide"
        className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-400"
      >
        <strong className="text-teal-300">¿Cómo reservar?</strong> Pulsa <em>Reservar</em> en el equipo deseado, elige
        fecha y horario y envía la solicitud. Quedará <span className="text-sky-300">Pendiente</span> hasta que el
        encargado la apruebe; podrás seguirla en <em>Mis reservas</em>. Recuerda: solo un equipo a la vez y devuelve
        antes de la hora fin para evitar la penalización.
      </aside>

      {feedback && <Alert message={feedback.message} variant={feedback.variant} />}
      {catalog?.message && (
        <Alert message={catalog.message} variant="info" id="catalog-empty-message" testId="catalog-empty-message" />
      )}

      <div className="card overflow-x-auto">
        <table id="catalog-table" data-testid="catalog-table" className="min-w-full divide-y divide-slate-800">
          <thead>
            <tr>
              <th className="table-head">Equipo</th>
              <th className="table-head">Código de inventario</th>
              <th className="table-head">Categoría</th>
              <th className="table-head">Estado</th>
              <th className="table-head text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading && (
              <tr>
                <td colSpan={5} className="table-cell text-center text-slate-400" data-testid="catalog-loading">
                  Cargando catálogo…
                </td>
              </tr>
            )}
            {!loading &&
              catalog?.items.map((item) => (
                <tr key={item.id} id={`equipment-row-${item.inventoryCode}`} data-testid={`equipment-row-${item.inventoryCode}`}>
                  <td className="table-cell font-medium" data-testid="equipment-name">
                    {item.name}
                  </td>
                  <td className="table-cell font-mono text-xs" data-testid="equipment-code">
                    {item.inventoryCode}
                  </td>
                  <td className="table-cell" data-testid="equipment-category">
                    {item.category}
                  </td>
                  <td className="table-cell">
                    <StatusBadge status={item.status} testId="equipment-status" />
                  </td>
                  <td className="table-cell text-right">
                    <button
                      type="button"
                      id={`btn-reserve-${item.inventoryCode}`}
                      data-testid="btn-reserve"
                      className="btn-primary"
                      onClick={() => openReservation(item)}
                    >
                      Reservar
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <ReservationModal equipment={selected} onClose={() => setSelected(null)} onReserved={handleReserved} />
      )}
    </section>
  );
}
