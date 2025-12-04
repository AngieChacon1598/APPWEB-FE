import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';

export const reservacionRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import("./reservacion").then(res => res.Reservacion),
    canActivate: [AuthGuard],
    data: {
      roles: ['ADMIN', 'EMPLEADO', 'CLIENTE'],
      permission: 'reservacion.read'
    }
  }
]
