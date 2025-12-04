import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';

export const mesasRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./mesas/mesas').then(m => m.Mesas),
    canActivate: [AuthGuard],
    data: { 
      roles: ['ADMIN', 'EMPLEADO', 'CLIENTE'],
      permission: 'mesas.read'
    }
  }
];
