import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SalesTicketService } from '../../../core/services/salesticket.service';
import { AuthService } from '../../../core/services/auth.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { 
  SalesTicketDTO, 
  SalesTicketPage, 
  SalesTicketFilters 
} from '../../../core/models/salesticket.models';
import { RestaurantUser } from '../../../core/models/usuario.models';

@Component({
  selector: 'app-salesticket',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './salesticket.html',
  styleUrl: './salesticket.scss'
})
export class SalesTicketComponent implements OnInit {
  tickets: SalesTicketDTO[] = [];
  loading = false;
  error = '';
  
  // Paginación
  currentPage = 0;
  totalPages = 0;
  totalElements = 0;
  pageSize = 10;
  pageSizeOptions: number[] = [5, 10, 20, 50];
  
  // Hacer Math disponible en el template
  Math = Math;
  
  // Lista original sin filtros para paginación del lado del cliente
  ticketsOriginales: SalesTicketDTO[] = [];
  
  // Lista completa de todos los tickets (antes de aplicar filtros)
  allTicketsBackup: SalesTicketDTO[] = [];
  
  // Bandera para saber si hay filtros activos
  filtersActive: boolean = false;
  
  // Mapa de usuarios para obtener nombres y apellidos
  usersMap: Map<number, { names: string; lastName: string }> = new Map();
  
  // Set para rastrear usuarios que estamos cargando individualmente
  loadingUsersIds: Set<number> = new Set();
  
  // Filtros
  filters: SalesTicketFilters = {
    startDate: '',
    endDate: '',
    delivery: '',
    userName: '',
    minAmount: undefined,
    maxAmount: undefined
  };
  
  // Modo de vista
  viewMode: 'active' | 'all' | 'inactive' | 'paginated' = 'active';
  
  // Configuración de permisos
  currentUser: any = null;
  canManageVentas: boolean = false; // Solo ADMIN y EMPLEADO pueden gestionar ventas
  isCliente: boolean = false;
  
  // Modal de detalles
  showDetailsModal: boolean = false;
  selectedTicket: SalesTicketDTO | null = null;
  loadingTicketDetails: boolean = false;
  
  // Configuración de tabla
  tableColumns = [
    { field: 'ticketId', header: 'ID' },
    { field: 'saleDate', header: 'Fecha' },
    { field: 'userName', header: 'Usuario' },
    { field: 'note', header: 'Notas' },
    { field: 'paymentType', header: 'Pago' },
    { field: 'totalPayment', header: 'Total' },
    { field: 'delivery', header: 'Entrega' },
    { field: 'state', header: 'Estado' }
  ];

  constructor(
    private salesTicketService: SalesTicketService,
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('Inicializando componente SalesTicket...');
    console.log('Token disponible:', !!localStorage.getItem('jwt_token'));
    this.loadCurrentUser();
    this.loadUsers();
    this.loadTickets();
  }

  loadUsers(): void {
    // Cargar todos los usuarios (activos e inactivos) para crear un mapa de IDs a nombres
    // Cargar usuarios activos
    this.usuarioService.getUsersByState('A', { page: 0, size: 10000 }).subscribe({
      next: (response) => {
        const users = response.content || [];
        users.forEach((user: RestaurantUser) => {
          // Limpiar espacios en blanco al inicio y final
          const names = (user.names || '').trim();
          const lastName = (user.lastName || '').trim();
          
          this.usersMap.set(user.idUser, {
            names: names,
            lastName: lastName
          });
        });
        console.log('Usuarios activos cargados en mapa:', users.length);
        
        // También cargar usuarios inactivos para tener el mapa completo
        this.usuarioService.getUsersByState('I', { page: 0, size: 10000 }).subscribe({
          next: (responseInactive) => {
            const usersInactive = responseInactive.content || [];
            usersInactive.forEach((user: RestaurantUser) => {
              const names = (user.names || '').trim();
              const lastName = (user.lastName || '').trim();
              
              // Solo agregar si no existe ya (por si hay algún solapamiento)
              if (!this.usersMap.has(user.idUser)) {
                this.usersMap.set(user.idUser, {
                  names: names,
                  lastName: lastName
                });
              }
            });
            console.log('Usuarios inactivos cargados:', usersInactive.length);
            console.log('Total de usuarios en mapa:', this.usersMap.size);
            console.log('IDs de usuarios cargados:', Array.from(this.usersMap.keys()).sort((a, b) => a - b));
            
            // Después de cargar usuarios, actualizar los tickets si ya están cargados
            // Si hay filtros activos, reaplicarlos para actualizar nombres de usuarios
            if (this.filtersActive) {
              console.log('🔄 Reaplicando filtros después de cargar usuarios');
              this.applyFiltersToLoadedTickets(this.filters);
            } else if (this.ticketsOriginales.length > 0) {
              this.applyClientSidePagination();
            }
          },
          error: (error) => {
            console.error('Error cargando usuarios inactivos:', error);
            // Continuar aunque falle la carga de inactivos
            // Solo actualizar si no hay filtros activos
            if (this.ticketsOriginales.length > 0 && !this.filtersActive) {
              this.applyClientSidePagination();
            } else if (this.filtersActive) {
              // Si hay filtros activos, reaplicarlos
              this.applyFiltersToLoadedTickets(this.filters);
            }
          }
        });
      },
      error: (error) => {
        console.error('Error cargando usuarios activos:', error);
        // Si falla, intentar con el método genérico
        this.usuarioService.getAllUsers({ page: 0, size: 10000 }).subscribe({
          next: (response) => {
            const users = response.content || [];
            users.forEach((user: RestaurantUser) => {
              const names = (user.names || '').trim();
              const lastName = (user.lastName || '').trim();
              this.usersMap.set(user.idUser, { names, lastName });
            });
            console.log('Usuarios cargados con método genérico:', this.usersMap.size);
            if (this.ticketsOriginales.length > 0) {
              this.applyClientSidePagination();
            }
          },
          error: (err) => {
            console.error('Error cargando usuarios con método genérico:', err);
          }
        });
      }
    });
  }

  loadUserById(userId: number): void {
    // Cargar un usuario individual si no está en el mapa
    this.usuarioService.getUserById(userId).subscribe({
      next: (user: RestaurantUser) => {
        const names = (user.names || '').trim();
        const lastName = (user.lastName || '').trim();
        
        this.usersMap.set(user.idUser, {
          names: names,
          lastName: lastName
        });
        console.log(`Usuario ${userId} cargado individualmente: ${names} ${lastName}`);
        
        // Si hay filtros activos, reaplicarlos para actualizar la vista
        if (this.filtersActive) {
          this.applyFiltersToLoadedTickets(this.filters);
        } else {
          // Forzar actualización de la vista
          this.tickets = [...this.tickets];
        }
      },
      error: (error) => {
        console.error(`Error cargando usuario ${userId}:`, error);
        console.log(`El usuario con ID ${userId} no existe en la base de datos`);
        // Marcar en el mapa como "no encontrado" para evitar reintentos
        this.usersMap.set(userId, {
          names: '',
          lastName: ''
        });
        // Remover del set para permitir reintentos si es necesario
        this.loadingUsersIds.delete(userId);
        
        // Si hay filtros activos, reaplicarlos
        if (this.filtersActive) {
          this.applyFiltersToLoadedTickets(this.filters);
        }
      }
    });
  }

  loadCurrentUser() {
    this.authService.currentUser$.subscribe(user => {
      const userRole = user?.role || localStorage.getItem('user_role');
      this.isCliente = userRole === 'CLIENTE';
      this.currentUser = user;
      this.canManageVentas = ['ADMIN', 'EMPLEADO'].includes(user?.role || '');
      console.log('Ventas - Usuario actual:', user);
      console.log('Ventas - Puede gestionar ventas:', this.canManageVentas);
    });
  }

  loadTickets(): void {
    this.loading = true;
    this.error = '';
    console.log('Cargando tickets...');

    switch (this.viewMode) {
      case 'active':
        this.salesTicketService.getActiveSalesTickets().subscribe({
          next: (response: SalesTicketDTO[]) => {
            console.log('Tickets activos recibidos:', response);
            this.allTicketsBackup = response || [];
            // Solo actualizar ticketsOriginales si no hay filtros activos
            if (!this.filtersActive) {
              this.ticketsOriginales = [...this.allTicketsBackup];
              this.totalElements = this.ticketsOriginales.length;
              this.totalPages = Math.ceil(this.totalElements / this.pageSize);
              this.currentPage = 0;
              this.applyClientSidePagination();
            } else {
              // Si hay filtros activos, reaplicarlos con los nuevos datos
              this.applyFiltersToLoadedTickets(this.filters);
            }
            console.log('Tickets cargados:', this.allTicketsBackup.length);
            this.loading = false;
          },
          error: (error: any) => {
            console.error('Error cargando tickets activos:', error);
            this.error = 'Error al cargar tickets de venta';
            this.loading = false;
            this.tickets = [];
          }
        });
        break;
        
      case 'all':
        this.salesTicketService.getAllSalesTickets().subscribe({
          next: (response: SalesTicketDTO[]) => {
            console.log('Todas las tickets recibidas:', response);
            this.allTicketsBackup = response || [];
            // Solo actualizar ticketsOriginales si no hay filtros activos
            if (!this.filtersActive) {
              this.ticketsOriginales = [...this.allTicketsBackup];
              this.totalElements = this.ticketsOriginales.length;
              this.totalPages = Math.ceil(this.totalElements / this.pageSize);
              this.currentPage = 0;
              this.applyClientSidePagination();
            } else {
              // Si hay filtros activos, reaplicarlos con los nuevos datos
              this.applyFiltersToLoadedTickets(this.filters);
            }
            console.log('Tickets cargados:', this.allTicketsBackup.length);
            this.loading = false;
          },
          error: (error: any) => {
            console.error('Error cargando todas las tickets:', error);
            this.error = 'Error al cargar tickets de venta';
            this.loading = false;
            this.tickets = [];
          }
        });
        break;
        
      case 'inactive':
        this.salesTicketService.getInactiveSalesTickets().subscribe({
          next: (response: SalesTicketDTO[]) => {
            console.log('Tickets inactivos recibidos:', response);
            this.allTicketsBackup = response || [];
            // Solo actualizar ticketsOriginales si no hay filtros activos
            if (!this.filtersActive) {
              this.ticketsOriginales = [...this.allTicketsBackup];
              this.totalElements = this.ticketsOriginales.length;
              this.totalPages = Math.ceil(this.totalElements / this.pageSize);
              this.currentPage = 0;
              this.applyClientSidePagination();
            } else {
              // Si hay filtros activos, reaplicarlos con los nuevos datos
              this.applyFiltersToLoadedTickets(this.filters);
            }
            console.log('Tickets cargados:', this.allTicketsBackup.length);
            this.loading = false;
          },
          error: (error: any) => {
            console.error('Error cargando tickets inactivos:', error);
            this.error = 'Error al cargar tickets de venta';
            this.loading = false;
            this.tickets = [];
          }
        });
        break;
        
      case 'paginated':
        this.salesTicketService.getSalesTicketsPaginated(this.currentPage, this.pageSize).subscribe({
          next: (response: SalesTicketPage) => {
            console.log('Tickets paginados recibidos:', response);
            this.tickets = response.content || [];
            this.totalPages = response.totalPages || 0;
            this.totalElements = response.totalElements || 0;
            console.log('Tickets cargados:', this.tickets.length);
            this.loading = false;
          },
          error: (error: any) => {
            console.error('Error cargando tickets paginados:', error);
            this.error = 'Error al cargar tickets de venta';
            this.loading = false;
            this.tickets = [];
          }
        });
        break;
        
      default:
        this.salesTicketService.getActiveSalesTickets().subscribe({
          next: (response: SalesTicketDTO[]) => {
            console.log('Tickets activos recibidos (default):', response);
            this.allTicketsBackup = response || [];
            // Solo actualizar ticketsOriginales si no hay filtros activos
            if (!this.filtersActive) {
              this.ticketsOriginales = [...this.allTicketsBackup];
              this.totalElements = this.ticketsOriginales.length;
              this.totalPages = Math.ceil(this.totalElements / this.pageSize);
              this.currentPage = 0;
              this.applyClientSidePagination();
            } else {
              // Si hay filtros activos, reaplicarlos con los nuevos datos
              this.applyFiltersToLoadedTickets(this.filters);
            }
            console.log('Tickets cargados:', this.allTicketsBackup.length);
            this.loading = false;
          },
          error: (error: any) => {
            console.error('Error cargando tickets activos (default):', error);
            this.error = 'Error al cargar tickets de venta';
            this.loading = false;
            this.tickets = [];
          }
        });
    }
  }

  applyFilters(): void {
    console.log('Aplicando filtros:', this.filters);
    
    // Si no hay datos de backup, primero cargar los tickets
    if (this.allTicketsBackup.length === 0) {
      console.log('No hay datos cargados, cargando tickets primero...');
      const savedFilters = { ...this.filters };
      this.loading = true;
      this.loadTickets();
      // Aplicar filtros después de que se carguen los tickets
      setTimeout(() => {
        // Verificar que los datos se hayan cargado antes de aplicar filtros
        if (this.allTicketsBackup.length > 0) {
          console.log('Datos cargados, aplicando filtros guardados...');
          this.applyFiltersToLoadedTickets(savedFilters);
        }
      }, 600);
      return;
    }

    // Si ya hay datos cargados, aplicar filtros directamente SIN recargar
    console.log('Aplicando filtros a datos ya cargados (sin recargar)');
    this.applyFiltersToLoadedTickets(this.filters);
  }

  applyFiltersToLoadedTickets(filtersToApply: SalesTicketFilters = this.filters): void {
    this.loading = true;
    this.error = '';
    
    // Usar la lista completa de backup para aplicar filtros
    let filteredTickets = [...this.allTicketsBackup];

    // Filtro por fecha
    if (filtersToApply.startDate) {
      filteredTickets = filteredTickets.filter(ticket => {
        const ticketDate = new Date(ticket.saleDate);
        const startDate = new Date(filtersToApply.startDate!);
        return ticketDate >= startDate;
      });
    }

    if (filtersToApply.endDate) {
      filteredTickets = filteredTickets.filter(ticket => {
        const ticketDate = new Date(ticket.saleDate);
        const endDate = new Date(filtersToApply.endDate!);
        endDate.setHours(23, 59, 59, 999); // Incluir todo el día
        return ticketDate <= endDate;
      });
    }

    // Filtro por nombre de usuario
    if (filtersToApply.userName && filtersToApply.userName.trim()) {
      const searchName = filtersToApply.userName.toLowerCase().trim();
      filteredTickets = filteredTickets.filter(ticket => {
        const fullName = this.getUserFullName(ticket.userId).toLowerCase();
        return fullName.includes(searchName);
      });
    }

    // Filtro por entrega
    if (filtersToApply.delivery) {
      filteredTickets = filteredTickets.filter(ticket => 
        ticket.delivery === filtersToApply.delivery
      );
    }

    // Filtro por monto mínimo
    if (filtersToApply.minAmount !== undefined && filtersToApply.minAmount !== null) {
      filteredTickets = filteredTickets.filter(ticket => 
        ticket.totalPayment >= filtersToApply.minAmount!
      );
    }

    // Filtro por monto máximo
    if (filtersToApply.maxAmount !== undefined && filtersToApply.maxAmount !== null) {
      filteredTickets = filteredTickets.filter(ticket => 
        ticket.totalPayment <= filtersToApply.maxAmount!
      );
    }

    // Verificar si realmente hay filtros activos
    const hasActiveFilters = !!(filtersToApply.userName || 
                                 filtersToApply.startDate || 
                                 filtersToApply.endDate || 
                                 filtersToApply.delivery || 
                                 filtersToApply.minAmount !== undefined || 
                                 filtersToApply.maxAmount !== undefined);

    this.filtersActive = hasActiveFilters;
    
    this.ticketsOriginales = filteredTickets;
    this.totalElements = filteredTickets.length;
    this.totalPages = Math.ceil(this.totalElements / this.pageSize);
    this.currentPage = 0;
    this.applyClientSidePagination();
    this.loading = false;

    console.log('Filtros aplicados. Tickets encontrados:', filteredTickets.length);
    console.log('Filtros activos:', this.filtersActive);
  }

  clearFilters(): void {
    this.filters = {
      startDate: '',
      endDate: '',
      delivery: '',
      userName: '',
      minAmount: undefined,
      maxAmount: undefined
    };
    // Restaurar la lista original desde el backup
    this.filtersActive = false;
    this.ticketsOriginales = [...this.allTicketsBackup];
    this.totalElements = this.ticketsOriginales.length;
    this.totalPages = Math.ceil(this.totalElements / this.pageSize);
    this.currentPage = 0;
    this.applyClientSidePagination();
    console.log('Filtros limpiados, mostrando todos los tickets');
  }

  onViewModeChange(mode: 'active' | 'all' | 'inactive' | 'paginated'): void {
    this.viewMode = mode;
    this.currentPage = 0;
    // Limpiar filtros al cambiar el modo de vista
    this.filtersActive = false;
    this.loadTickets();
  }

  onPageChange(page: number): void {
    if (this.viewMode === 'paginated') {
      this.currentPage = page;
      this.loadTickets();
    } else {
      // Paginación del lado del cliente para otros modos
      this.currentPage = page;
      this.applyClientSidePagination();
    }
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 0; // Resetear a la primera página
    if (this.viewMode === 'paginated') {
      this.loadTickets();
    } else {
      this.applyClientSidePagination();
    }
  }

  onPageSizeChangeEvent(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const size = parseInt(target.value) || 10;
    this.onPageSizeChange(size);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const startPage = Math.max(0, this.currentPage - 2);
    const endPage = Math.min(this.totalPages - 1, this.currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  goToFirstPage(): void {
    this.currentPage = 0;
    if (this.viewMode === 'paginated') {
      this.loadTickets();
    } else {
      this.applyClientSidePagination();
    }
  }

  goToLastPage(): void {
    this.currentPage = this.totalPages - 1;
    if (this.viewMode === 'paginated') {
      this.loadTickets();
    } else {
      this.applyClientSidePagination();
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      if (this.viewMode === 'paginated') {
        this.loadTickets();
      } else {
        this.applyClientSidePagination();
      }
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      if (this.viewMode === 'paginated') {
        this.loadTickets();
      } else {
        this.applyClientSidePagination();
      }
    }
  }

  applyClientSidePagination(): void {
    if (this.viewMode !== 'paginated') {
      if (this.ticketsOriginales.length > 0) {
        const startIndex = this.currentPage * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        this.tickets = this.ticketsOriginales.slice(startIndex, endIndex);
        this.totalPages = Math.max(1, Math.ceil(this.ticketsOriginales.length / this.pageSize));
        this.totalElements = this.ticketsOriginales.length;
      } else {
        this.tickets = [];
        this.totalPages = 0;
        this.totalElements = 0;
      }
    }
  }

  onDelete(ticketId: number, logical: boolean = true): void {
    const action = logical ? 'eliminar' : 'eliminar permanentemente';
    if (!confirm(`¿Estás seguro de que quieres ${action} este ticket?`)) {
      return;
    }

    // Guardar estado de filtros antes de recargar
    const shouldMaintainFilters = this.filtersActive;
    const currentFilters = shouldMaintainFilters ? { ...this.filters } : null;

    if (logical) {
      this.salesTicketService.logicalDeleteSalesTicket(ticketId).subscribe({
        next: () => {
          alert('Ticket eliminado lógicamente');
          this.loadTickets();
          // Si había filtros activos, reaplicarlos después de recargar
          if (shouldMaintainFilters && currentFilters) {
            setTimeout(() => {
              this.applyFiltersToLoadedTickets(currentFilters);
            }, 300);
          }
        },
        error: (error: any) => {
          console.error('Error eliminando ticket:', error);
          alert('Error al eliminar ticket');
        }
      });
    } else {
      this.salesTicketService.deleteSalesTicket(ticketId).subscribe({
        next: () => {
          alert('Ticket eliminado permanentemente');
          this.loadTickets();
          // Si había filtros activos, reaplicarlos después de recargar
          if (shouldMaintainFilters && currentFilters) {
            setTimeout(() => {
              this.applyFiltersToLoadedTickets(currentFilters);
            }, 300);
          }
        },
        error: (error: any) => {
          console.error('Error eliminando ticket:', error);
          alert('Error al eliminar ticket');
        }
      });
    }
  }

  onRestore(ticketId: number): void {
    if (!confirm('¿Estás seguro de que quieres restaurar este ticket?')) {
      return;
    }

    // Guardar estado de filtros antes de recargar
    const shouldMaintainFilters = this.filtersActive;
    const currentFilters = shouldMaintainFilters ? { ...this.filters } : null;

    this.salesTicketService.restoreSalesTicket(ticketId).subscribe({
      next: () => {
        alert('Ticket restaurado exitosamente');
        this.loadTickets();
        // Si había filtros activos, reaplicarlos después de recargar
        if (shouldMaintainFilters && currentFilters) {
          setTimeout(() => {
            this.applyFiltersToLoadedTickets(currentFilters);
          }, 300);
        }
      },
      error: (error: any) => {
        console.error('Error restaurando ticket:', error);
        alert('Error al restaurar ticket');
      }
    });
  }

  // Métodos de utilidad
  formatDate(dateString: string): string {
    return this.salesTicketService.formatDateForDisplay(dateString);
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

  getViewModeText(): string {
    switch (this.viewMode) {
      case 'active': return 'Activas';
      case 'all': return 'Todas';
      case 'inactive': return 'Inactivas';
      case 'paginated': return 'Paginadas';
      default: return 'Activas';
    }
  }

  canDelete(ticket: SalesTicketDTO): boolean {
    return ticket.state === 'A';
  }

  canRestore(ticket: SalesTicketDTO): boolean {
    return ticket.state === 'I';
  }

  getCurrentUser(): any {
    return this.authService.getCurrentUser();
  }

  getUserFullName(userId: number): string {
    // Primero intentar obtener del mapa de usuarios
    let userInfo = this.usersMap.get(userId);
    
    if (userInfo) {
      const names = (userInfo.names || '').trim();
      const lastName = (userInfo.lastName || '').trim();
      
      // Si ambos tienen valores, concatenarlos
      if (names && lastName) {
        // Dividir en palabras para detectar duplicados
        const namesWords = names.toLowerCase().split(/\s+/).filter(w => w.length > 0);
        const lastNameWords = lastName.toLowerCase().split(/\s+/).filter(w => w.length > 0);
        
        // Verificar si hay palabras duplicadas entre names y lastName
        const hasDuplicates = namesWords.some(nw => lastNameWords.includes(nw));
        
        if (hasDuplicates) {
          // Si hay duplicados, verificar cuál contiene más información
          // Normalmente el lastName debería tener ambos apellidos completos
          // Si lastName ya contiene todas las palabras de names, solo usar lastName
          const allNamesInLastName = namesWords.every(nw => lastNameWords.includes(nw));
          if (allNamesInLastName && lastNameWords.length >= namesWords.length) {
            return lastName;
          }
          
          // Si names contiene todas las palabras de lastName, usar names
          const allLastNameInNames = lastNameWords.every(lw => namesWords.includes(lw));
          if (allLastNameInNames && namesWords.length >= lastNameWords.length) {
            return names;
          }
          
          // Si hay solapamiento parcial, combinar eliminando duplicados
          const combinedWords = [...namesWords];
          lastNameWords.forEach(lw => {
            if (!combinedWords.includes(lw)) {
              combinedWords.push(lw);
            }
          });
          
          // Reconstruir el string original manteniendo capitalización
          const originalNames = names.split(/\s+/);
          const originalLastName = lastName.split(/\s+/);
          const result: string[] = [];
          
          // Agregar palabras de names
          originalNames.forEach(w => {
            if (w.trim()) result.push(w);
          });
          
          // Agregar palabras de lastName que no estén ya en result
          originalLastName.forEach(lw => {
            const lwLower = lw.toLowerCase();
            if (!result.some(r => r.toLowerCase() === lwLower)) {
              result.push(lw);
            }
          });
          
          return result.join(' ');
        }
        
        // Sin duplicados: concatenar normalmente
        return `${names} ${lastName}`;
      } else if (names) {
        return names;
      } else if (lastName) {
        return lastName;
      }
    }
    
    // Si no está en el mapa, intentar cargarlo individualmente (solo una vez)
    if (!this.loadingUsersIds.has(userId)) {
      this.loadingUsersIds.add(userId);
      this.loadUserById(userId);
    }
    
    // Mientras tanto, intentar usar userName del ticket
    const ticket = this.tickets.find(t => t.userId === userId) || 
                   this.ticketsOriginales.find(t => t.userId === userId);
    if (ticket?.userName) {
      return ticket.userName;
    }
    
    // Fallback: mostrar ID con indicador de que no se encontró
    // El usuario probablemente fue eliminado o nunca existió
    console.warn(`Usuario con ID ${userId} no encontrado en la base de datos`);
    return `Usuario ID: ${userId} (no encontrado)`;
  }

  createNewTicket(): void {
    console.log('Navegando a formulario de creación de ticket');
    this.router.navigate(['/salesticket/new']);
  }

  viewTicket(ticketId: number): void {
    console.log('Abriendo modal de detalles del ticket:', ticketId);
    this.loadingTicketDetails = true;
    this.showDetailsModal = true;
    
    // Buscar el ticket en la lista actual
    const ticket = this.tickets.find(t => t.ticketId === ticketId) || 
                   this.ticketsOriginales.find(t => t.ticketId === ticketId);
    
    if (ticket) {
      // Si el ticket ya está cargado, usarlo directamente
      this.selectedTicket = ticket;
      this.loadingTicketDetails = false;
    } else {
      // Si no está en la lista, cargarlo del servidor
      this.salesTicketService.getSalesTicketById(ticketId).subscribe({
        next: (ticketData) => {
          this.selectedTicket = ticketData;
          this.loadingTicketDetails = false;
        },
        error: (error) => {
          console.error('Error cargando detalles del ticket:', error);
          this.loadingTicketDetails = false;
          this.showDetailsModal = false;
          alert('Error al cargar los detalles del ticket');
        }
      });
    }
  }
  
  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedTicket = null;
  }

  editTicket(ticketId: number): void {
    console.log('Navegando a formulario de edición de ticket:', ticketId);
    this.router.navigate(['/salesticket', ticketId, 'edit']);
  }

  downloadReport(): void {
    console.log('Descargando reporte de ventas...');
    this.salesTicketService.downloadSalesReport().subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const timestamp = Date.now();
        a.download = `reporte_ventas_${timestamp}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        console.log('Reporte descargado exitosamente');
      },
      error: (error: any) => {
        console.error('Error al descargar el reporte:', error);
        alert('Error al descargar el reporte. Por favor, intente nuevamente.');
      }
    });
  }
}
