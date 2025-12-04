/**
 * DTO returned by backend for a user's reservation
 * Backend Java class:
 * public class ReservacionResponse {
 *   private Integer idReservacion;
 *   private String namereservation;
 *   private String estado;
 *   private LocalDateTime fechaCreacion;
 * }
 */
export interface ReservacionResponse {
  idReservacion: number;
  namereservation: string;
  estado: string;
  // LocalDateTime from backend will arrive as an ISO-like string; keep as string here.
  fechaCreacion: string;
}
