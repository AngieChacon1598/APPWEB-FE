import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Obtener el token del localStorage
  const token = localStorage.getItem('jwt_token');

  console.log('🔍 AuthInterceptor - Token encontrado:', token ? 'SÍ' : 'NO');
  console.log('🔍 AuthInterceptor - URL:', req.url);
  console.log('🔍 AuthInterceptor - Método:', req.method);

  // Debug del token si existe
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('🔍 AuthInterceptor - Token payload:', payload);
      console.log('🔍 AuthInterceptor - Token subject:', payload.sub);
      console.log('🔍 AuthInterceptor - Token expiración:', payload.exp ? new Date(payload.exp * 1000) : 'No disponible');
    } catch (error) {
      console.error('🔍 AuthInterceptor - Error decodificando token:', error);
    }
  }

  if (token) {
    // Clonar la request y agregar el header Authorization
    const authReq = req.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ AuthInterceptor - Header Authorization agregado');
    console.log('📤 AuthInterceptor - Headers:', authReq.headers.keys());
    console.log('📤 AuthInterceptor - Authorization header:', authReq.headers.get('Authorization'));

    return next(authReq);
  }

  console.log('⚠️ AuthInterceptor - No hay token, enviando request sin autenticación');
  return next(req);
};
