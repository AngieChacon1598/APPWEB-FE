import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map, catchError } from 'rxjs';
import { baseUrl } from '../../../environments/conexion';
import { LoginRequest, LoginResponse, User, AuthenticationRequest, AuthenticationResponse } from '../models/auth.models';
import { UsuarioRequest } from '../models/usuario.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly url = baseUrl.desarrollo;
  private tokenKey = 'jwt_token';
  private userKey = 'user_data';
  private credentialsKey = 'user_credentials';
  private idUserKey = 'idUser';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // Auto-renovación de tokens
  private refreshTimer: any = null;
  private isRefreshing = false;
  private refreshInterval = 3600000; // 1 hora (para tokens de 8 horas)

  constructor(private http: HttpClient) {
    // Verificar si el token ha expirado al inicializar
    this.checkTokenExpiration();

    // Iniciar auto-renovación si hay token
    if (this.getToken()) {
      this.startTokenRefresh();
    }
  }

  /**
   * Realizar login y guardar token
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    console.log('🔐 AuthService - Intentando login con:', credentials);
    console.log('🔐 AuthService - URL del backend:', `${this.url}/auth/login`);

    return this.http.post<LoginResponse>(`${this.url}/auth/login`, credentials)
      .pipe(
        tap(response => {
          console.log('Respuesta del backend:', response);
          // Manejar el formato de respuesta del backend (directo sin content)
          if (response.token) {
            this.setToken(response.token);
            // Crear objeto usuario con los datos de la respuesta
            const userRole = response.role || 'USER';
            console.log('🔍 AuthService - Login - Rol original del backend:', userRole);
            console.log('🔍 AuthService - Login - Usuario:', credentials.username);

            // Mapeo temporal: convertir USER a ADMIN para usuarios específicos
            let mappedRole = userRole;
            if (credentials.username === 'AngieC') {
              mappedRole = 'ADMIN';
              console.log('🔍 AuthService - Login - Mapeando AngieC a ADMIN');
            } else if (userRole === 'USER' || userRole === 'CLIENTE') {
              mappedRole = 'CLIENTE';
              console.log('🔍 AuthService - Login - Mapeando USER/CLIENTE a CLIENTE');
            }

            console.log('🔍 AuthService - Login - Rol final mapeado:', mappedRole);

            // Guardar el rol en localStorage
            localStorage.setItem('user_role', mappedRole);
            console.log('✅ AuthService - Rol guardado en localStorage:', mappedRole);

            // Intentar obtener el ID del usuario - primero de la respuesta, luego del token
            let userId = 1; // Valor por defecto
            
            // Prioridad 1: Usar idUser de la respuesta del backend (más confiable)
            if (response.idUser) {
              userId = typeof response.idUser === 'string' ? parseInt(response.idUser, 10) : response.idUser;
              console.log('🔍 AuthService - Login - ID obtenido de response.idUser:', userId);
            } else {
              // Prioridad 2: Intentar extraer del token JWT (pero NO usar payload.sub que es el username)
              try {
                const payload = JSON.parse(atob(response.token.split('.')[1]));
                console.log('🔍 AuthService - Login - Token payload:', payload);
                // El ID podría estar en diferentes campos según el backend
                // NO usar payload.sub porque contiene el username, no el ID
                userId = payload.userId || payload.id || (response as any).userId || 1;
                console.log('🔍 AuthService - Login - ID extraído del token:', userId);
              } catch (error) {
                console.warn('⚠️ AuthService - Login - No se pudo extraer ID del token, usando valor por defecto:', error);
              }
            }

            const user = {
              id: userId,
              username: response.userName || credentials.username,
              email: `${response.userName || credentials.username}@restaurante.com`,
              role: mappedRole
            };
            console.log('✅ AuthService - Usuario creado:', user);
            this.setUser(user);
            // Guardar el id de usuario en localStorage para uso en la UI
            try {
              const idToStore = (response as any).idUser ? String((response as any).idUser) : String(userId);
              this.setIdUser(idToStore);
              console.log('✅ AuthService - idUser guardado en localStorage:', idToStore);
            } catch (err) {
              console.warn('⚠️ AuthService - No se pudo guardar idUser en localStorage:', err);
            }

            // Guardar credenciales para auto-renovación
            this.storeCredentials(credentials.username, credentials.password);

            // Iniciar auto-renovación
            this.startTokenRefresh();

            this.isAuthenticatedSubject.next(true);
            console.log('Login exitoso, token guardado y auto-renovación iniciada');
          } else {
            console.error('Respuesta del backend no contiene token válido:', response);
          }
        })
      );
  }

  /**
   * Registrar nuevo usuario
   */
  register(userData: UsuarioRequest): Observable<AuthenticationResponse> {
    console.log('🔐 AuthService - Registrando usuario:', userData);
    console.log('🔐 AuthService - URL del backend:', `${this.url}/auth/register`);

    return this.http.post<AuthenticationResponse>(`${this.url}/auth/register`, userData)
      .pipe(
        tap(response => {
          console.log('Respuesta del registro:', response);
          // Manejar el formato de respuesta del backend (directo sin content)
          if (response.token) {
            this.setToken(response.token);
            // Crear objeto usuario con los datos de la respuesta
            const userRole = response.role || userData.role;
            // Mapeo temporal: convertir USER a ADMIN para usuarios específicos
            let mappedRole = userRole;
            if (userData.userName === 'AngieC') {
              mappedRole = 'ADMIN';
            } else if (userRole === 'USER' || userRole === 'CLIENTE') {
              mappedRole = 'CLIENTE';
            }

            // Guardar el rol en localStorage
            localStorage.setItem('user_role', mappedRole);
            console.log('✅ AuthService - Registro - Rol guardado en localStorage:', mappedRole);

            const user = {
              id: 1,
              username: response.userName || userData.userName,
              email: userData.email,
              role: mappedRole
            };
            this.setUser(user);
            // Intentar guardar idUser si viene en la respuesta
            try {
              const idToStore = (response as any).idUser ? String((response as any).idUser) : String(user.id);
              this.setIdUser(idToStore);
              console.log('✅ AuthService - Registro - idUser guardado en localStorage:', idToStore);
            } catch (err) {
              console.warn('⚠️ AuthService - Registro - No se pudo guardar idUser en localStorage:', err);
            }

            // Guardar credenciales para auto-renovación
            this.storeCredentials(userData.userName, userData.password);

            // Iniciar auto-renovación
            this.startTokenRefresh();

            this.isAuthenticatedSubject.next(true);
            console.log('Registro exitoso, token guardado y auto-renovación iniciada');
          } else {
            console.error('Respuesta del registro no contiene token válido:', response);
          }
        })
      );
  }


  /**
   * Cerrar sesión
   */
  logout(): void {
    // Limpiar timer de renovación
    this.stopTokenRefresh();

    // Limpiar localStorage
    this.removeToken();
    this.removeUser();
    this.removeIdUser();
    this.removeCredentials();
    // Quitar otros datos relacionados con la sesión
    try {
      localStorage.removeItem('user_role');
      localStorage.removeItem('cart');
      console.log('✅ AuthService - logout: claves de sesión eliminadas de localStorage');
    } catch (err) {
      console.warn('⚠️ AuthService - logout: error eliminando claves adicionales de localStorage', err);
    }

    // Actualizar observables
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);

    console.log('Logout exitoso, timer de renovación detenido');
  }

  /**
   * Obtener token actual
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }




  /**
   * Verificar si está autenticado
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    const isAuth = this.hasValidToken(); // Usar validación normal para tokens de 8 horas
    console.log('🔍 AuthService - isAuthenticated:', isAuth);
    console.log('🔍 AuthService - Token en localStorage:', !!token);
    console.log('🔍 AuthService - Token value:', token ? token.substring(0, 20) + '...' : 'null');

    if (token) {
      const isExpired = this.isTokenExpired(token);
      console.log('🔍 AuthService - Token expirado:', isExpired);
      if (isExpired) {
        console.log('🚨 AuthService - Token expirado, haciendo logout');
        this.logout();
      }
    }

    return isAuth;
  }

  /**
   * Verificar si tiene un token válido (más permisivo para tokens de corta duración)
   */
  hasValidTokenPermissive(): boolean {
    const token = this.getToken();
    console.log('🔍 AuthService - hasValidTokenPermissive - Token existe:', !!token);

    if (!token) {
      console.log('🔍 AuthService - hasValidTokenPermissive - No hay token');
      return false;
    }

    try {
      const payload = this.decodeToken(token);
      if (!payload || !payload.exp) {
        console.log('🔍 AuthService - hasValidTokenPermissive - Token inválido (sin exp)');
        return false;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const tokenExp = payload.exp;
      const timeRemaining = tokenExp - currentTime;
      const totalDuration = tokenExp - payload.iat;

      console.log('🔍 AuthService - hasValidTokenPermissive - Tiempo restante:', timeRemaining, 'segundos');
      console.log('🔍 AuthService - hasValidTokenPermissive - Duración total del token:', totalDuration, 'segundos');

      // Solo considerar expirado si realmente expiró (no pre-validar)
      const isExpired = timeRemaining <= 0;
      console.log('🔍 AuthService - hasValidTokenPermissive - ¿Expirado?', isExpired);

      // Si el token tiene duración muy corta (menos de 5 minutos), ser más permisivo
      if (totalDuration < 300) {
        console.log('🔍 AuthService - hasValidTokenPermissive - Token de corta duración, siendo permisivo');
        return !isExpired; // Solo expirado si realmente expiró
      }

      // Para tokens de duración normal, usar validación estándar
      if (timeRemaining < 300) {
        console.log('🔍 AuthService - hasValidTokenPermissive - Token expira pronto, considerando como expirado');
        return false;
      }

      return !isExpired;
    } catch (error) {
      console.log('🔍 AuthService - hasValidTokenPermissive - Error decodificando token:', error);
      return false;
    }
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Verificar si el token ha expirado
   */
  private checkTokenExpiration(): void {
    const token = this.getToken();
    if (token && this.isTokenExpired(token)) {
      this.logout();
    }
  }

  /**
   * Verificar si el token ha expirado
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeToken(token);
      console.log('🔍 AuthService - isTokenExpired - Payload:', payload);

      if (!payload || !payload.exp) {
        console.log('🔍 AuthService - isTokenExpired - No payload o exp, token inválido');
        return true;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const tokenExp = payload.exp;
      const timeRemaining = tokenExp - currentTime;
      const isExpired = timeRemaining <= 0;

      console.log('🔍 AuthService - isTokenExpired - Tiempo actual:', currentTime);
      console.log('🔍 AuthService - isTokenExpired - Token expira en:', tokenExp);
      console.log('🔍 AuthService - isTokenExpired - Tiempo restante:', timeRemaining, 'segundos');
      console.log('🔍 AuthService - isTokenExpired - ¿Expirado?', isExpired);

      // Si el token expira en menos de 5 minutos, considerarlo como expirado
      if (timeRemaining < 300) {
        console.log('🔍 AuthService - isTokenExpired - Token expira pronto, considerando como expirado');
        return true;
      }

      return isExpired;
    } catch (error) {
      console.log('🔍 AuthService - isTokenExpired - Error decodificando token:', error);
      return true;
    }
  }

  /**
   * Decodificar token JWT
   */
  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      return null;
    }
  }

  /**
   * Verificar si tiene un token válido
   */
  private hasValidToken(): boolean {
    const token = this.getToken();
    console.log('🔍 AuthService - hasValidToken - Token existe:', !!token);

    if (!token) {
      console.log('🔍 AuthService - hasValidToken - No hay token');
      return false;
    }

    const isExpired = this.isTokenExpired(token);
    console.log('🔍 AuthService - hasValidToken - Token expirado:', isExpired);

    const isValid = !isExpired;
    console.log('🔍 AuthService - hasValidToken - Token válido:', isValid);

    return isValid;
  }

  /**
   * Guardar token en localStorage
   */
  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  /**
   * Guardar ID_USUARIO localStorage
   */
  private setIdUser(idUser: string): void {
    localStorage.setItem(this.idUserKey, idUser);
  }

  /**
   * Obtener idUser desde localStorage
   */
  public getIdUser(): string | null {
    return localStorage.getItem(this.idUserKey);
  }

  /**
   * Remover idUser de localStorage
   */
  private removeIdUser(): void {
    localStorage.removeItem(this.idUserKey);
  }

  /**
   * Remover token de localStorage
   */
  private removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  /**
   * Guardar usuario en localStorage
   */
  private setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }


  /**
   * Obtener usuario almacenado
   */
  private getStoredUser(): User | null {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Remover usuario de localStorage
   */
  private removeUser(): void {
    localStorage.removeItem(this.userKey);
  }


  /**
   * Método temporal para debuggear el estado de autenticación
   */
  debugAuthState(): void {
    const token = this.getToken();
    const isAuth = this.isAuthenticated();
    const hasValid = this.hasValidToken();
    const hasValidPermissive = this.hasValidTokenPermissive();

    console.log('🔍 DEBUG AuthService:');
    console.log('  - Token existe:', !!token);
    console.log('  - Token value:', token ? token.substring(0, 30) + '...' : 'null');
    console.log('  - isAuthenticated():', isAuth);
    console.log('  - hasValidToken():', hasValid);
    console.log('  - hasValidTokenPermissive():', hasValidPermissive);

    if (token) {
      try {
        const payload = this.decodeToken(token);
        console.log('  - Token payload:', payload);
        if (payload && payload.exp) {
          const currentTime = Math.floor(Date.now() / 1000);
          const timeRemaining = payload.exp - currentTime;
          console.log('  - Tiempo restante:', timeRemaining, 'segundos');
          console.log('  - ¿Expirado?', timeRemaining <= 0);
        }
      } catch (error) {
        console.log('  - Error decodificando token:', error);
      }
    }
  }

  /**
   * Verificar si el usuario tiene alguno de los roles especificados
   */
  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    const userRole = user?.role;

    console.log('🔍 AuthService - hasAnyRole - Usuario:', user);
    console.log('🔍 AuthService - hasAnyRole - Rol del usuario:', userRole);
    console.log('🔍 AuthService - hasAnyRole - Roles requeridos:', roles);

    const hasRole = userRole ? roles.includes(userRole) : false;

    console.log('🔍 AuthService - hasAnyRole - Tiene rol:', hasRole);

    // Debug específico para ADMIN
    if (userRole === 'ADMIN') {
      console.log('✅ AuthService - hasAnyRole - ADMIN detectado, verificando si está en roles requeridos');
      console.log('✅ AuthService - hasAnyRole - ADMIN en roles:', roles.includes('ADMIN'));
    }

    return hasRole;
  }

  /**
   * Verificar y renovar token si es necesario
   */
  checkAndRenewToken(): Observable<boolean> {
    const token = this.getToken();

    if (!token) {
      console.log('🔍 No hay token, usuario no autenticado');
      this.isAuthenticatedSubject.next(false);
      return new Observable(observer => observer.next(false));
    }

    // Verificar si el token está cerca de expirar (menos de 5 minutos)
    const isExpired = this.isTokenExpired(token);
    if (isExpired) {
      console.log('🔍 Token expirado, intentando renovar...');
      return this.refreshTokenObservable();
    }

    // Token válido
    this.isAuthenticatedSubject.next(true);
    return new Observable(observer => observer.next(true));
  }

  /**
   * Renovar token como Observable
   */
  private refreshTokenObservable(): Observable<boolean> {
    const credentials = this.getStoredCredentials();
    if (!credentials) {
      console.log('❌ No hay credenciales para renovar token');
      this.logout();
      return new Observable(observer => observer.next(false));
    }

    return this.http.post<LoginResponse>(`${this.url}/auth/login`, credentials).pipe(
      map((response: LoginResponse) => {
        if (response.token) {
          this.setToken(response.token);
          // Convertir idUser a string si es necesario
          const idUserString = typeof response.idUser === 'number' ? String(response.idUser) : response.idUser;
          this.setIdUser(idUserString);
          this.isAuthenticatedSubject.next(true);
          console.log('✅ Token renovado exitosamente');
          return true;
        } else {
          console.log('❌ Error renovando token: respuesta inválida');
          this.logout();
          return false;
        }
      }),
      catchError((error: any) => {
        console.error('❌ Error renovando token:', error);
        this.logout();
        return new Observable<boolean>(observer => observer.next(false));
      })
    );
  }

  // ==================== AUTO-RENOVACIÓN DE TOKENS ====================

  /**
   * Iniciar auto-renovación de tokens
   */
  private startTokenRefresh(): void {
    // Limpiar timer anterior si existe
    this.stopTokenRefresh();

    console.log('🔄 Iniciando auto-renovación de tokens cada', this.refreshInterval / 1000, 'segundos');

    // Renovar token cada 20 segundos
    this.refreshTimer = setInterval(() => {
      if (this.hasValidTokenPermissive()) {
        this.refreshToken();
      }
    }, this.refreshInterval);
  }

  /**
   * Detener auto-renovación de tokens
   */
  private stopTokenRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
      console.log('🛑 Auto-renovación de tokens detenida');
    }
  }

  /**
   * Renovar token automáticamente
   */
  private refreshToken(): void {
    if (this.isRefreshing) {
      console.log('🔄 Ya se está renovando el token, saltando...');
      return;
    }

    this.isRefreshing = true;
    console.log('🔄 Renovando token automáticamente...');

    const credentials = this.getStoredCredentials();
    if (credentials) {
      console.log('🔄 AuthService - Renovando token automáticamente con URL:', `${this.url}/auth/login`);
      this.http.post<LoginResponse>(`${this.url}/auth/login`, credentials)
        .subscribe({
          next: (response) => {
            if (response.token) {
              this.setToken(response.token);
              console.log('✅ Token renovado automáticamente');
            }
            this.isRefreshing = false;
          },
          error: (error) => {
            console.error('❌ Error renovando token:', error);
            this.logout();
          }
        });
    } else {
      console.log('❌ No hay credenciales guardadas para renovación');
      this.logout();
    }
  }

  /**
   * Guardar credenciales para renovación automática
   */
  private storeCredentials(username: string, password: string): void {
    try {
      // Encriptar credenciales antes de guardar
      const credentials = { username, password };
      const encrypted = btoa(JSON.stringify(credentials));
      localStorage.setItem(this.credentialsKey, encrypted);
      console.log('🔐 Credenciales guardadas para auto-renovación');
    } catch (error) {
      console.error('❌ Error guardando credenciales:', error);
    }
  }

  /**
   * Obtener credenciales guardadas
   */
  private getStoredCredentials(): LoginRequest | null {
    try {
      const encrypted = localStorage.getItem(this.credentialsKey);
      if (encrypted) {
        const decrypted = JSON.parse(atob(encrypted));
        return decrypted;
      }
    } catch (error) {
      console.error('❌ Error obteniendo credenciales:', error);
    }
    return null;
  }

  /**
   * Remover credenciales guardadas
   */
  private removeCredentials(): void {
    localStorage.removeItem(this.credentialsKey);
  }

  /**
   * Obtener tiempo restante del token
   */
  getTokenTimeRemaining(): number {
    const token = this.getToken();
    if (!token) return 0;

    try {
      const payload = this.decodeToken(token);
      if (!payload || !payload.exp) return 0;

      const currentTime = Math.floor(Date.now() / 1000);
      return Math.max(0, payload.exp - currentTime);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Verificar si se está renovando el token
   */
  get isRefreshingToken(): boolean {
    return this.isRefreshing;
  }

  /**
   * Debug específico para verificar permisos de usuario
   */
  debugUserPermissions(): void {
    const user = this.getCurrentUser();
    const token = this.getToken();

    console.log('🔍 === DEBUG PERMISOS USUARIO ===');
    console.log('🔍 Usuario actual:', user);
    console.log('🔍 Rol:', user?.role);
    console.log('🔍 Token presente:', !!token);
    console.log('🔍 Token (primeros 50 chars):', token ? token.substring(0, 50) + '...' : 'null');

    if (token) {
      try {
        const payload = this.decodeToken(token);
        console.log('🔍 Payload del token:', payload);
        console.log('🔍 Subject del token:', payload?.sub);
        console.log('🔍 Expiración:', payload?.exp ? new Date(payload.exp * 1000) : 'No disponible');
      } catch (error) {
        console.error('🔍 Error decodificando token:', error);
      }
    }

    console.log('🔍 ================================');
  }
}
