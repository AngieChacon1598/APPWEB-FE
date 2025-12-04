import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';

export const misComprasRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./mis-compras').then(m => m.MisComprasComponent),
    canActivate: [AuthGuard],
    data: {
      roles: ['CLIENTE'],
      permission: 'ventas.read'
    }
  }
];

