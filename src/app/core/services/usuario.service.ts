import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { baseUrl } from '../../../environments/conexion';
import { BaseUser, PageRestaurantUser, UsuarioRequest, UsuarioBackendRequest, TypeUsers } from '../models/usuario.models';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private readonly http = inject(HttpClient)

  private readonly url = `${baseUrl.desarrollo}/restaurantuser`
  private readonly typeUserUrl = `${baseUrl.desarrollo}/typeuser`

  // READ - Consultar usuarios
  getAllUsers(params: any) {
    return this.http.get<PageRestaurantUser>(`${this.url}/listar-restaurant-user`, { params })
  }


  getUserById(id: number) {
    return this.http.get<any>(`${this.url}/${id}`);
  }

  getUsersByState(estado: string, params: any) {
    return this.http.get<PageRestaurantUser>(`${this.url}/listar-por-estado?estado=${estado}`, { params });
  }

  getAllUserTypes() {
    return this.http.get<TypeUsers[]>(`${this.typeUserUrl}/listar-usuario`);
  }

  // CREATE - Crear usuarios (endpoint unificado)
  createUser(payload: UsuarioBackendRequest) {
    return this.http.post<any>(`${this.url}/crear`, payload);
  }

  // Métodos de compatibilidad (mantener para no romper código existente)
  createClient(payload: UsuarioRequest) {
    const backendPayload: UsuarioBackendRequest = {
      username: payload.userName,
      password: payload.password,
      names: payload.names,
      lastName: payload.lastName,
      birthDate: payload.birthDate,
      address: payload.address,
      email: payload.email,
      typeDocument: payload.typeDocument,
      numberDocument: payload.numberDocument,
      role: payload.role
    };
    return this.createUser(backendPayload);
  }

  createEmployee(payload: UsuarioRequest) {
    const backendPayload: UsuarioBackendRequest = {
      username: payload.userName,
      password: payload.password,
      names: payload.names,
      lastName: payload.lastName,
      birthDate: payload.birthDate,
      address: payload.address,
      email: payload.email,
      typeDocument: payload.typeDocument,
      numberDocument: payload.numberDocument,
      role: payload.role
    };
    return this.createUser(backendPayload);
  }

  createAdmin(payload: UsuarioRequest) {
    const backendPayload: UsuarioBackendRequest = {
      username: payload.userName,
      password: payload.password,
      names: payload.names,
      lastName: payload.lastName,
      birthDate: payload.birthDate,
      address: payload.address,
      email: payload.email,
      typeDocument: payload.typeDocument,
      numberDocument: payload.numberDocument,
      role: payload.role
    };
    return this.createUser(backendPayload);
  }

  // UPDATE - Actualizar usuario
  updateUser(userId: number, payload: any) {
    return this.http.put<any>(`${this.url}/actualizar/${userId}`, payload);
  }

  // DELETE - Eliminación lógica y física
  inactivateUser(userId: number) {
    return this.http.patch<any>(`${this.url}/inactivar/${userId}`, {});
  }

  restoreUser(userId: number) {
    return this.http.patch<any>(`${this.url}/restaurar/${userId}`, {});
  }

  // Métodos de debugging para diagnosticar problemas de autenticación
  debugAuth(): Observable<any> {
    return this.http.get<any>(`${this.url}/debug-auth`);
  }

  getMiRol(): Observable<any> {
    return this.http.get<any>(`${this.url}/mi-rol`);
  }

  deleteUser(userId: number) {
    return this.http.delete<any>(`${this.url}/eliminar/${userId}`);
  }

  // Métodos de compatibilidad (para mantener funcionalidad existente)
  setSaveUser(payload: BaseUser) {
    return this.http.post<BaseUser>(`${this.url}/crear-empleado`, payload);
  }

  registerUser(payload: UsuarioRequest) {
    return this.http.post<any>(`${baseUrl.desarrollo}/api/auth/register`, payload);
  }

  getUserSales(userId: number) {
    return this.http.get<any>(`${baseUrl.desarrollo}/api/sales/user/${userId}`);
  }

  testProtectedEndpoint() {
    return this.http.get<any>(`${baseUrl.desarrollo}/api/test/protected`);
  }

}