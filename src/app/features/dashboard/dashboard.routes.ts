import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';

export const dashboardRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home').then(m => m.Home),
    canActivate: [AuthGuard]
  }
];
