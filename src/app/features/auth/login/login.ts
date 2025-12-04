import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../core/models/auth.models';
import { GlobalErrorHandler } from '../../../core/errors/global-error-handler';
import { AppError } from '../../../core/errors/app-error';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  error = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly errorHandler: GlobalErrorHandler
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Si ya está autenticado, redirigir al dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Manejar envío del formulario de login
   */
  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.error = '';

      const credentials: LoginRequest = {
        username: this.loginForm.get('username')?.value,
        password: this.loginForm.get('password')?.value
      };

      this.authService.login(credentials).subscribe({
        next: (response) => {
          this.loading = false;
          console.log('Respuesta completa:', response);
          if (response.token) {
            // Login exitoso, redirigir al dashboard
            console.log('Login exitoso, redirigiendo...');
            this.router.navigate(['/dashboard']);
          } else {
            this.error = 'Credenciales inválidas';
            this.errorHandler.showCustomAlert('Error', this.error, 'warning');
          }
        },
        error: (error: AppError) => {
          this.loading = false;
          console.error('Error en login:', error);

          // El error ya fue procesado por el interceptor y la alerta mostrada
          // Solo actualizamos el estado local del componente si es necesario
          this.error = error.message;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  /**
   * Marcar todos los campos como touched para mostrar errores
   */
  private markFormGroupTouched(): void {
    for (const key of Object.keys(this.loginForm.controls)) {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    }
  }

  /**
   * Obtener mensaje de error para un campo específico
   */
  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);

    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} es requerido`;
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `${this.getFieldLabel(fieldName)} debe tener al menos ${requiredLength} caracteres`;
      }
    }

    return '';
  }

  /**
   * Obtener etiqueta del campo
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      username: 'Usuario',
      password: 'Contraseña'
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Verificar si un campo tiene error
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  /**
   * Limpiar error
   */
  clearError(): void {
    this.error = '';
  }

}
