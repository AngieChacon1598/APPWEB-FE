import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservasService } from '../../core/services/reservas.service';
import { AuthService } from '../../core/services/auth.service';
import { ReservacionResponse } from '../../core/models/reservacionesUsuario.models';
import { ReservacionDetalleResponse } from '../../core/models/reservasDetalle.models';

@Component({
  selector: 'app-reservaciones-usuario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservaciones-usuario.html',
  styleUrls: ['./reservaciones-usuario.scss']
})
export class ReservacionesUsuario implements OnInit {
  reservations: ReservacionResponse[] = [];
  loading = false;
  error: string | null = null;
  // Detalle modal
  showDetailModal = false;
  detailLoading = false;
  detailItems: ReservacionDetalleResponse[] = [];
  selectedReservationName: string | null = null;
  selectedReservationId: number | null = null;

  constructor(
    private readonly reservasService: ReservasService,
    private readonly authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadReservations();
  }

  viewDetalle(res: ReservacionResponse) {
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

  closeDetailModal() {
    this.showDetailModal = false;
    this.detailItems = [];
    this.selectedReservationId = null;
    this.selectedReservationName = null;
    this.detailLoading = false;
  }

  formatDateBackendToDdMmYyyy(dateStr?: string | null): string {
    if (!dateStr) return '';
    // Expecting yyyy-MM-dd or ISO prefix
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  private loadReservations(): void {
    this.error = null;
    this.loading = true;

    // Obtener el ID del usuario - usar getIdUser() que es más confiable
    let userId: number | null = null;
    const storedIdUser = this.authService.getIdUser();
    
    if (storedIdUser) {
      const parsedId = parseInt(storedIdUser, 10);
      if (!isNaN(parsedId)) {
        userId = parsedId;
      }
    }
    
    // Si no se obtuvo de localStorage, intentar desde currentUser (pero validar que sea número)
    if (!userId) {
      const current = this.authService.getCurrentUser();
      if (current?.id && typeof current.id === 'number') {
        userId = current.id;
      } else if (current?.id && typeof current.id === 'string') {
        // Si es string, intentar convertir a número
        const parsed = parseInt(current.id, 10);
        if (!isNaN(parsed)) {
          userId = parsed;
        }
      }
    }

    if (!userId) {
      this.loading = false;
      this.error = 'No se pudo obtener el id de usuario. Por favor inicie sesión nuevamente.';
      return;
    }

    this.reservasService.getReservacionesUsuario(userId).subscribe({
      next: (res) => {
        // Preserve the order returned by the backend (do not reorder here)
        this.reservations = res || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando reservaciones de usuario', err);
        this.error = err?.message || 'Error cargando reservaciones';
        this.loading = false;
      }
    });
  }

  refresh(): void {
    this.loadReservations();
  }

  cancelarReserva(id?: number | null): void {
    if (!id) return;
    if (!confirm('¿Deseas cancelar la reservación #' + id + '?')) return;
    this.reservasService.cancelarReservacion(id).subscribe({
      next: (res) => {
        alert(res);
        this.loadReservations();
      },
      error: (err) => {
        console.error('Error cancelando reservación', err);
        alert('No se pudo cancelar la reservación');
      }
    });
  }

  getStatusClass(estado: string | undefined): string {
    if (!estado) return 'bg-gray-200 text-gray-800';
    const s = estado.toLowerCase();
    if (s.includes('confirm')) return 'bg-green-100 text-green-800';
    if (s.includes('pend') || s.includes('wait')) return 'bg-yellow-100 text-yellow-800';
    if (s.includes('cancel') || s.includes('cance')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  }

  /**
   * Devuelve prioridad numérica para ordenar estados.
   * Prioridad menor = aparece antes.
   */
  getStatusPriority(estado: string | undefined): number {
    if (!estado) return 99;
    const s = estado.toLowerCase();
    if (s.includes('confirm') || s.includes('confirmado') || s.includes('confirmada') || s.includes('completed')) return 1;
    if (s.includes('activo') || s.includes('active')) return 2;
    if (s.includes('reserv') || s.includes('reserva') || s.includes('reserved')) return 3;
    if (s.includes('pend') || s.includes('wait') || s.includes('pendiente')) return 4;
    if (s.includes('cancel') || s.includes('cance')) return 5;
    return 50;
  }

  /**
   * Devuelve la clase de acento (color) para la barra izquierda según el estado.
   * Separado para evitar expresiones complejas en la plantilla.
   */
  getAccentClass(estado: string | undefined): string {
    if (!estado) return 'bg-gray-200';
    const s = estado.toLowerCase();
    if (s.includes('confirm')) return 'bg-green-200';
    if (s.includes('pend') || s.includes('wait')) return 'bg-yellow-200';
    if (s.includes('cancel') || s.includes('cance')) return 'bg-red-200';
    return 'bg-gray-200';
  }
}
