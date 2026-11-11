import { useState, type FormEvent } from 'react';
import { reservationApi } from '../api/services';
import type { Equipment } from '../types';
import { toUiError } from '../utils/errors';
import { TIME_OPTIONS, toIsoDate, tomorrowIsoDate } from '../utils/time';
import { Alert } from './Alert';
import { Modal } from './Modal';

interface ReservationModalProps {
  equipment: Equipment;
  onClose: () => void;
  onReserved: (message: string) => void;
}

/** HU-03: formulario de reserva (fecha, hora inicio, hora fin). */
export function ReservationModal({ equipment, onClose, onReserved }: ReservationModalProps) {
  const [date, setDate] = useState(tomorrowIsoDate);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await reservationApi.create({ equipmentId: equipment.id, date, startTime, endTime });
      onReserved(result.message);
    } catch (err) {
      setError(toUiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={`Reservar ${equipment.name}`} testId="reservation-modal" onClose={onClose}>
      <p className="mb-4 text-sm text-slate-400">
        Código <span data-testid="reservation-equipment-code">{equipment.inventoryCode}</span> · {equipment.category}
      </p>
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="input-reservation-date" className="label">
            Fecha
          </label>
          <input
            id="input-reservation-date"
            data-testid="input-reservation-date"
            type="date"
            className="input"
            min={toIsoDate(new Date())}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="input-start-time" className="label">
              Hora de inicio
            </label>
            <select
              id="input-start-time"
              data-testid="input-start-time"
              className="input"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            >
              {TIME_OPTIONS.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="input-end-time" className="label">
              Hora de fin
            </label>
            <select
              id="input-end-time"
              data-testid="input-end-time"
              className="input"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
            >
              {TIME_OPTIONS.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <Alert variant="error" message={error} id="reservation-alert-message" />}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            id="btn-cancel-reservation"
            data-testid="btn-cancel-reservation"
            className="btn-secondary"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="submit"
            id="btn-confirm-reservation"
            data-testid="btn-confirm-reservation"
            className="btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Reservando…' : 'Confirmar reserva'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
