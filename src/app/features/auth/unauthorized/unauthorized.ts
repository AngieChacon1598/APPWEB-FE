import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="max-w-md w-full text-center">
        <div class="mb-8">
          <svg class="mx-auto h-24 w-24 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h1 class="text-3xl font-bold text-gray-900 mb-4">
          Acceso Denegado
        </h1>
        
        <p class="text-gray-600 mb-8">
          No tienes permisos para acceder a esta página.
        </p>
        
        <div class="space-y-4">
          <button 
            (click)="goToDashboard()"
            class="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Ir al Dashboard
          </button>
          
          <button 
            (click)="logout()"
            class="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .min-h-screen {
      min-height: 100vh;
    }
  `]
})
export class UnauthorizedComponent {

  constructor(private router: Router) {}

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    // Aquí podrías inyectar el AuthService y hacer logout
    this.router.navigate(['/login']);
  }
}
