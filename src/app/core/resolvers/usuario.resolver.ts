import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { UsuarioService } from '../services/usuario.service';
import { PageRestaurantUser } from '../models/usuario.models';

/**
 * Resolver para precargar todos los usuarios
 */
export const usuariosResolver: ResolveFn<PageRestaurantUser> = (route, state) => {
  const usuarioService = inject(UsuarioService);
  const params = {
    page: route.queryParamMap.get('page') || '0',
    size: route.queryParamMap.get('size') || '10'
  };
  return usuarioService.getAllUsers(params);
};
