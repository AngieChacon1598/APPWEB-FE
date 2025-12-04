import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { ProductoService, Producto } from '../services/producto.service';
import { map } from 'rxjs/operators';

/**
 * Resolver para precargar todos los productos
 */
export const productsResolver: ResolveFn<Producto[]> = (route, state) => {
  const productoService = inject(ProductoService);
  return productoService.getAllProducts();
};

/**
 * Resolver para precargar categorías
 */
export const categoriesResolver: ResolveFn<any[]> = (route, state) => {
  const productoService = inject(ProductoService);
  return productoService.getAllCategories();
};

/**
 * Resolver para precargar un producto específico por ID
 */
export const productResolver: ResolveFn<Producto> = (route, state) => {
  const productoService = inject(ProductoService);
  const id = Number(route.paramMap.get('id'));
  return productoService.getProductById(id);
};
