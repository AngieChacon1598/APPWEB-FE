import { Component, inject, OnInit } from '@angular/core';
import { RestaurantUser, BaseUser, UsuarioRequest, TypeUsers } from '../../../core/models/usuario.models';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TablesComponents } from "../../../shared/components/tables-components/tables-components";
import { UsuarioService } from '../../../core/services/usuario.service';
import { AuthService } from '../../../core/services/auth.service';
import { FormsComponents } from '../../../shared/components/forms-components/forms-components';

@Component({
  selector: 'app-usuario',
  imports: [CommonModule, TablesComponents, FormsComponents, FormsModule],
  templateUrl: './usuario.html',
  styleUrls: ['./usuario.scss']
})
export class Usuario implements OnInit {

  private readonly http = inject(UsuarioService);
  private readonly authService = inject(AuthService);

  usuarios: RestaurantUser[] = [];
  // search string bound to the input
  userTypes: TypeUsers[] = [];
  page: number = 0;
  size: number = 10;
  search!: string;
  // timer id for debouncing user input
  private searchTimeout: any = null;
  totalElements: number = 0;
  totalPages: number = 0;
  open: boolean = false;
  loading: boolean = false;
  editingUser: RestaurantUser | null = null;
  showActiveUsers: boolean = true; // true = activos, false = inactivos
  currentUser: any = null;
  canManageUsers: boolean = false; // Solo ADMIN puede gestionar usuarios
  canManageEdit: boolean = false;

  tituloFormulario: string = 'Crear Usuario';

  campos: { nombre: string; tipo: string; etiqueta: string; opciones?: any[] }[] = [
    { nombre: 'userName', tipo: 'text', etiqueta: 'Usuario' },
    { nombre: 'password', tipo: 'password', etiqueta: 'Contraseña' },
    { nombre: 'names', tipo: 'text', etiqueta: 'Nombres' },
    { nombre: 'lastName', tipo: 'text', etiqueta: 'Apellidos' },
    { nombre: 'birthDate', tipo: 'date', etiqueta: 'Fecha de Nacimiento' },
    { nombre: 'address', tipo: 'text', etiqueta: 'Dirección' },
    { nombre: 'email', tipo: 'email', etiqueta: 'Email' },
    { nombre: 'typeDocument', tipo: 'text', etiqueta: 'Tipo Documento' },
    { nombre: 'numberDocument', tipo: 'text', etiqueta: 'Número Documento' },
    { nombre: 'role', tipo: 'select', etiqueta: 'Rol', opciones: [] }
  ];

  columns: { field: string; header: string }[] = [
    { field: 'userName', header: 'Usuario' },
    { field: 'names', header: 'Nombres' },
    { field: 'lastName', header: 'Apellidos' },
    { field: 'email', header: 'Email' },
    { field: 'typeUsersIdTypeUsers.name', header: 'Rol' },
    { field: 'state', header: 'Estado' }
  ];

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadUserTypes();
    this.getUsuarios();
  }

  /**
   * Called on input events from the search box. Debounces rapid typing
   * and triggers a new paged fetch with the search term.
   */
  onSearch(value: string) {
    this.search = value;

    // reset to first page when searching
    this.page = 0;

    // debounce: wait 350ms after last keystroke
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.getUsuarios({ page: this.page, size: this.size, search: this.search });
    }, 350);
  }

  loadCurrentUser() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.canManageUsers = user?.role === 'ADMIN';
      console.log('🔐 Usuarios - Usuario actual:', user);
      console.log('🔐 Usuarios - Puede gestionar usuarios:', this.canManageUsers);
    });
  }

  loadUserTypes() {
    this.http.getAllUserTypes().subscribe({
      next: (types) => {
        // Los tipos de usuario ya vienen desencriptados del backend
        this.userTypes = types;

        // Update the role field options
        const roleField = this.campos.find(c => c.nombre === 'role');
        if (roleField) {
          roleField.opciones = this.userTypes.map(type => ({
            value: type.name,
            label: type.name
          }));
        }

        console.log('🔓 Tipos de usuario (ya desencriptados automáticamente):', this.userTypes);
      },
      error: (err) => {
        console.error('Error loading user types:', err);
      }
    });
  }

  getUsuarios(params?: any) {
    // normalize params and apply defaults
    const page = params?.page ?? this.page;
    const size = params?.size ?? this.size;
    const search = params?.search ?? this.search;

    // update local pagination values
    this.page = page;
    this.size = size;

    // Create a params object for the service
    params = { page: this.page, size: this.size, search };

    this.loading = true;

    // Usar el endpoint específico según el estado
    const estado = this.showActiveUsers ? 'A' : 'I';

    console.log('🔍 === SOLICITANDO USUARIOS ===');
    console.log('🔍 Estado solicitado:', estado);
    console.log('🔍 Mostrando:', this.showActiveUsers ? 'ACTIVOS' : 'INACTIVOS');
    console.log('🔍 Página:', this.page);
    console.log('🔍 Tamaño:', this.size);

    // Si hay un término de búsqueda, usar el endpoint generico que acepta 'search'
    const hasSearch = params?.search && String(params.search).trim().length > 0;

    if (hasSearch) {
      console.log('🔍 Usando endpoint /listar-restaurant-user con search=', params.search);

      this.http.getAllUsers(params).subscribe({
        next: (response: any) => {
          console.log('🔍 Respuesta del endpoint de búsqueda:', response);

          if (Array.isArray(response.content)) {
            // Filtrar por estado (A/I) para respetar el toggle de activos/inactivos
            const usuariosFiltrados = response.content.filter((u: any) => u.state === estado);
            this.usuarios = usuariosFiltrados;

            // Ajustar totales en base a los resultados filtrados
            this.totalElements = usuariosFiltrados.length;
            this.totalPages = this.totalElements > 0 ? Math.ceil(this.totalElements / this.size) : 0;
          } else {
            console.error('❌ response.content no es un array (search):', response.content);
            this.usuarios = [];
            this.totalElements = 0;
            this.totalPages = 0;
          }

          this.loading = false;
        },
        error: (err: any) => {
          console.error('❌ Error obteniendo usuarios (search):', err);
          this.loading = false;
          this.showErrorMessage('Error al buscar usuarios. Inténtalo de nuevo.');
        }
      });

    } else {
      // Sin búsqueda: usar endpoint por estado como antes
      this.http.getUsersByState(estado, params).subscribe({
        next: (response: any) => {
          console.log('🔍 Respuesta del endpoint (por estado):', response);

          if (Array.isArray(response.content)) {
            this.usuarios = response.content;
          } else {
            console.error('❌ response.content no es un array:', response.content);
            this.usuarios = [];
          }

          this.totalElements = response.totalElements;
          this.totalPages = response.totalPages;
          this.loading = false;
        },
        error: (err: any) => {
          console.error('❌ Error obteniendo usuarios:', err);
          console.error('❌ Estado solicitado:', estado);
          console.error('❌ URL solicitada:', `${this.http['url']}/listar-por-estado?estado=${estado}&page=${this.page}&size=${this.size}`);

          this.loading = false;

          // Mostrar mensaje específico según el tipo de error
          if (err.status === 0 || err.message?.includes('ERR_CONNECTION_REFUSED')) {
            this.showErrorMessage('Error: No se puede conectar al servidor. Verifica que el backend esté ejecutándose en el puerto 8081.');
          } else if (err.status === 401) {
            this.showErrorMessage('Error: Sesión expirada. Por favor, inicia sesión nuevamente.');
          } else if (err.status === 403) {
            this.showErrorMessage('Error: No tienes permisos para ver usuarios.');
          } else {
            this.showErrorMessage('Error al cargar usuarios. Inténtalo de nuevo.');
          }
        },
      });
    }
  }

  onPageChange(page: number) {
    this.page = page;
    this.getUsuarios({ page: this.page, size: this.size });
  }

  onSizeChange(size: number) {
    this.size = size;
    this.page = 0; // Reset to first page when changing size
    this.getUsuarios({ page: this.page, size: this.size });
  }

  toggleUserStatus() {
    this.showActiveUsers = !this.showActiveUsers;
    this.page = 0; // Reset to first page when changing status
    this.getUsuarios({ page: this.page, size: this.size });
  }

  showActiveUsersList() {
    if (!this.showActiveUsers) {
      this.showActiveUsers = true;
      this.page = 0; // Reset to first page
      console.log('🔄 Cambiando a usuarios ACTIVOS');
      this.getUsuarios({ page: this.page, size: this.size });
    }
  }

  showInactiveUsersList() {
    if (this.showActiveUsers) {
      this.showActiveUsers = false;
      this.page = 0; // Reset to first page
      console.log('🔄 Cambiando a usuarios INACTIVOS');
      this.getUsuarios({ page: this.page, size: this.size });
    }
  }

  openFormulario() {
    this.open = true;
    this.editingUser = null;
    this.tituloFormulario = 'Crear Usuario';
  }

  closeFormulario() {
    this.open = false;
    this.editingUser = null;
  }

  onEditUser(user: RestaurantUser) {
    // Mapear los datos del usuario para el formulario
    this.editingUser = {
      ...user,
      userName: user.userName || user.names || '', // Usar names como fallback si userName está vacío
      role: user.typeUsersIdTypeUsers?.name || ''
    } as any;
    this.tituloFormulario = 'Editar Usuario';
    this.open = true;
  }

  onViewUser(user: RestaurantUser) {
    console.log('Ver usuario:', user);

    // Crear mensaje con información detallada del usuario
    const userInfo = `
      Información del Usuario:

      ID: ${user.idUser}
      Usuario: ${user.userName || 'No disponible'}
      Nombres: ${user.names}
      Apellidos: ${user.lastName}
      Email: ${user.email}
      Dirección: ${user.address}
      Tipo de Documento: ${user.typeDocument}
      Número de Documento: ${user.numberDocument}
      Fecha de Nacimiento: ${user.birthDate}
      Estado: ${user.state}
      Rol: ${user.typeUsersIdTypeUsers?.name || 'No disponible'}
    `;

    alert(userInfo);
  }

  onDeleteUser(userId: number) {
    const user = this.usuarios.find(u => u.idUser === userId);
    const userName = user ? (user.userName || user.names || 'este usuario') : 'este usuario';

    if (this.showActiveUsers) {
      // Inactivar usuario activo
      if (confirm(`¿Estás seguro de que quieres eliminar a ${userName}?\n\nEl usuario será marcado como inactivo pero no se eliminará permanentemente.`)) {
        console.log('Inactivando usuario:', userId);

        this.http.inactivateUser(userId).subscribe({
          next: (response) => {
            console.log('✅ Usuario inactivado exitosamente:', response);
            this.showSuccessMessage(`Usuario ${userName} eliminado exitosamente`);

            // Actualizar la lista inmediatamente removiendo el usuario de la lista actual
            this.usuarios = this.usuarios.filter(user => user.idUser !== userId);
            this.totalElements = this.totalElements - 1;

            console.log('✅ Usuario removido de la lista actual. Total usuarios:', this.usuarios.length);
          },
          error: (err) => {
            console.error('❌ Error al inactivar usuario:', err);
            console.error('❌ Status:', err.status);
            console.error('❌ Error completo:', err);

            if (err.status === 401) {
              this.showErrorMessage('No tienes permisos para eliminar usuarios o tu sesión ha expirado.');
            } else if (err.status === 404) {
              this.showErrorMessage('El endpoint de eliminación no existe en el backend.');
            } else if (err.status === 403) {
              this.showErrorMessage('No tienes permisos para eliminar usuarios. Solo los administradores pueden realizar esta acción.');
            } else {
              this.showErrorMessage('Error al eliminar el usuario. Inténtalo de nuevo.');
            }
          }
        });
      }
    } else {
      // Reactivar usuario inactivo
      if (confirm(`¿Estás seguro de que quieres restaurar a ${userName}?\n\nEl usuario volverá a estar activo.`)) {
        console.log('Reactivando usuario:', userId);

        this.http.restoreUser(userId).subscribe({
          next: (response) => {
            console.log('✅ Usuario reactivado exitosamente:', response);
            this.showSuccessMessage(`Usuario ${userName} restaurado exitosamente`);

            // Actualizar la lista inmediatamente removiendo el usuario de la lista actual
            this.usuarios = this.usuarios.filter(user => user.idUser !== userId);
            this.totalElements = this.totalElements - 1;

            console.log('✅ Usuario removido de la lista actual. Total usuarios:', this.usuarios.length);
          },
          error: (err) => {
            console.error('❌ Error al reactivar usuario:', err);
            console.error('❌ Status:', err.status);
            console.error('❌ Error completo:', err);

            if (err.status === 401) {
              this.showErrorMessage('No tienes permisos para restaurar usuarios o tu sesión ha expirado.');
            } else if (err.status === 404) {
              this.showErrorMessage('El endpoint de restauración no existe en el backend.');
            } else if (err.status === 403) {
              this.showErrorMessage('No tienes permisos para restaurar usuarios. Solo los administradores pueden realizar esta acción.');
            } else {
              this.showErrorMessage('Error al restaurar el usuario. Inténtalo de nuevo.');
            }
          }
        });
      }
    }
  }

  showSuccessMessage(message: string) {
    // Crear un mensaje más elegante
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

    // Remover después de 3 segundos
    setTimeout(() => {
      successDiv.remove();
    }, 3000);
  }

  showErrorMessage(message: string) {
    // Crear un mensaje de error más elegante
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

    // Remover después de 4 segundos
    setTimeout(() => {
      errorDiv.remove();
    }, 4000);
  }

  onGuardar(formValue: any) {
    console.log('🔍 === INICIANDO ACTUALIZACIÓN DE USUARIO ===');

    const payload: UsuarioRequest = formValue as UsuarioRequest;

    // Verificación mejorada del rol
    const userRole = localStorage.getItem('user_role') || this.currentUser?.role;
    console.log('🔍 Rol del usuario desde localStorage:', localStorage.getItem('user_role'));
    console.log('🔍 Rol del usuario desde currentUser:', this.currentUser?.role);
    console.log('🔍 Rol final usado:', userRole);

    if (userRole !== 'ADMIN') {
      console.log('❌ Usuario no es ADMIN. Rol actual:', userRole);
      alert('Error: No tienes permisos para actualizar usuarios. Solo los administradores pueden realizar esta acción.');
      return;
    }

    console.log('✅ Usuario es ADMIN, procediendo con la actualización');

    // Debug: Verificar usuario actual y permisos
    console.log('🔍 Usuario actual:', this.currentUser);
    console.log('🔍 Rol del usuario:', this.currentUser?.role);
    console.log('🔍 Puede gestionar usuarios:', this.canManageUsers);

    // Debug detallado de permisos
    this.authService.debugUserPermissions();

    // Format birth date to dd/MM/yyyy
    if (typeof payload?.birthDate === 'string') {
      const iso = payload.birthDate.trim();
      const matchIso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
      if (matchIso) {
        const yyyy = matchIso[1];
        const mm = matchIso[2];
        const dd = matchIso[3];
        payload.birthDate = `${dd}/${mm}/${yyyy}`;
      }
    }

    console.log('Enviando a servicio (payload final):', payload);

    if (this.editingUser) {
      // Lógica para editar usuario existente
      console.log('Editando usuario:', this.editingUser.idUser);

      // Crear payload completo para actualización (requerido por el backend)
      const completePayload = {
        userName: payload.userName || this.editingUser.userName,
        password: payload.password || this.editingUser.password || 'default123', // Usar password actual o default
        names: payload.names || this.editingUser.names,
        lastName: payload.lastName || this.editingUser.lastName,
        birthDate: payload.birthDate || this.editingUser.birthDate,
        address: payload.address || this.editingUser.address || 'Dirección por defecto',
        email: payload.email || this.editingUser.email,
        typeDocument: payload.typeDocument || this.editingUser.typeDocument || 'CC',
        numberDocument: payload.numberDocument || this.editingUser.numberDocument || '12345678'
      };

      console.log('🔍 Payload completo para actualización:', completePayload);

      this.http.updateUser(this.editingUser.idUser, completePayload).subscribe({
        next: (response) => {
          console.log('Usuario actualizado exitosamente:', response);
          alert('Usuario actualizado exitosamente');
          this.open = false;
          this.editingUser = null;
          this.getUsuarios();
        },
        error: (err) => {
          console.error('❌ === ERROR AL ACTUALIZAR USUARIO ===');
          console.error('❌ Error completo:', err);
          console.error('❌ Status:', err.status);
          console.error('❌ Message:', err.message);
          console.error('❌ URL:', err.url);
          console.error('❌ Headers enviados:', err.headers);
          console.error('❌ Error details:', err.error);

          // Debugging adicional para error 403
          if (err.status === 403) {
            console.error('🔍 === DEBUGGING ERROR 403 ===');
            console.error('🔍 Token actual:', localStorage.getItem('jwt_token'));
            console.error('🔍 Rol actual:', localStorage.getItem('user_role'));
            console.error('🔍 Usuario actual:', this.currentUser);
            console.error('🔍 Can manage users:', this.canManageUsers);

            // Verificar si el token está siendo enviado
            const token = localStorage.getItem('jwt_token');
            if (token) {
              try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                console.error('🔍 Token payload:', payload);
                console.error('🔍 Token expiración:', new Date(payload.exp * 1000));
                console.error('🔍 Token válido:', new Date(payload.exp * 1000) > new Date());
              } catch (e) {
                console.error('❌ Error decodificando token:', e);
              }
            }
            console.error('================================');
          }

          if (err.status === 403) {
            alert('Error: No tienes permisos para actualizar usuarios. Solo los administradores pueden realizar esta acción.');
          } else if (err.status === 401) {
            alert('Error: Sesión expirada. Por favor, inicia sesión nuevamente.');
          } else {
            alert('Error al actualizar el usuario. Inténtalo de nuevo.');
          }
        }
      });
    } else {
      // Lógica para crear nuevo usuario según el rol
      const role = payload.role;
      let createMethod;

      // Crear payload sin el campo 'role' para evitar problemas
      const { role: _, ...cleanPayload } = payload;

      console.log('🔍 Rol seleccionado:', role);
      console.log('🔍 Payload limpio (sin role):', cleanPayload);

      // Corregir el formato del payload según el backend
      const correctedPayload = {
        username: cleanPayload.userName, // Cambiar userName a username
        password: cleanPayload.password,
        names: cleanPayload.names,
        lastName: cleanPayload.lastName,
        birthDate: this.convertDateFormat(cleanPayload.birthDate), // Convertir formato de fecha
        address: cleanPayload.address,
        email: cleanPayload.email,
        typeDocument: cleanPayload.typeDocument,
        numberDocument: cleanPayload.numberDocument,
        role: role
      };

      console.log('🔍 Payload corregido para backend:', correctedPayload);

      createMethod = this.http.createUser(correctedPayload);

      createMethod.subscribe({
        next: (response) => {
          console.log('✅ Usuario registrado exitosamente:', response);
          this.showSuccessMessage('Usuario creado exitosamente');
          this.open = false;
          this.getUsuarios();
        },
        error: (err) => {
          console.error('❌ Error al crear usuario:', err);
          console.error('❌ Status:', err.status);
          console.error('❌ Error completo:', err);
          console.error('❌ Headers de respuesta:', err.headers);
          console.error('❌ URL:', err.url);
          console.error('❌ Mensaje:', err.message);
          console.error('❌ Payload enviado:', payload);
          console.error('❌ Error details:', err.error);

          if (err.status === 403) {
            this.showErrorMessage('Error: No tienes permisos para crear usuarios. Solo los administradores pueden realizar esta acción.');
          } else if (err.status === 401) {
            this.showErrorMessage('Error: Sesión expirada. Por favor, inicia sesión nuevamente.');
          } else if (err.status === 400) {
            this.showErrorMessage('Error: Datos del usuario inválidos. Verifica que todos los campos estén completos y en el formato correcto.');
            console.log('🔍 Detalles del error 400:', err.error);
          } else {
            this.showErrorMessage('Error al crear el usuario. Inténtalo de nuevo.');
          }
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

  getUserSales(userId: number) {
    this.http.getUserSales(userId).subscribe({
      next: (sales) => {
        console.log('Ventas del usuario:', sales);
        // Handle sales data display
      },
      error: (err) => {
        console.error('Error obteniendo ventas:', err);
      }
    });
  }

  // Método para convertir formato de fecha de dd/MM/yyyy a yyyy-MM-dd
  convertDateFormat(dateString: string): string {
    if (!dateString) return '';

    // Si ya está en formato yyyy-MM-dd, devolverlo tal como está
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }

    // Si está en formato dd/MM/yyyy, convertirlo
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Si está en formato dd-MM-yyyy, convertirlo
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split('-');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    console.warn('⚠️ Formato de fecha no reconocido:', dateString);
    return dateString; // Devolver tal como está si no se reconoce el formato
  }

}
