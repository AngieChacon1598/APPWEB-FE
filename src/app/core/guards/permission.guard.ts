import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const requiredPermission = route.data['permission'] as string;
    const requiredRoles = route.data['roles'] as string[];

    console.log('🔐 PermissionGuard - Verificando permiso:', requiredPermission);
    console.log('🔐 PermissionGuard - Roles requeridos:', requiredRoles);

    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (!user) {
          console.log('🚨 PermissionGuard - Usuario no autenticado');
          this.router.navigate(['/login']);
          return false;
        }

        const userRole = user.role || '';
        console.log('🔐 PermissionGuard - Rol del usuario:', userRole);

        // Verificar si el usuario tiene alguno de los roles requeridos
        if (requiredRoles && !this.authService.hasAnyRole(requiredRoles)) {
          console.log('🚨 PermissionGuard - Sin roles suficientes');
          this.router.navigate(['/unauthorized']);
          return false;
        }

        // Verificar permisos específicos según el rol
        const hasPermission = this.checkPermission(userRole, requiredPermission || '');

        if (!hasPermission) {
          console.log('🚨 PermissionGuard - Sin permiso específico:', requiredPermission);
          this.router.navigate(['/unauthorized']);
          return false;
        }

        console.log('✅ PermissionGuard - Permiso concedido');
        return true;
      })
    );
  }

  /**
   * Verificar permisos específicos según el rol del usuario
   */
  private checkPermission(userRole: string, permission: string): boolean {
    console.log('🔍 PermissionGuard - Verificando permiso:', permission, 'para rol:', userRole);

    // ADMIN puede hacer todo
    if (userRole === 'ADMIN') {
      return true;
    }

    // EMPLEADO puede consultar y gestionar productos, consultar usuarios y mesas
    if (userRole === 'EMPLEADO') {
      const empleadoPermissions = [
        'mesas.read',
        'productos.read',
        'productos.create',
        'productos.update',
        'productos.delete',
        'usuarios.read',
        'tipos-usuario.read',
        'ventas.read',
        'reservacion.read',
        'reservacion.create',
        'reservacion-user.read',
        'ventas.create',
        'ventas.update'
      ];
      return empleadoPermissions.includes(permission);
    }

    // CLIENTE puede consultar y crear sus propias ventas
    if (userRole === 'CLIENTE') {
      const clientePermissions = [
        'mesas.read',
        'productos.read',
        'tipos-usuario.read',
        'ventas.read',
        'reservacion.read',
        'reservacion.create',
        'reservacion-user.read',
        'ventas.create' // Los clientes pueden crear sus propias compras/tickets
      ];
      return clientePermissions.includes(permission);
    }

    // Si no se reconoce el rol, denegar acceso
    console.log('🚨 PermissionGuard - Rol no reconocido:', userRole);
    return false;
  }
}

/**
 * Guard específico para operaciones de solo lectura
 */
@Injectable({
  providedIn: 'root'
})
export class ReadOnlyGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (!user) {
          this.router.navigate(['/login']);
          return false;
        }

        // Todos los roles autenticados pueden leer
        return true;
      })
    );
  }
}

/**
 * Guard específico para operaciones de escritura (solo ADMIN y EMPLEADO)
 */
@Injectable({
  providedIn: 'root'
})
export class WriteGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (!user) {
          this.router.navigate(['/login']);
          return false;
        }

        // Solo ADMIN y EMPLEADO pueden escribir
        const canWrite = ['ADMIN', 'EMPLEADO'].includes(user.role || '');

        if (!canWrite) {
          console.log('🚨 WriteGuard - CLIENTE no puede realizar operaciones de escritura');
          this.router.navigate(['/unauthorized']);
          return false;
        }

        return true;
      })
    );
  }
}

/**
 * Guard específico para operaciones de ADMIN únicamente
 */
@Injectable({
  providedIn: 'root'
})
export class AdminOnlyGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (!user) {
          this.router.navigate(['/login']);
          return false;
        }

        // Solo ADMIN puede acceder
        const isAdmin = (user.role || '') === 'ADMIN';

        if (!isAdmin) {
          console.log('🚨 AdminOnlyGuard - Solo ADMIN puede acceder');
          this.router.navigate(['/unauthorized']);
          return false;
        }

        return true;
      })
    );
  }
}
