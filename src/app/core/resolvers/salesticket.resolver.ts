import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { SalesTicketService } from '../services/salesticket.service';
import { SalesTicketDTO } from '../models/salesticket.models';

/**
 * Resolver para precargar todos los tickets de venta
 */
export const salesTicketsResolver: ResolveFn<SalesTicketDTO[]> = (route, state) => {
  const salesTicketService = inject(SalesTicketService);
  return salesTicketService.getActiveSalesTickets();
};

/**
 * Resolver para precargar un ticket de venta específico por ID
 */
export const salesTicketResolver: ResolveFn<SalesTicketDTO> = (route, state) => {
  const salesTicketService = inject(SalesTicketService);
  const id = Number(route.paramMap.get('id'));
  return salesTicketService.getSalesTicketById(id);
};

/**
 * Resolver para precargar tickets de venta paginados
 */
export const salesTicketsPaginatedResolver: ResolveFn<any> = (route, state) => {
  const salesTicketService = inject(SalesTicketService);
  const page = Number(route.queryParamMap.get('page')) || 0;
  const size = Number(route.queryParamMap.get('size')) || 10;
  return salesTicketService.getSalesTicketsPaginated(page, size);
};
