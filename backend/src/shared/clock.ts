/**
 * Reloj inyectable. Los servicios nunca llaman a `new Date()` directamente:
 * reciben un Clock para que las pruebas puedan fijar la fecha/hora exacta del sistema.
 */
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = {
  now: () => new Date(),
};

/** Reloj controlable para pruebas unitarias (simula la hora del sistema). */
export class FixedClock implements Clock {
  private current: Date;

  constructor(initial: Date | string) {
    this.current = new Date(initial);
  }

  now(): Date {
    return new Date(this.current.getTime());
  }

  set(value: Date | string): void {
    this.current = new Date(value);
  }

  advanceMinutes(minutes: number): void {
    this.current = new Date(this.current.getTime() + minutes * 60_000);
  }
}
