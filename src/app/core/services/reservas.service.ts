import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { baseUrl } from '../../../environments/conexion';
import { ReservacionRequest, HistoryReservationResponse } from '../models/reservas.models';
import { ReservacionResponse } from '../models/reservacionesUsuario.models';
import { ReservacionDetalleResponse } from '../models/reservasDetalle.models';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReservasService {
  private readonly http = inject(HttpClient);
  private readonly url = `${baseUrl.desarrollo}/reservaciones`;

  /**
   * Crear una reservación
   * Backend devuelve ResponseEntity<String> (texto), por eso usamos responseType: 'text'
   */
  crearReservacion(reservacion: ReservacionRequest): Observable<string> {
    console.log('ReservasService - crearReservacion payload:', reservacion);
    return this.http.post(`${this.url}/agregar-reservacion`, reservacion, { responseType: 'text' });
  }

  /**
   * Obtener horas/disponibilidades para una mesa en una fecha.
   * Si 'fecha' no se proporciona se usará la fecha actual en formato dd/MM/yyyy.
   */
  getMesasDisponibles(mesa: number, fecha?: string): Observable<HistoryReservationResponse[]> {
    // Si no viene fecha, generar hoy en formato dd/MM/yyyy
    let fechaParam = fecha;
    if (!fechaParam) {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      fechaParam = `${dd}/${mm}/${yyyy}`;
    }

    let params = new HttpParams().set('mesa', String(mesa));
    if (fechaParam) {
      params = params.set('fecha', fechaParam);
    }

    return this.http.get<HistoryReservationResponse[]>(`${this.url}/ver-mesas-disponibles`, { params });
  }

  /**
   * Obtener las reservaciones de un usuario por idUsuario
   * Llama a GET /reservaciones/listar-reservaciones-usuario?idUsuario={id}
   */
  getReservacionesUsuario(idUsuario: number): Observable<ReservacionResponse[]> {
    const params = new HttpParams().set('idUsuario', String(idUsuario));
    return this.http.get<ReservacionResponse[]>(`${this.url}/listar-reservaciones-usuario`, { params });
  }

  /**
   * Obtener los detalles de una reservación por idReserva
   * Llama a GET /reservaciones/listar-reservaciones-detalle?idReserva={id}
   */
  getReservacionesDetalle(idReserva: number): Observable<ReservacionDetalleResponse[]> {
    const params = new HttpParams().set('idReserva', String(idReserva));
    return this.http.get<ReservacionDetalleResponse[]>(`${this.url}/listar-reservaciones-detalle`, { params });
  }

  /**
   * Obtener todas las reservaciones (opcionalmente filtrar por estado)
   * Llama a GET /reservaciones/listar-reservaciones?estado={estado}
   */
  listarReservaciones(estado?: string): Observable<ReservacionResponse[]> {
    let params = new HttpParams();
    if (estado !== undefined && estado !== null && String(estado).trim() !== '') {
      params = params.set('estado', String(estado));
    }

    return this.http.get<ReservacionResponse[]>(`${this.url}/listar-reservaciones`, { params });
  }

  /**
   * Aprobar una reservación por id
   * Llama a POST /reservaciones/aprobar-reservaciones?idReserva={id}
   * Backend devuelve texto, por eso usamos responseType: 'text'
   */
  aprobarReservacion(idReserva: number): Observable<string> {
    const params = new HttpParams().set('idReserva', String(idReserva));
    return this.http.post(`${this.url}/aprobar-reservaciones`, null, { params, responseType: 'text' });
  }

  /**
   * Cancelar una reservación por id
   * Llama a POST /reservaciones/cancelar-reservaciones?idReserva={id}
   */
  cancelarReservacion(idReserva: number): Observable<string> {
    const params = new HttpParams().set('idReserva', String(idReserva));
    return this.http.post(`${this.url}/cancelar-reservaciones`, null, { params, responseType: 'text' });
  }


}
