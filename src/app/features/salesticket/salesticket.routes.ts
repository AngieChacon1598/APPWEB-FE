import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { salesTicketsResolver, salesTicketResolver } from '../../core/resolvers/salesticket.resolver';

export const salesticketRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./salesticket/salesticket').then(m => m.SalesTicketComponent),
    canActivate: [AuthGuard],
    data: {
      roles: ['ADMIN', 'EMPLEADO', 'CLIENTE'],
      permission: 'ventas.read'
    },
    resolve: {
      salesTickets: salesTicketsResolver
    }
  },
  {
    path: 'new',
    loadComponent: () => import('./salesticket-form/salesticket-form').then(m => m.SalesTicketFormComponent),
    canActivate: [AuthGuard],
    data: {
      roles: ['ADMIN', 'EMPLEADO', 'CLIENTE'],
      permission: 'ventas.create'
    }
  },
  {
    path: 'form',
    loadComponent: () => import('./salesticket-form/salesticket-form').then(m => m.SalesTicketFormComponent),
    canActivate: [AuthGuard],
    data: {
      roles: ['ADMIN', 'EMPLEADO', 'CLIENTE'],
      permission: 'ventas.create'
    }
  },
  {
    path: ':id',
    loadComponent: () => import('./salesticket-details/salesticket-details').then(m => m.SalesTicketDetailsComponent),
    canActivate: [AuthGuard],
    data: {
      roles: ['ADMIN', 'EMPLEADO', 'CLIENTE'],
      permission: 'ventas.read'
    },
    resolve: {
      salesTicket: salesTicketResolver
    }
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./salesticket-form/salesticket-form').then(m => m.SalesTicketFormComponent),
    canActivate: [AuthGuard],
    data: {
      roles: ['ADMIN', 'EMPLEADO', 'CLIENTE'],
      permission: 'ventas.update'
    },
    resolve: {
      salesTicket: salesTicketResolver
    }
  }
];
