import { Routes } from '@angular/router';
import { AuthGuard, LoginGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Rutas de autenticación
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: 'login',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: 'unauthorized',
    redirectTo: 'auth/unauthorized',
    pathMatch: 'full'
  },
  // Layout principal con sidebar
  {
    path: '',
    loadComponent: () => import('./layout/components/sidebar/sidebar').then(sidebar => sidebar.Sidebar),
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'home',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      // Dashboard
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.dashboardRoutes)
      },
      // Usuarios
      {
        path: 'usuarios',
        loadChildren: () => import('./features/usuarios/usuarios.routes').then(m => m.usuariosRoutes)
      },
      // Productos
      {
        path: 'productos',
        loadChildren: () => import('./features/productos/productos.routes').then(m => m.productosRoutes)
      },
      // Menus (mismo componente que productos pero ruta diferente para clientes)
      {
        path: 'menus',
        loadChildren: () => import('./features/productos/productos.routes').then(m => m.productosRoutes)
      },
      // Mesas
      {
        path: 'mesas',
        loadChildren: () => import('./features/mesas/mesas.routes').then(m => m.mesasRoutes)
      },
      // Sales Ticket
      {
        path: 'salesticket',
        loadChildren: () => import('./features/salesticket/salesticket.routes').then(m => m.salesticketRoutes)
      },
      {
        path: 'reservacion',
        loadChildren: () => import('./features/reservacion/reservacion.routes').then(m => m.reservacionRoutes)
      },
      {
        path: 'ver-reservacion',
        loadChildren: () => import('./features/ver-todas-reservas/ver-reservas.routes').then(m => m.VerTodasReservas)
      },
      {
        path: 'reservaciones-usuario',
        loadChildren: () => import('./features/reservaciones-usuario/reservaciones-usuarios.routes').then(m => m.ReservacionesUsuarioRoutes)
      },
      {
        path: 'mis-compras',
        loadChildren: () => import('./features/mis-compras/mis-compras.routes').then(m => m.misComprasRoutes)
      }
    ]
  },
  // Ruta wildcard - debe ir al final
  {
    path: '**',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];
