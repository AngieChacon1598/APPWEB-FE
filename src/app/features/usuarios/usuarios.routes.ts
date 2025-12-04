import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { AdminOnlyGuard } from '../../core/guards/permission.guard';

export const usuariosRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./usuario/usuario').then(m => m.Usuario),
    canActivate: [AuthGuard, AdminOnlyGuard],
    data: { 
      roles: ['ADMIN'],
      permission: 'usuarios.read'
    }
  }
];
