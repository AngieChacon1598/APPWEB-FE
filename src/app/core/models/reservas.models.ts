export interface ReservacionDetalleRequest {
  hourReservation: string; // Hora solicitada (p. ej. "19:30")
  dateReservation: string; // Fecha solicitada (ISO string o formato acordado)
  amountPeople: number; // Cantidad de personas
  requirements?: string; // Requerimientos adicionales (opcional)
  tableId?: number; // id de la mesa seleccionada (opcional)
}

export interface ReservacionRequest {
  idUsuario?: number; // id del usuario que reserva
  nameReservation: string; // nombre de la reservación / nombre del cliente
  dateReservation: string; // fecha general de la reservación (puede ser fecha/fecha+hora según backend)
  detallesRequest: ReservacionDetalleRequest[]; // lista de detalles
}

// Respuesta del endpoint: el backend devuelve un String (ResponseEntity<String>),
// así que en el servicio lo recibiremos como texto.

// --------------------------------------
// Tipado para la respuesta de disponibilidad
// --------------------------------------
export interface HistoryReservationResponse {
  // Hora de la reservación (p.ej. "19:30")
  hourReservation?: string;
  // Fecha asociada (formato dd/MM/yyyy o ISO según backend)
  dateReservation?: string;
  // Cantidad de personas permitidas o solicitadas
  amountPeople?: number;
  // Requerimientos u observaciones
  requirements?: string;
  // Id de la mesa
  tableId?: number;
  // Indica si está reservado (false = disponible)
  reserved?: boolean;
  // Cualquier otro campo que venga del backend
  [key: string]: any;
}
