import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservasService } from '../../../core/services/reservas.service';
import { Subscription } from 'rxjs';
import { ReservacionResponse } from '../../../core/models/reservacionesUsuario.models';
import { ReservacionDetalleResponse } from '../../../core/models/reservasDetalle.models';
import { Colores } from "../../../core/directives/colores";
import jsPDF from 'jspdf';

@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule, Colores],
  templateUrl: './reservas.html',
  styleUrls: ['./reservas.scss']
})
export class Reservas implements OnInit, OnDestroy {
  estadoFilter = '';
  reservas: ReservacionResponse[] = [];
  // filteredReservas is the array after applying local filters (search by name)
  filteredReservas: ReservacionResponse[] = [];
  displayedReservas: ReservacionResponse[] = [];
  // search
  searchTerm = '';
  loading = false;

  // detalle modal
  showDetailModal = false;
  detailLoading = false;
  detailItems: ReservacionDetalleResponse[] = [];
  selectedReservationName: string | null = null;
  selectedReservationId: number | null = null;

  // PDF loading
  pdfLoading = false;

  // pagination
  // make default page size bigger so table looks fuller
  pageSize = 10;
  currentPage = 1;
  totalPages = 1;

  private sub: Subscription | null = null;

  constructor(private readonly reservasService: ReservasService) { }

  ngOnInit(): void {
    this.loadReservas();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private updateDisplayed(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    this.displayedReservas = this.reservas.slice(start, start + this.pageSize);
  }

  loadReservas(): void {
    this.loading = true;
    this.sub?.unsubscribe();
    this.sub = this.reservasService.listarReservaciones(this.estadoFilter).subscribe({
      next: (res) => {
        this.reservas = res || [];
        // apply local filters (search by name) and pagination
        this.applyLocalFilters();
        this.loading = false;
      },
      error: () => {
        this.reservas = [];
        this.filteredReservas = [];
        this.displayedReservas = [];
        this.loading = false;
      }
    });
  }

  applyFilter(): void {
    this.loadReservas();
  }

  /**
   * Apply client-side filters (search by name) on the reservations already loaded
   */
  applyLocalFilters(): void {
    const term = (this.searchTerm || '').trim().toLowerCase();
    if (term) {
      this.filteredReservas = this.reservas.filter(r => (r.namereservation || '').toLowerCase().includes(term));
    } else {
      this.filteredReservas = [...this.reservas];
    }

    this.totalPages = Math.max(1, Math.ceil(this.filteredReservas.length / this.pageSize));
    this.currentPage = 1;
    this.updateDisplayedFromFiltered();
  }

  updateDisplayedFromFiltered(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    this.displayedReservas = this.filteredReservas.slice(start, start + this.pageSize);
  }

  changePage(page: number): void {
    if (page < 1) page = 1;
    if (page > this.totalPages) page = this.totalPages;
    this.currentPage = page;
    this.updateDisplayedFromFiltered();
  }

  prevPage(): void {
    this.changePage(this.currentPage - 1);
  }

  nextPage(): void {
    this.changePage(this.currentPage + 1);
  }

  setPageSize(size: number): void {
    this.pageSize = Math.max(1, Math.floor(size));
    this.totalPages = Math.max(1, Math.ceil(this.reservas.length / this.pageSize));
    this.changePage(1);
  }

  get startIndex(): number {
    return this.reservas.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.reservas.length);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  aprobar(id: number): void {
    if (!confirm('¿Confirmar aprobación de la reserva #' + id + '?')) return;
    this.reservasService.aprobarReservacion(id).subscribe({
      next: (res) => {
        alert(res);
        this.loadReservas();
      },
      error: (err) => alert('Error: ' + (err?.message || err))
    });
  }

  cancelar(id: number): void {
    if (!confirm('¿Confirmar cancelación de la reserva #' + id + '?')) return;
    this.reservasService.cancelarReservacion(id).subscribe({
      next: (res) => {
        alert(res);
        this.loadReservas();
      },
      error: (err) => alert('Error: ' + (err?.message || err))
    });
  }

  /********** Detalle modal methods **********/
  viewDetalle(res: ReservacionResponse | null): void {
    this.selectedReservationId = res?.idReservacion ?? null;
    this.selectedReservationName = res?.namereservation ?? null;
    this.showDetailModal = true;
    this.detailLoading = true;
    this.detailItems = [];

    if (!this.selectedReservationId) {
      this.detailLoading = false;
      return;
    }

    this.reservasService.getReservacionesDetalle(this.selectedReservationId).subscribe({
      next: (items) => {
        this.detailItems = Array.isArray(items) ? items : [];
        this.detailLoading = false;
      },
      error: (err) => {
        console.error('Error cargando detalle de reservación', err);
        this.detailItems = [];
        this.detailLoading = false;
      }
    });


  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.detailItems = [];
    this.selectedReservationId = null;
    this.selectedReservationName = null;
    this.detailLoading = false;
  }

  formatDateBackendToDdMmYyyy(dateStr?: string | null): string {
    if (!dateStr) return '';
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  async descargarPDF(): Promise<void> {
    try {
      this.pdfLoading = true;

      // Pequeño delay para que se muestre la pantalla de carga
      await new Promise(resolve => setTimeout(resolve, 100));

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();

      // Primera página: Resumen
      this.generarResumenReservas(pdf, pageWidth, pageHeight);

      // Segunda página: Detalles
      pdf.addPage();
      await this.generarDetallesReservas(pdf, pageWidth, pageHeight);

      // Descargar el PDF
      pdf.save('reservas_reporte.pdf');

      this.pdfLoading = false;
    } catch (error) {
      console.error('Error generando PDF:', error);
      this.pdfLoading = false;
      alert('Error al generar el PDF: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  }

  private generarResumenReservas(pdf: jsPDF, pageWidth: number, pageHeight: number): void {
    const margin = 15;
    const lineHeight = 7;
    let yPosition = 20;

    // Título
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('REPORTE DE RESERVAS', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Fecha del reporte
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const fechaReporte = new Date().toLocaleDateString('es-ES');
    pdf.text(`Fecha: ${fechaReporte}`, margin, yPosition);
    pdf.text(`Total de reservas: ${this.reservas.length}`, margin, yPosition + 7);
    yPosition += 20;

    // Tabla de resumen de reservas
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('LISTADO DE RESERVAS:', margin, yPosition);
    yPosition += 10;

    // Encabezados
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    const headers = ['ID', 'Nombre', 'Estado', 'Fecha'];
    const colWidths = [15, 40, 30, 35];
    let xPos = margin;

    for (let i = 0; i < headers.length; i++) {
      pdf.text(headers[i], xPos, yPosition);
      xPos += colWidths[i];
    }

    pdf.setDrawColor(100);
    pdf.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2);
    yPosition += 8;

    // Datos
    pdf.setFont('helvetica', 'normal');
    for (const reserva of this.reservas) {
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20;
      }

      const row = [
        reserva.idReservacion?.toString() || '',
        reserva.namereservation || '',
        reserva.estado || '',
        this.formatDateBackendToDdMmYyyy(reserva.fechaCreacion) || ''
      ];

      xPos = margin;
      for (let i = 0; i < row.length; i++) {
        let text = row[i];
        if (text.length > 20) text = text.substring(0, 17) + '...';
        pdf.text(text, xPos, yPosition, { maxWidth: colWidths[i] - 2 });
        xPos += colWidths[i];
      }
      yPosition += lineHeight;
    }
  }

  private async generarDetallesReservas(pdf: jsPDF, pageWidth: number, pageHeight: number): Promise<void> {
    const margin = 15;
    const lineHeight = 7;
    let yPosition = 20;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DETALLES DE RESERVAS:', margin, yPosition);
    yPosition += 15;

    for (const reserva of this.reservas) {
      const detalles = await this.getReservacionDetallesPromise(reserva.idReservacion || 0);

      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }

      // Encabezado de la reserva
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(66, 139, 202);
      pdf.text(`Reserva #${reserva.idReservacion} - ${reserva.namereservation}`, margin, yPosition);
      pdf.setTextColor(0, 0, 0);
      yPosition += 8;

      if (detalles && detalles.length > 0) {
        yPosition = this.generarTablaDetalle(pdf, detalles, yPosition, pageWidth, pageHeight, lineHeight, margin);
      } else {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(150);
        pdf.text('Sin detalles disponibles', margin, yPosition);
        pdf.setTextColor(0);
        yPosition += lineHeight;
      }

      yPosition += 10;
    }
  }

  private generarTablaDetalle(pdf: jsPDF, detalles: ReservacionDetalleResponse[], yPosition: number, pageWidth: number, pageHeight: number, lineHeight: number, margin: number): number {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');

    const detailHeaders = ['Hora', 'Fecha', 'Personas', 'Requerimientos'];
    const detailColWidths = [25, 35, 25, 80];
    let xPos = margin;

    for (let i = 0; i < detailHeaders.length; i++) {
      pdf.text(detailHeaders[i], xPos, yPosition);
      xPos += detailColWidths[i];
    }

    pdf.setDrawColor(200);
    pdf.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2);
    yPosition += 7;

    pdf.setFont('helvetica', 'normal');
    for (const detalle of detalles) {
      if (yPosition > pageHeight - 15) {
        pdf.addPage();
        yPosition = 20;
      }

      const hora = detalle.hourReservation ? detalle.hourReservation.split(':').slice(0, 2).join(':') : '-';
      const fecha = this.formatDateBackendToDdMmYyyy(detalle.dateReservation) || '-';
      const personas = detalle.amountPeople?.toString() || '-';
      const requerimientos = detalle.requirements || '-';

      const detailRow = [hora, fecha, personas, requerimientos];
      xPos = margin;

      for (let i = 0; i < detailRow.length; i++) {
        let text = detailRow[i];
        if (text.length > 30) text = text.substring(0, 27) + '...';
        pdf.text(text, xPos, yPosition, { maxWidth: detailColWidths[i] - 2 });
        xPos += detailColWidths[i];
      }
      yPosition += lineHeight;
    }

    return yPosition;
  }

  private getReservacionDetallesPromise(idReservacion: number): Promise<ReservacionDetalleResponse[]> {
    return new Promise((resolve, reject) => {
      this.reservasService.getReservacionesDetalle(idReservacion).subscribe({
        next: (items) => {
          resolve(Array.isArray(items) ? items : []);
        },
        error: (err) => {
          console.error('Error cargando detalle de reservación', err);
          resolve([]);
        }
      });
    });
  }
}
