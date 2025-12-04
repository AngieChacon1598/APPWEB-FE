import { Injectable, inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    console.log('🛡️ AuthGuard SIMPLIFICADO - Verificando acceso a:', state.url);
    
    // Verificación básica de autenticación
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        console.log('🛡️ AuthGuard SIMPLIFICADO - Usuario autenticado:', isAuthenticated);
        
        if (!isAuthenticated) {
          console.log('🚨 AuthGuard SIMPLIFICADO - No autenticado, redirigiendo a login');
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: state.url }
          });
          return false;
        }

        console.log('✅ AuthGuard SIMPLIFICADO - Usuario autenticado, permitiendo acceso');
        return true;
      })
    );
  }
}

/**
 * Guard para rutas de login (redirigir si ya está autenticado)
 */
@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): Observable<boolean> {
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        if (isAuthenticated) {
          this.router.navigate(['/dashboard']);
          return false;
        }
        return true;
      })
    );
  }
}