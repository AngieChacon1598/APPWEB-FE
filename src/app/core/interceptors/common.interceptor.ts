import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import {
  AppError,
  AuthorizationError,
  AuthenticationError,
  NotFoundError,
  ServerError,
  ConflictError,
  BusinessError,
  NetworkError
} from '../errors/app-error';

/**
 * Interceptor para agregar headers comunes a todas las requests
 */
export const headersInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  // Agregar headers comunes
  const modifiedReq = req.clone({
    setHeaders: {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });

  return next(modifiedReq);
};

/**
 * Interceptor para logging de requests HTTP
 */
export const loggingInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const startTime = Date.now();

  console.log(`🚀 HTTP Request: ${req.method} ${req.url}`);

  return next(req).pipe(
    tap({
      next: (response) => {
        const duration = Date.now() - startTime;
        console.log(`✅ HTTP Response: ${req.method} ${req.url} - ${duration}ms`);
      },
      error: (error) => {
        const duration = Date.now() - startTime;
        console.log(`❌ HTTP Error: ${req.method} ${req.url} - ${duration}ms - ${error.status}`);
      }
    })
  );
};

/**
 * Interceptor para manejar errores de red
 */
export const networkErrorInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  return next(req).pipe(
    catchError((error: any) => {
      // Si es un HttpErrorResponse, mapear a errores de la aplicación
      if (error instanceof HttpErrorResponse) {
        // Error de conexión
        if (error.status === 0) {
          console.error('🚨 Network Error: No se pudo conectar al servidor');
          return throwError(() => new NetworkError());
        }

        // Autenticación / autorización
        if (error.status === 401) {
          return throwError(() => new AuthenticationError());
        }

        if (error.status === 403) {
          // Devolver mensaje amigable en español
          return throwError(() => new AuthorizationError('No está autorizado'));
        }

        if (error.status === 404) {
          return throwError(() => new NotFoundError());
        }

        if (error.status === 409) {
          return throwError(() => new ConflictError());
        }

        if (error.status === 422) {
          return throwError(() => new BusinessError(error.error?.message || 'Error de negocio'));
        }

        if (error.status >= 500) {
          return throwError(() => new ServerError());
        }

        // Para otros códigos, propagar el mensaje que venga del backend si existe
        const backendMessage = error.error && (error.error.message || error.error.msg || error.error);
        return throwError(() => new AppError(backendMessage || error.message || 'Error en la solicitud', error.status));
      }

      // No es HttpErrorResponse: propagar
      return throwError(() => error);
    })
  );
};
