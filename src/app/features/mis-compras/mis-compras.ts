import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SalesTicketService } from '../../core/services/salesticket.service';
import { AuthService } from '../../core/services/auth.service';
import { SalesTicketDTO } from '../../core/models/salesticket.models';

@Component({
  selector: 'app-mis-compras',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mis-compras.html',
  styleUrls: ['./mis-compras.scss']
})
export class MisComprasComponent implements OnInit {
  tickets: SalesTicketDTO[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private readonly salesTicketService: SalesTicketService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) { }

  ngOnInit(): void {
    this.loadTickets();
  }

  private loadTickets(): void {
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

    this.salesTicketService.getSalesTicketsByUser(userId).subscribe({
      next: (res) => {
        // Ordenar por fecha más reciente primero
        this.tickets = (res || []).sort((a, b) => {
          const dateA = new Date(a.saleDate).getTime();
          const dateB = new Date(b.saleDate).getTime();
          return dateB - dateA;
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando compras del usuario', err);
        this.error = err?.message || 'Error cargando tus compras';
        this.loading = false;
      }
    });
  }

  refresh(): void {
    this.loadTickets();
  }

  viewDetails(ticketId: number): void {
    this.router.navigate(['/salesticket', ticketId]);
  }

  formatDate(dateStr?: string | null): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }

  formatCurrency(amount: number): string {
    return this.salesTicketService.formatCurrency(amount);
  }

  getStatusClass(state: string | undefined): string {
    if (!state) return 'bg-gray-200 text-gray-800';
    const s = state.toUpperCase();
    if (s === 'A') return 'bg-green-100 text-green-800';
    if (s === 'I') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  }

  getStatusText(state: string | undefined): string {
    if (!state) return 'Desconocido';
    const s = state.toUpperCase();
    if (s === 'A') return 'Activo';
    if (s === 'I') return 'Inactivo';
    return state;
  }

  getDeliveryText(delivery: string | undefined): string {
    if (!delivery) return 'No';
    return delivery.toUpperCase() === 'SI' ? 'Sí' : 'No';
  }

  getDeliveryClass(delivery: string | undefined): string {
    if (!delivery) return 'bg-gray-100 text-gray-800';
    return delivery.toUpperCase() === 'SI' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-gray-100 text-gray-800';
  }
}

