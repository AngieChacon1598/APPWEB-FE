import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { MesaService } from '../services/mesa.service';
import { MesaRestaurante } from '../models/mesa.models';
import { map } from 'rxjs/operators';

/**
 * Resolver para precargar todas las mesas
 */
export const mesasResolver: ResolveFn<MesaRestaurante[]> = (route, state) => {
  const mesaService = inject(MesaService);
  return mesaService.getMesasByState('A').pipe(
    map(response => response.content || [])
  );
};

/**
 * Resolver para precargar mesas por estado
 */
export const mesasByStatusResolver: ResolveFn<MesaRestaurante[]> = (route, state) => {
  const mesaService = inject(MesaService);
  const estado = route.queryParamMap.get('estado') || 'A';
  return mesaService.getMesasByState(estado).pipe(
    map(response => response.content || [])
  );
};
