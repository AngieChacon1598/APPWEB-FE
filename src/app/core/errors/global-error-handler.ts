import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import Swal from 'sweetalert2';
import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  ServerError,
  NetworkError,
  NotFoundError,
  BusinessError,
  ConflictError
} from './app-error';

export interface ErrorEvent {
  error: AppError;
  timestamp: Date;
}


@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandler {
  private readonly errorSubject = new Subject<ErrorEvent>();
  public error$ = this.errorSubject.asObservable();

  constructor() { }

  /**
   * Manejar error global
   */
  handleError(error: any): AppError {
    const appError = this.transformError(error);

    // Loguear error
    this.logError(appError);

    // Emitir evento de error
    this.errorSubject.next({
      error: appError,
      timestamp: new Date()
    });

    // Mostrar alerta según el tipo de error
    this.showErrorAlert(appError);

    return appError;
  }

  /**
   * Transformar error genérico a AppError específico
   */
  private transformError(error: any): AppError {
    // Si ya es un AppError, devolverlo tal cual
    if (error instanceof AppError) {
      return error;
    }

    // Si es un error HTTP
    if (error.status !== undefined) {
      return this.handleHttpError(error);
    }

    // Si es un Error común
    if (error instanceof Error) {
      return new AppError(error.message);
    }

    // Error desconocido
    return new AppError('Error desconocido. Intente nuevamente.');
  }

  /**
   * Manejar errores HTTP específicos
   */
  private handleHttpError(error: any): AppError {
    const status = error.status;
    const message = error.error?.message || error.message;

    switch (status) {
      case 400:
        return new ValidationError(message || 'Datos inválidos');

      case 401:
        return new AuthenticationError(message || 'Credenciales inválidas');

      case 403:
        // For 403 always present a friendly message in Spanish and avoid exposing
        // the raw HttpErrorResponse message (e.g. "Http failure response for ...").
        return new AuthorizationError('No está autorizado');

      case 404:
        return new NotFoundError(message || 'Recurso no encontrado');

      case 409:
        return new ConflictError(message || 'Conflicto en la solicitud');

      case 422:
        return new BusinessError(message || 'Error en la operación');

      case 500:
      case 502:
      case 503:
      case 504:
        return new ServerError(message || 'Error en el servidor');

      case 0:
        return new NetworkError();

      default:
        return new AppError(
          message || 'Error de conexión. Intente nuevamente.',
          status
        );
    }
  }

  /**
   * Loguear error en consola
   */
  private logError(error: AppError): void {
    console.error(`[${error.name}] ${error.timestamp.toISOString()}:`, {
      message: error.message,
      statusCode: error.statusCode,
      errorCode: error.errorCode,
      stack: error.stack
    });
  }

  /**
   * Mostrar alerta visual según el tipo de error
   */
  private showErrorAlert(error: AppError): void {
    let icon: 'error' | 'warning' | 'info' = 'error';
    let title = 'Error';

    if (error instanceof ValidationError) {
      icon = 'warning';
      title = 'Error de Validación';
    } else if (error instanceof AuthenticationError) {
      icon = 'warning';
      title = 'Error de Autenticación';
    } else if (error instanceof AuthorizationError) {
      icon = 'warning';
      title = 'Acceso Denegado';
    } else if (error instanceof NotFoundError) {
      icon = 'info';
      title = 'No Encontrado';
    } else if (error instanceof ServerError || error instanceof NetworkError) {
      // icon y title ya tienen los valores por defecto
    } else if (error instanceof BusinessError) {
      icon = 'warning';
      // title ya tiene el valor por defecto
    }

    Swal.fire({
      icon,
      title,
      text: error.message,
      confirmButtonText: 'Aceptar',
      allowOutsideClick: false,
      didOpen: () => {
        // Puedes agregar lógica adicional cuando se abre la alerta
      }
    });
  }

  /**
   * Mostrar alerta personalizada
   */
  public showCustomAlert(
    title: string,
    message: string,
    icon: 'success' | 'error' | 'warning' | 'info' = 'info'
  ): void {
    Swal.fire({
      icon,
      title,
      text: message,
      confirmButtonText: 'Aceptar'
    });
  }

  /**
   * Mostrar confirmación
   */
  public async showConfirmation(
    title: string,
    message: string
  ): Promise<boolean> {
    const result = await Swal.fire({
      icon: 'question',
      title,
      text: message,
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar'
    });

    return result.isConfirmed;
  }
}
