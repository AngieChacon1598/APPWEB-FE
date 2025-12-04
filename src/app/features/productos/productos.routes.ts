import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';

export const productosRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./productos/productos').then(m => m.Productos),
    canActivate: [AuthGuard],
    data: { 
      roles: ['ADMIN', 'EMPLEADO', 'CLIENTE'],
      permission: 'productos.read'
    }
  }
];