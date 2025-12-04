import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { GlobalErrorHandler } from '../errors/global-error-handler';


export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorHandler = inject(GlobalErrorHandler);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const appError = errorHandler.handleError(error);

      // Retornar el error transformado
      return throwError(() => appError);
    })
  );
};
