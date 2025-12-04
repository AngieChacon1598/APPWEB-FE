import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';

export const VerTodasReservas: Routes = [
  {
    path: '',
    loadComponent: () => import("./reservas/reservas").then(r => r.Reservas),
    canActivate: [AuthGuard],
    data: {
      roles: ['ADMIN', 'EMPLEADO'],
      permission: 'reservacion.read'
    }
  }
]
