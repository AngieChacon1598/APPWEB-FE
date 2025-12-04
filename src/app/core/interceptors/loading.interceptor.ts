import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';

/**
 * Servicio para manejar el estado de loading global
 */
@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  private requestCount = 0;

  show() {
    this.requestCount++;
    if (this.requestCount === 1) {
      this.loadingSubject.next(true);
    }
  }

  hide() {
    this.requestCount--;
    if (this.requestCount <= 0) {
      this.requestCount = 0;
      this.loadingSubject.next(false);
    }
  }

  reset() {
    this.requestCount = 0;
    this.loadingSubject.next(false);
  }
}

/**
 * Interceptor para mostrar loading durante requests HTTP
 */
export const loadingInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  // Solo aplicar loading a requests que no sean de login
  if (req.url.includes('/auth/login')) {
    return next(req);
  }

  let loadingService: LoadingService | null = null;
  
  try {
    loadingService = inject(LoadingService);
  } catch (error) {
    // Si no se puede inyectar el servicio, continuar sin loading
    console.warn('LoadingService no disponible, continuando sin loading');
    return next(req);
  }
  
  // Mostrar loading al inicio de la request
  loadingService.show();
  
  return next(req).pipe(
    finalize(() => {
      // Ocultar loading al finalizar la request
      if (loadingService) {
        loadingService.hide();
      }
    })
  );
};
