import { Routes } from '@angular/router';
import { LoginGuard } from '../../core/guards/auth.guard';

export const authRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login').then(m => m.LoginComponent),
    canActivate: [LoginGuard]
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./unauthorized/unauthorized').then(m => m.UnauthorizedComponent)
  }
];
