export interface ReservacionDetalleResponse {
  amountPeople: number;
  // hourReservation comes from backend as LocalTime - keep as string in frontend (HH:mm or HH:mm:ss)
  hourReservation: string | null;
  // dateReservation comes from backend as LocalDate - keep as string in frontend (yyyy-MM-dd)
  dateReservation: string | null;
  requirements?: string | null;
  tableId?: number | null;
  imagenMesa?: string | null;
}
