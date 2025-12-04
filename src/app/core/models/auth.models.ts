export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthenticationRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  role: string;
  userName: string;
  userId?: number; // ID del usuario si está disponible en la respuesta
  idUser: number | string; // ID del usuario (puede venir como número o string)
}

export interface AuthenticationResponse {
  token: string;
  role: string;
  userName: string;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  role?: string;
}
