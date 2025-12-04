import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';

export const ReservacionesUsuarioRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./reservaciones-usuario').then(m => m.ReservacionesUsuario),
    canActivate: [AuthGuard],
    data: {
      roles: ['ADMIN', 'EMPLEADO', 'CLIENTE'],
      permission: 'reservacion-user.read'
    }
  }
]
