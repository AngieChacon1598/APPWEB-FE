import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SalesTicketService } from '../../../core/services/salesticket.service';
import { AuthService } from '../../../core/services/auth.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { SalesTicketDTO } from '../../../core/models/salesticket.models';
import { RestaurantUser } from '../../../core/models/usuario.models';

@Component({
  selector: 'app-sales-ticket-details',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 bg-white min-h-screen">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              Detalles del Ticket #{{ ticket?.ticketId }}
            </h1>
            <p class="text-gray-600 mt-1">
              Fecha: {{ formatDateSafe(ticket?.saleDate) }}
            </p>
          </div>
          <div class="flex gap-2">
            <button 
              (click)="goBack()"
              class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              ← Volver
            </button>
            <button 
              *ngIf="!isCliente"
              (click)="editTicket()"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              ✏️ Editar
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="bg-white rounded-lg shadow p-8 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Cargando detalles del ticket...</p>
      </div>

      <!-- Error -->
      <div *ngIf="error && !loading" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p class="mb-2">Error: {{ error }}</p>
        <button (click)="loadTicket()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors">
          Reintentar
        </button>
      </div>

      <!-- Ticket Details -->
      <div *ngIf="ticket && !loading && !error" class="space-y-6">
        <!-- Información General -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">📋 Información General</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">ID del Ticket</label>
              <p class="text-lg font-semibold text-gray-900">#{{ ticket.ticketId }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Fecha de Venta</label>
              <p class="text-gray-900">{{ formatDateSafe(ticket?.saleDate) }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Total</label>
              <p class="text-xl font-bold text-green-600">{{ formatCurrency(ticket.totalPayment) }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Estado</label>
              <span [class]="'inline-flex px-3 py-1 text-sm font-semibold rounded-full ' + getStatusBadgeClass(ticket.state)">
                {{ getStatusText(ticket.state) }}
              </span>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Entrega</label>
              <span [class]="'inline-flex px-3 py-1 text-sm font-semibold rounded-full ' + getDeliveryBadgeClass(ticket.delivery)">
                {{ getDeliveryText(ticket.delivery) }}
              </span>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Tipo de Pago</label>
              <p class="text-gray-900">{{ ticket.paymentType }}</p>
            </div>
          </div>
        </div>

        <!-- Información del Usuario -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">👤 Información del Usuario</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">ID Usuario</label>
              <p class="text-gray-900">{{ ticket.userId }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Nombre de Usuario</label>
              <p class="text-gray-900">
                <span *ngIf="loadingUserName" class="text-gray-500">Cargando...</span>
                <span *ngIf="!loadingUserName">{{ getUserDisplayName() }}</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Información de Entrega -->
        <div *ngIf="ticket.delivery === 'SI'" class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">🚚 Información de Entrega</h2>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Dirección de Entrega</label>
            <p class="text-gray-900 bg-gray-50 p-3 rounded-md">
              {{ ticket.deliveryAddress || 'No especificada' }}
            </p>
          </div>
        </div>

        <!-- Notas -->
        <div *ngIf="ticket.note" class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">📝 Notas</h2>
          <p class="text-gray-900 bg-gray-50 p-3 rounded-md">
            {{ ticket.note }}
          </p>
        </div>

        <!-- Productos -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">🛒 Productos</h2>
          <div *ngIf="ticket.productDetails && ticket.productDetails.length > 0" class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-800">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Producto</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Precio Unitario</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Cantidad</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Subtotal</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let product of ticket.productDetails" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div class="text-sm font-medium text-gray-900">{{ product.menuName }}</div>
                      <div class="text-sm text-gray-500">ID: {{ product.menuId }}</div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatCurrency(product.menuPrice) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ product.amount }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    {{ formatCurrency(product.menuPrice * product.amount) }}
                  </td>
                </tr>
              </tbody>
              <tfoot class="bg-gray-100">
                <tr>
                  <td colspan="3" class="px-6 py-4 text-right text-sm font-medium text-gray-900">
                    Total:
                  </td>
                  <td class="px-6 py-4 text-sm font-bold text-green-600">
                    {{ formatCurrency(ticket.totalPayment) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div *ngIf="!ticket.productDetails || ticket.productDetails.length === 0" class="text-center text-gray-500 py-8">
            <p>No hay productos asociados a este ticket</p>
          </div>
        </div>

        <!-- Acciones - Solo visible para ADMIN y EMPLEADO -->
        <div *ngIf="!isCliente" class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">⚙️ Acciones</h2>
          <div class="flex flex-wrap gap-2">
            <button 
              (click)="editTicket()"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              ✏️ Editar Ticket
            </button>
            <button 
              *ngIf="canDelete()"
              (click)="deleteTicket(true)"
              class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              🗑️ Eliminar Lógicamente
            </button>
            <button 
              *ngIf="canRestore()"
              (click)="restoreTicket()"
              class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              ♻️ Restaurar Ticket
            </button>
            <button 
              (click)="deleteTicket(false)"
              class="bg-red-800 hover:bg-red-900 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              ⚠️ Eliminar Permanentemente
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class SalesTicketDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private salesTicketService = inject(SalesTicketService);
  private authService = inject(AuthService);
  private usuarioService = inject(UsuarioService);

  ticket: SalesTicketDTO | null = null;
  loading = false;
  error = '';
  isCliente: boolean = false;
  userName: string = '';
  loadingUserName: boolean = false;

  ngOnInit(): void {
    this.checkUserRole();
    this.loadTicket();
  }

  checkUserRole(): void {
    const currentUser = this.authService.getCurrentUser();
    const userRole = currentUser?.role || localStorage.getItem('user_role');
    this.isCliente = userRole === 'CLIENTE';
  }

  loadUserName(userId: number): void {
    this.loadingUserName = true;
    this.usuarioService.getUserById(userId).subscribe({
      next: (user: RestaurantUser) => {
        // Intentar obtener el userName, si no está disponible, usar names y lastName
        if (user.userName) {
          this.userName = user.userName;
        } else if (user.names || user.lastName) {
          const names = (user.names || '').trim();
          const lastName = (user.lastName || '').trim();
          this.userName = [names, lastName].filter(Boolean).join(' ') || 'No disponible';
        } else {
          this.userName = 'No disponible';
        }
        this.loadingUserName = false;
      },
      error: (error) => {
        console.error(`Error cargando usuario ${userId}:`, error);
        this.userName = 'No disponible';
        this.loadingUserName = false;
      }
    });
  }

  loadTicket(): void {
    this.loading = true;
    this.error = '';
    
    const ticketId = this.route.snapshot.paramMap.get('id');
    if (!ticketId) {
      this.error = 'ID de ticket no válido';
      this.loading = false;
      return;
    }

    this.salesTicketService.getSalesTicketById(+ticketId).subscribe({
      next: (ticket) => {
        this.ticket = ticket;
        this.loading = false;
        
        // Si el ticket no tiene userName, cargarlo del servicio de usuarios
        if (!ticket.userName && ticket.userId) {
          this.loadUserName(ticket.userId);
        } else if (ticket.userName) {
          this.userName = ticket.userName;
        }
      },
      error: (error) => {
        console.error('Error cargando ticket:', error);
        this.error = 'Error al cargar los detalles del ticket';
        this.loading = false;
      }
    });
  }

  goBack(): void {
    // Si es CLIENTE, volver a mis-compras, sino a salesticket
    if (this.isCliente) {
      this.router.navigate(['/mis-compras']);
    } else {
      this.router.navigate(['/salesticket']);
    }
  }

  editTicket(): void {
    if (this.ticket) {
      this.router.navigate(['/salesticket', this.ticket.ticketId, 'edit']);
    }
  }

  deleteTicket(logical: boolean): void {
    if (!this.ticket) return;
    
    const action = logical ? 'eliminar lógicamente' : 'eliminar permanentemente';
    if (!confirm(`¿Estás seguro de que quieres ${action} este ticket?`)) {
      return;
    }

    if (logical) {
      this.salesTicketService.logicalDeleteSalesTicket(this.ticket.ticketId).subscribe({
        next: () => {
          alert('Ticket eliminado lógicamente');
          this.goBack();
        },
        error: (error) => {
          console.error('Error eliminando ticket:', error);
          alert('Error al eliminar ticket');
        }
      });
    } else {
      this.salesTicketService.deleteSalesTicket(this.ticket.ticketId).subscribe({
        next: () => {
          alert('Ticket eliminado permanentemente');
          this.goBack();
        },
        error: (error) => {
          console.error('Error eliminando ticket:', error);
          alert('Error al eliminar ticket');
        }
      });
    }
  }

  restoreTicket(): void {
    if (!this.ticket) return;
    
    if (!confirm('¿Estás seguro de que quieres restaurar este ticket?')) {
      return;
    }

    this.salesTicketService.restoreSalesTicket(this.ticket.ticketId).subscribe({
      next: () => {
        alert('Ticket restaurado exitosamente');
        this.loadTicket(); // Recargar para mostrar el estado actualizado
      },
      error: (error) => {
        console.error('Error restaurando ticket:', error);
        alert('Error al restaurar ticket');
      }
    });
  }

  // Métodos de utilidad
  formatDate(dateString: string): string {
    return this.salesTicketService.formatDateForDisplay(dateString);
  }

  formatDateSafe(dateString: string | undefined): string {
    return dateString ? this.formatDate(dateString) : 'N/A';
  }

  formatCurrency(amount: number): string {
    return this.salesTicketService.formatCurrency(amount);
  }

  getStatusBadgeClass(state: string): string {
    return state === 'A' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700';
  }

  getDeliveryBadgeClass(delivery: string): string {
    return delivery === 'SI' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700';
  }

  getStatusText(state: string): string {
    return state === 'A' ? 'Activo' : 'Inactivo';
  }

  getDeliveryText(delivery: string): string {
    return delivery === 'SI' ? 'Sí' : 'No';
  }

  canDelete(): boolean {
    return this.ticket?.state === 'A';
  }

  canRestore(): boolean {
    return this.ticket?.state === 'I';
  }

  getUserDisplayName(): string {
    // Prioridad 1: userName del ticket (si viene del backend)
    if (this.ticket?.userName) {
      return this.ticket.userName;
    }
    // Prioridad 2: userName cargado del servicio de usuarios
    if (this.userName) {
      return this.userName;
    }
    // Fallback: mostrar "No disponible"
    return 'No disponible';
  }
}
