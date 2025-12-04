import { Component, inject, OnInit } from '@angular/core';
import { TablesComponents } from "../../../shared/components/tables-components/tables-components";
import { MesaRestaurante, MesaRestaurantRequest } from '../../../core/models/mesa.models';
import { MesaService } from '../../../core/services/mesa.service';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsComponents } from '../../../shared/components/forms-components/forms-components';

@Component({
  selector: 'app-mesas',
  imports: [TablesComponents, CommonModule, FormsComponents],
  templateUrl: './mesas.html',
  styleUrl: './mesas.scss'
})
export class Mesas implements OnInit {

  private readonly http = inject(MesaService);
  private readonly authService = inject(AuthService);

  mesas: MesaRestaurante[] = [];
  open: boolean = false;
  loading: boolean = false;
  editingMesa: MesaRestaurante | null = null;
  showActiveMesas: boolean = true; // true = activas, false = inactivas
  currentUser: any = null;
  canManagerEdit: boolean = false;
  canManageMesas: boolean = false; // Solo ADMIN puede gestionar mesas

  tituloFormulario: string = 'Crear Mesa';

  campos: { nombre: string; tipo: string; etiqueta: string }[] = [
    { nombre: 'numberTable', tipo: 'number', etiqueta: 'Número de Mesa' },
    { nombre: 'ability', tipo: 'number', etiqueta: 'Capacidad de Personas' },
    { nombre: 'descripcion', tipo: 'text', etiqueta: 'Descripción' },
    { nombre: 'imagen', tipo: 'text', etiqueta: 'URL de Imagen' }
  ];


  columns: { field: string; header: string }[] = [
    { field: 'numberTable', header: 'Número de Mesa' },
    { field: 'ability', header: 'Capacidad' },
    { field: 'description', header: 'Descripción' },
    { field: 'imagenUrl', header: 'Imagen' },
    { field: 'state', header: 'Estado' }
  ];

  ngOnInit(): void {
    this.loadCurrentUser();
    this.getMesas();
  }

  loadCurrentUser() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.canManageMesas = user?.role === 'ADMIN';
      console.log('🔐 Mesas - Usuario actual:', user);
      console.log('🔐 Mesas - Puede gestionar mesas:', this.canManageMesas);
    });
  }

  getMesas() {
    this.loading = true;

    // Usar el endpoint específico según el estado
    const estado = this.showActiveMesas ? 'A' : 'I';

    this.http.getMesasByState(estado).subscribe({
      next: (response) => {
        console.log('🔍 Respuesta del endpoint de mesas:', response);
        console.log('🔍 Mostrando:', this.showActiveMesas ? 'ACTIVAS' : 'INACTIVAS');

        // Los datos vienen en response.content
        if (response.content && Array.isArray(response.content)) {
          // Mapear imágenes a la propiedad imagenUrl para que el componente de tablas las muestre
          this.mesas = response.content.map(m => {
            const copy: any = { ...m };
            // Si backend envía 'imagen' como URL, exponer también 'imagenUrl' usado por tablas genéricas
            if (copy.imagen && !copy.imagenUrl) {
              copy.imagenUrl = copy.imagen;
            }
            // Mapear descripción al campo 'description' que usa el componente de tablas
            if (copy.descripcion && !copy.description) {
              copy.description = copy.descripcion;
            }
            return copy as MesaRestaurante;
          });
        } else {
          console.error('❌ response.content no es un array:', response.content);
          this.mesas = [];
        }

        this.loading = false;

        // Debug simplificado
        console.log('=== MESAS CARGADAS ===');
        console.log('Mostrando:', this.showActiveMesas ? 'ACTIVAS' : 'INACTIVAS');
        console.log('Total mesas:', this.mesas.length);
        console.log('Mesas:', this.mesas);
        console.log('========================');
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
      },
    });
  }

  toggleMesaStatus() {
    this.showActiveMesas = !this.showActiveMesas;
    this.getMesas();
  }

  openFormulario() {
    this.open = true;
    this.editingMesa = null;
    this.tituloFormulario = 'Crear Mesa';
  }

  closeFormulario() {
    this.open = false;
    this.editingMesa = null;
  }

  onEditMesa(mesa: MesaRestaurante) {
    this.editingMesa = mesa;
    this.tituloFormulario = 'Editar Mesa';
    this.open = true;
  }

  onViewMesa(mesa: MesaRestaurante) {
    console.log('Ver mesa:', mesa);

    const mesaInfo = `
      Información de la Mesa:

      ID: ${mesa.idTable}
      Número de Mesa: ${mesa.numberTable}
      Capacidad: ${mesa.ability} personas
      Descripción: ${mesa.descripcion ?? 'N/A'}
      Imagen: ${mesa.imagen ?? 'N/A'}
      Estado: ${mesa.state === 'A' ? 'Activa' : 'Inactiva'}
    `;

    alert(mesaInfo);
  }

  onDeleteMesa(mesaId: number) {
    const mesa = this.mesas.find(m => m.idTable === mesaId);
    const mesaNumber = mesa ? `mesa ${mesa.numberTable}` : 'esta mesa';

    if (this.showActiveMesas) {
      // Inactivar mesa activa
      if (confirm(`¿Estás seguro de que quieres eliminar la ${mesaNumber}?\n\nLa mesa será marcada como inactiva pero no se eliminará permanentemente.`)) {
        console.log('Inactivando mesa:', mesaId);

        this.http.inactivateMesa(mesaId).subscribe({
          next: (response) => {
            console.log('Mesa inactivada exitosamente:', response);
            this.showSuccessMessage(`Mesa ${mesaNumber} eliminada exitosamente`);
            this.getMesas();
          },
          error: (err) => {
            console.error('Error al inactivar mesa:', err);
            console.error('Status:', err.status);
            console.error('Error completo:', err);

            if (err.status === 401) {
              this.showErrorMessage('No tienes permisos para eliminar mesas o tu sesión ha expirado.');
            } else if (err.status === 404) {
              this.showErrorMessage('El endpoint de eliminación no existe en el backend.');
            } else {
              this.showErrorMessage('Error al eliminar la mesa. Inténtalo de nuevo.');
            }
          }
        });
      }
    } else {
      // Restaurar mesa inactiva
      if (confirm(`¿Estás seguro de que quieres restaurar la ${mesaNumber}?\n\nLa mesa volverá a estar activa.`)) {
        console.log('Restaurando mesa:', mesaId);

        this.http.restoreMesa(mesaId).subscribe({
          next: (response) => {
            console.log('Mesa restaurada exitosamente:', response);
            this.showSuccessMessage(`Mesa ${mesaNumber} restaurada exitosamente`);
            this.getMesas();
          },
          error: (err) => {
            console.error('Error al restaurar mesa:', err);
            console.error('Status:', err.status);
            console.error('Error completo:', err);

            if (err.status === 401) {
              this.showErrorMessage('No tienes permisos para restaurar mesas o tu sesión ha expirado.');
            } else if (err.status === 404) {
              this.showErrorMessage('El endpoint de restauración no existe en el backend.');
            } else {
              this.showErrorMessage('Error al restaurar la mesa. Inténtalo de nuevo.');
            }
          }
        });
      }
    }
  }

  showSuccessMessage(message: string) {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10B981;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 14px;
      max-width: 300px;
    `;
    successDiv.textContent = message;
    document.body.appendChild(successDiv);

    setTimeout(() => {
      document.body.removeChild(successDiv);
    }, 3000);
  }

  showErrorMessage(message: string) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #EF4444;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 14px;
      max-width: 300px;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
      document.body.removeChild(errorDiv);
    }, 4000);
  }

  onGuardar(formValue: any) {
    const payload: MesaRestaurantRequest = formValue as MesaRestaurantRequest;

    console.log('Enviando a servicio (payload final):', payload);

    if (this.editingMesa) {
      console.log('Editando mesa:', this.editingMesa.idTable);

      this.http.updateMesa(this.editingMesa.idTable, payload).subscribe({
        next: (response) => {
          console.log('Mesa actualizada exitosamente:', response);
          this.showSuccessMessage('Mesa actualizada exitosamente');
          this.open = false;
          this.editingMesa = null;
          this.getMesas();
        },
        error: (err) => {
          console.error('Error al actualizar mesa:', err);
          this.showErrorMessage('Error al actualizar la mesa. Inténtalo de nuevo.');
        }
      });
    } else {
      this.http.createMesa(payload).subscribe({
        next: (response) => {
          console.log('Mesa registrada:', response);
          this.showSuccessMessage('Mesa creada exitosamente');
          this.open = false;
          this.getMesas();
        },
        error: (err) => {
          console.error('Error al crear mesa:', err);
          this.showErrorMessage('Error al crear la mesa. Inténtalo de nuevo.');
        }
      });
    }
  }

  onLimpiar() {
    console.log('Fue limpiado')
  }

  onCerrar() {
    console.log('Formulario cancelado');
    this.open = false;
  }
}
