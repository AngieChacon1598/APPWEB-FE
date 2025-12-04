import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { baseUrl } from '../../../environments/conexion';
import { MesaRestaurante, MesaRestaurantRequest, MesaResponse } from '../models/mesa.models';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MesaService {
  private readonly http = inject(HttpClient)

  private readonly url = `${baseUrl.desarrollo}/mesas`

  // READ - Consultar mesas
  getMesasByState(estado: string): Observable<MesaResponse> {
    return this.http.get<MesaResponse>(`${this.url}?estado=${estado}`);
  }

  // CREATE - Crear mesa
  createMesa(mesaData: MesaRestaurantRequest): Observable<any> {
    // Algunos endpoints devuelven texto plano (mensajes), por eso usamos responseType: 'text'
    return this.http.post(`${this.url}/guardar-mesas`, mesaData, { responseType: 'text' });
  }

  // UPDATE - Actualizar mesa
  updateMesa(idMesa: number, mesaData: MesaRestaurantRequest): Observable<any> {
    // Algunos endpoints responden con mensajes en texto en lugar de JSON -> evitar error de parseo
    return this.http.patch(`${this.url}/actualizar-mesas?idMesa=${idMesa}`, mesaData, { responseType: 'text' });
  }

  // DELETE - Inactivar mesa (eliminación lógica)
  inactivateMesa(idMesa: number): Observable<MesaResponse> {
    return this.http.patch<MesaResponse>(`${this.url}/inactivar-mesas/${idMesa}`, {});
  }

  // RESTORE - Restaurar mesa (reactivar)
  restoreMesa(idMesa: number): Observable<MesaResponse> {
    return this.http.patch<MesaResponse>(`${this.url}/reactivar-mesas/${idMesa}`, {});
  }

  // Métodos de compatibilidad (para mantener funcionalidad existente)
  getByMesaStatus(estado: string) {
    return this.getMesasByState(estado);
  }

  setSaveMesas(mesaDto: MesaRestaurantRequest) {
    return this.createMesa(mesaDto);
  }

  setUpdateMesas(id: number, data: MesaRestaurantRequest): Observable<any> {
    return this.updateMesa(id, data);
  }

  setInactiveMesas(id: number): Observable<MesaResponse> {
    return this.inactivateMesa(id);
  }
}
