import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { baseUrl } from '../../../environments/conexion';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${baseUrl.desarrollo}/api/menu/report`;

  /**
   * Genera y descarga el reporte PDF de productos
   * @param stateFilter 1=activos, 0=inactivos, -1=todos
   */
  generateProductosReport(stateFilter: number = -1): Observable<Blob> {
    let params = new HttpParams();
    if (stateFilter !== -1) {
      params = params.set('stateFilter', stateFilter.toString());
    }

    return this.http.get(this.apiUrl, {
      params: params,
      responseType: 'blob',
      headers: new HttpHeaders({
        'Accept': 'application/pdf'
      })
    });
  }


  downloadReport(stateFilter: number = -1): void {
    this.generateProductosReport(stateFilter).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const filterName = stateFilter === 1 ? 'activos' : stateFilter === 0 ? 'inactivos' : 'todos';
        const timestamp = new Date().getTime();
        link.download = `reporte_productos_${filterName}_${timestamp}.pdf`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('❌ ReportService - Error al generar el reporte:', error);
        alert('Error al generar el reporte. Por favor, intente nuevamente.');
      }
    });
  }


  openReportInNewWindow(stateFilter: number = -1): void {
    this.generateProductosReport(stateFilter).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
      },
      error: (error) => {
        console.error('❌ ReportService - Error al generar el reporte:', error);
        alert('Error al generar el reporte. Por favor, intente nuevamente.');
      }
    });
  }
}

