import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { baseUrl } from '../../../environments/conexion';
import { 
  SalesTicketDTO, 
  SalesTicket, 
  SalesTicketPage, 
  SalesTicketFilters,
  SalesTicketResponse 
} from '../models/salesticket.models';

@Injectable({
  providedIn: 'root'
})
export class SalesTicketService {
  private readonly http = inject(HttpClient);
  private readonly url = baseUrl.desarrollo;
  
  constructor() {
    // Log para verificar la URL en tiempo de ejecución
    console.log('SalesTicketService - URL base configurada:', this.url);
    console.log('SalesTicketService - Entorno:', typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? 'PRODUCCIÓN' : 'DESARROLLO');
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Error en SalesTicketService:', error);
    console.error('Error status:', error.status);
    console.error('Error statusText:', error.statusText);
    console.error('Error message:', error.message);
    console.error('Error error:', error.error);

    if (error.status === 401) {
      console.error('Error 401: No autorizado - Token inválido o expirado');
      return throwError(() => new Error('No autorizado. Por favor, inicia sesión nuevamente.'));
    } else if (error.status === 403) {
      console.error('Error 403: Acceso denegado - El usuario no tiene permisos para esta operación');
      console.error('Verifica que el usuario tenga el rol correcto en el backend');
      const errorMessage = error.error?.message || error.message || 'Acceso denegado. Tu usuario no tiene permisos para crear tickets. Contacta al administrador.';
      return throwError(() => new Error(errorMessage));
    } else if (error.status === 404) {
      return throwError(() => new Error('Recurso no encontrado'));
    } else if (error.status >= 500) {
      return throwError(() => new Error('Error del servidor. Por favor, intenta nuevamente más tarde.'));
    } else {
      return throwError(() => new Error('Error de conexión. Verifica tu conexión a internet.'));
    }
  }

  // ==================== CONSULTAS ====================

  /**
   * Obtener ventas con paginación
   */
  getSalesTicketsPaginated(page: number = 0, size: number = 10): Observable<SalesTicketPage> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<SalesTicketPage>(`${this.url}/api/sales/page`, { params })
      .pipe(catchError(this.handleError.bind(this)));
  }

  /**
   * Obtener todas las ventas activas
   */
  getActiveSalesTickets(): Observable<SalesTicketDTO[]> {
    return this.http.get<SalesTicketDTO[]>(`${this.url}/api/sales`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  /**
   * Obtener todas las ventas (activas e inactivas)
   */
  getAllSalesTickets(): Observable<SalesTicketDTO[]> {
    return this.http.get<SalesTicketDTO[]>(`${this.url}/api/sales/all`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  /**
   * Obtener ventas inactivas
   */
  getInactiveSalesTickets(): Observable<SalesTicketDTO[]> {
    return this.http.get<SalesTicketDTO[]>(`${this.url}/api/sales/inactive`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  /**
   * Obtener venta por ID
   */
  getSalesTicketById(id: number): Observable<SalesTicketDTO> {
    return this.http.get<SalesTicketDTO>(`${this.url}/api/sales/${id}`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  /**
   * Obtener ventas por usuario
   */
  getSalesTicketsByUser(userId: number): Observable<SalesTicketDTO[]> {
    return this.http.get<SalesTicketDTO[]>(`${this.url}/api/sales/user/${userId}`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  /**
   * Obtener ventas por estado
   */
  getSalesTicketsByStatus(statusId: number): Observable<SalesTicketDTO[]> {
    return this.http.get<SalesTicketDTO[]>(`${this.url}/api/sales/status/${statusId}`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  /**
   * Obtener ventas por rango de fechas
   */
  getSalesTicketsByDateRange(startDate: string, endDate: string): Observable<SalesTicketDTO[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<SalesTicketDTO[]>(`${this.url}/api/sales/date-range`, { params })
      .pipe(catchError(this.handleError.bind(this)));
  }

  /**
   * Obtener ventas con entrega a domicilio
   */
  getDeliverySalesTickets(): Observable<SalesTicketDTO[]> {
    return this.http.get<SalesTicketDTO[]>(`${this.url}/api/sales/delivery`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  // ==================== MODIFICACIONES ====================

  /**
   * Crear nueva venta
   */
  createSales(salesTicketData: SalesTicket): Observable<SalesTicketResponse> {
    console.log('SalesTicketService - Creando ticket:', salesTicketData);
    console.log('SalesTicketService - URL:', `${this.url}/api/sales`);
    
    // Verificar token antes de enviar
    const token = localStorage.getItem('jwt_token');
    console.log('SalesTicketService - Token presente:', !!token);
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('SalesTicketService - Token payload:', payload);
        console.log('SalesTicketService - Token subject:', payload.sub);
        console.log('SalesTicketService - Token expiración:', payload.exp ? new Date(payload.exp * 1000) : 'No disponible');
      } catch (error) {
        console.error('SalesTicketService - Error decodificando token:', error);
      }
    } else {
      console.warn('SalesTicketService - No hay token JWT disponible');
    }
    
    return this.http.post<SalesTicketResponse>(`${this.url}/api/sales`, salesTicketData)
      .pipe(catchError(this.handleError.bind(this)));
  }

  /**
   * Actualizar venta existente
   */
  updateSales(id: number, salesTicketData: SalesTicket): Observable<SalesTicketResponse> {
    console.log('SalesTicketService - Actualizando ticket:', id, salesTicketData);
    console.log('SalesTicketService - URL:', `${this.url}/api/sales/${id}`);
    
    return this.http.put<SalesTicketResponse>(`${this.url}/api/sales/${id}`, salesTicketData)
      .pipe(catchError(this.handleError.bind(this)));
  }

  /**
   * Obtener venta por ID
   */
  getSalesById(id: number): Observable<SalesTicketDTO> {
    console.log('SalesTicketService - Obteniendo ticket por ID:', id);
    console.log('SalesTicketService - URL:', `${this.url}/api/sales/${id}`);
    
    return this.http.get<SalesTicketDTO>(`${this.url}/api/sales/${id}`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  /**
   * Eliminación lógica de venta
   */
  logicalDeleteSalesTicket(id: number): Observable<any> {
    return this.http.delete(`${this.url}/api/sales/logical/${id}`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  /**
   * Eliminación física de venta
   */
  deleteSalesTicket(id: number): Observable<any> {
    return this.http.delete(`${this.url}/api/sales/${id}`)
      .pipe(catchError(this.handleError.bind(this)));
  }

  /**
   * Restaurar venta eliminada lógicamente
   */
  restoreSalesTicket(id: number): Observable<any> {
    return this.http.put(`${this.url}/api/sales/restore/${id}`, {})
      .pipe(catchError(this.handleError.bind(this)));
  }

  // ==================== UTILIDADES ====================

  /**
   * Formatear fecha para el backend
   */
  formatDateForBackend(date: Date | string): string | null {
    if (!date) return null;
    return new Date(date).toISOString();
  }

  /**
   * Formatear fecha para mostrar
   */
  formatDateForDisplay(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Formatear moneda
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  }

  /**
   * Validar datos de venta
   */
  validateSalesTicketData(data: SalesTicket): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.totalPayment || data.totalPayment <= 0) {
      errors.push('El total de pago debe ser mayor a 0');
    }

    if (!data.userId) {
      errors.push('El ID de usuario es requerido');
    }

    if (!data.idTypeState) {
      errors.push('El estado de la orden es requerido');
    }

    if (!data.idPaymentType) {
      errors.push('El tipo de pago es requerido');
    }

    if (data.delivery === 'SI' && !data.deliveryAddress) {
      errors.push('La dirección de entrega es requerida para entregas a domicilio');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Aplicar filtros a las ventas
   */
  applyFilters(filters: SalesTicketFilters): Observable<SalesTicketDTO[]> {
    if (filters.startDate && filters.endDate) {
      return this.getSalesTicketsByDateRange(filters.startDate, filters.endDate);
    } else if (filters.userId) {
      return this.getSalesTicketsByUser(filters.userId);
    } else if (filters.delivery === 'SI') {
      return this.getDeliverySalesTickets();
    } else if (filters.status) {
      return this.getSalesTicketsByStatus(parseInt(filters.status));
    } else {
      return this.getActiveSalesTickets();
    }
  }

  /**
   * Descargar reporte de ventas en PDF
   * @param ticketId ID opcional de la venta específica. Si no se proporciona, genera reporte de todas las ventas
   */
  downloadSalesReport(ticketId?: number): Observable<Blob> {
    let url = `${this.url}/api/sales/report`;
    
    console.log('SalesTicketService - Descargando reporte de ventas');
    console.log('SalesTicketService - URL:', url);
    console.log('SalesTicketService - TicketId:', ticketId || 'Todas las ventas');
    
    // Verificar token antes de enviar
    const token = localStorage.getItem('jwt_token');
    console.log('SalesTicketService - Token presente:', !!token);
    
    if (ticketId) {
      const params = new HttpParams().set('ticketId', ticketId.toString());
      console.log('SalesTicketService - Parámetros:', { ticketId });
      return this.http.get(url, {
        params: params,
        responseType: 'blob'
      }).pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error descargando reporte de venta:', error);
          console.error('Status:', error.status);
          console.error('Status Text:', error.statusText);
          console.error('Error Message:', error.message);
          return throwError(() => new Error('Error al descargar el reporte de venta'));
        })
      );
    }
    
    return this.http.get(url, {
      responseType: 'blob'
    }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error descargando reporte de ventas:', error);
        console.error('Status:', error.status);
        console.error('Status Text:', error.statusText);
        console.error('Error Message:', error.message);
        return throwError(() => new Error('Error al descargar el reporte de ventas'));
      })
    );
  }
}
