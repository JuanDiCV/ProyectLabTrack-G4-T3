/**
 * Mensajes exactos de negocio. Centralizados para que pruebas unitarias,
 * E2E (Selenium) y la UI usen exactamente el mismo texto.
 */
export const MAX_FAILED_ATTEMPTS = 3;

export const MESSAGES = {
  // HU-01
  REQUIRED_FIELDS: 'Complete los campos obligatorios: código de estudiante y contraseña',
  INVALID_CREDENTIALS: 'Credenciales inválidas',
  ACCOUNT_LOCKED_LIMIT: `Alerta de seguridad: se ha alcanzado el límite de ${MAX_FAILED_ATTEMPTS} intentos fallidos. La cuenta ha sido bloqueada temporalmente.`,
  ACCOUNT_LOCKED:
    'Alerta de seguridad: la cuenta está temporalmente bloqueada por intentos fallidos. Intente nuevamente más tarde.',
  TOKEN_REQUIRED: 'Debe iniciar sesión para acceder a este recurso',
  TOKEN_INVALID: 'La sesión no es válida o ha expirado',
  FORBIDDEN: 'No tiene permisos para realizar esta acción',

  // HU-02
  NO_EQUIPMENT_IN_CATEGORY: 'No hay equipos disponibles en esta categoría',
  INVALID_CATEGORY: 'Categoría inválida. Valores permitidos: Cómputo, Electrónica, Redes',

  // HU-03
  EQUIPMENT_NOT_FOUND: 'El equipo solicitado no existe',
  EQUIPMENT_BORROWED: 'El equipo no está disponible: figura como "Prestado" en el horario solicitado',
  SCHEDULE_OVERLAP:
    'Cruce de horarios: el equipo ya tiene una reserva aprobada que se superpone con el horario solicitado',
  STUDENT_SIMULTANEOUS:
    'No puede reservar más de un equipo de forma simultánea: ya tiene una reserva activa en ese horario',
  STUDENT_PENALIZED: 'Su cuenta está penalizada por devolución tardía y no puede realizar reservas',
  PAST_SLOT: 'No es posible reservar en una fecha u hora que ya pasó',
  INVALID_DATE: 'La fecha debe tener el formato YYYY-MM-DD y ser una fecha válida',
  INVALID_TIME: 'La hora debe tener el formato HH:mm (00:00 - 23:59)',
  INVALID_RANGE: 'La hora de fin debe ser posterior a la hora de inicio',
  INVALID_EQUIPMENT_ID: 'Debe seleccionar un equipo válido',
  RESERVATION_CREATED: 'Reserva registrada correctamente con estado "Pendiente"',

  // HU-04
  RESERVATION_NOT_FOUND: 'La reserva no existe',
  ONLY_PENDING: 'Solo se pueden gestionar solicitudes en estado "Pendiente"',
  REJECTION_REQUIRED: 'La justificación del rechazo es obligatoria',
  RESERVATION_APPROVED: 'Solicitud aprobada. El equipo quedó en estado "Prestado"',
  RESERVATION_REJECTED: 'Solicitud rechazada correctamente',

  // HU-05
  ONLY_ACTIVE_RETURN: 'Solo se puede registrar la devolución de reservas activas (Aprobadas)',
  RETURN_ON_TIME: 'Devolución registrada a tiempo. El equipo quedó "Disponible"',
  RETURN_LATE: 'Devolución tardía registrada. El estudiante fue marcado como "Penalizado"',

  // Genéricos
  INVALID_ID: 'El identificador debe ser un número entero positivo',
  INVALID_JSON: 'El cuerpo de la petición no es un JSON válido',
  NOT_FOUND: 'Recurso no encontrado',
  INTERNAL: 'Error interno del servidor',
} as const;
