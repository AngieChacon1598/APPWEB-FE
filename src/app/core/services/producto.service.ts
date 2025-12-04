import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { baseUrl } from '../../../environments/conexion';
import { Observable } from 'rxjs';

export interface Producto {
  menuId: number;
  imagenUrl: string; // Cambiado de imageUrl a imagenUrl
  name: string;
  description: string;
  price: number;
  state: number; // 1 = Activo, 0 = Inactivo
  categoryId: number;
  createdAt: string;
  updatedAt: string;
  category: {
    categoryId: number;
    name: string;
    description: string;
  };
}

export interface ProductoRequest {
  imagenUrl?: string; // Cambiado de imageUrl a imagenUrl
  name: string;
  description: string;
  price: number;
  state?: number; // 1 = Activo, 0 = Inactivo
  categoryId: number;
}

export interface ProductoUpdateRequest {
  menuId: number;
  imagenUrl: string;
  name: string;
  description: string;
  price: number;
  state: number;
  categoryId: number;
}

export interface ProductoResponse {
  status: boolean;
  mensaje: string;
  content: Producto[] | Producto | null;
}

export interface ProductoPageResponse {
  content: Producto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private readonly http = inject(HttpClient)

  private readonly url = `${baseUrl.desarrollo}/api/menu`

  // READ - Consultar productos
  getProductos(params: any = {}): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.url}`, { params });
  }

  // Métodos con paginación
  getProductosPaginados(page: number = 0, size: number = 10): Observable<Producto[] | ProductoPageResponse> {
    return this.http.get<Producto[] | ProductoPageResponse>(`${this.url}`, {
      params: { page: page.toString(), size: size.toString() }
    });
  }

  getProductosActivosPaginados(page: number = 0, size: number = 10): Observable<Producto[] | ProductoPageResponse> {
    return this.http.get<Producto[] | ProductoPageResponse>(`${this.url}`, {
      params: { page: page.toString(), size: size.toString() }
    });
  }

  getProductosTodosPaginados(page: number = 0, size: number = 10): Observable<Producto[] | ProductoPageResponse> {
    return this.http.get<Producto[] | ProductoPageResponse>(`${this.url}/all`, {
      params: { page: page.toString(), size: size.toString() }
    });
  }

  getProductosInactivosPaginados(page: number = 0, size: number = 10): Observable<Producto[] | ProductoPageResponse> {
    return this.http.get<Producto[] | ProductoPageResponse>(`${this.url}/inactive`, {
      params: { page: page.toString(), size: size.toString() }
    });
  }

  getProductosActivos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.url}`);
  }

  getProductosTodos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.url}/all`);
  }

  getProductosInactivos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.url}/inactive`);
  }

  getProductoById(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.url}/${id}`);
  }

  getProductosPorCategoria(categoryId: number): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.url}/category/${categoryId}`);
  }

  buscarProductos(nombre: string): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.url}/search`, { 
      params: { name: nombre } 
    });
  }

  getProductosPorRangoPrecio(minPrice: number, maxPrice: number): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.url}/price-range`, { 
      params: { minPrice: minPrice.toString(), maxPrice: maxPrice.toString() } 
    });
  }

  // Métodos adicionales para compatibilidad
  getAllProducts(): Observable<Producto[]> {
    return this.getProductosActivos();
  }

  getAllCategories(): Observable<any> {
    // Retornar categorías basadas en el ejemplo del backend
    return new Observable(observer => {
      observer.next([
        { categoryId: 1, name: 'Entradas', description: 'Platos de entrada y aperitivos' },
        { categoryId: 2, name: 'Platos Principales', description: 'Platos principales del menú' },
        { categoryId: 3, name: 'Postres', description: 'Dulces y postres tradicionales' },
        { categoryId: 4, name: 'Bebidas', description: 'Bebidas y refrescos' }
      ]);
      observer.complete();
    });
  }

  // CREATE - Crear producto (solo ADMIN y EMPLEADO)
  createProducto(productoData: ProductoRequest): Observable<Producto> {
    return this.http.post<Producto>(`${this.url}`, productoData);
  }

  // UPDATE - Actualizar producto (solo ADMIN y EMPLEADO)
  updateProducto(id: number, productoData: ProductoUpdateRequest): Observable<Producto> {
    return this.http.put<Producto>(`${this.url}/${id}`, productoData);
  }

  // DELETE - Eliminar producto (solo ADMIN y EMPLEADO)
  deleteProductoLogico(id: number): Observable<any> {
    return this.http.delete(`${this.url}/logical/${id}`);
  }

  deleteProductoFisico(id: number): Observable<any> {
    return this.http.delete(`${this.url}/physical/${id}`);
  }

  // RESTORE - Restaurar producto (solo ADMIN)
  restaurarProducto(id: number): Observable<Producto> {
    return this.http.put<Producto>(`${this.url}/restore/${id}`, {});
  }

  // Métodos de compatibilidad
  setSaveProducto(productoDto: ProductoRequest) {
    return this.createProducto(productoDto);
  }

  setUpdateProducto(id: number, data: ProductoUpdateRequest): Observable<Producto> {
    return this.updateProducto(id, data);
  }

  setDeleteProducto(id: number): Observable<any> {
    return this.deleteProductoLogico(id);
  }

  // Métodos adicionales para compatibilidad con componentes existentes
  createProduct(productoData: ProductoRequest): Observable<Producto> {
    return this.createProducto(productoData);
  }

  updateProduct(id: number, productoData: ProductoUpdateRequest): Observable<Producto> {
    return this.updateProducto(id, productoData);
  }

  getProductById(id: number): Observable<Producto> {
    return this.getProductoById(id);
  }

  // Método de compatibilidad para eliminar (usar eliminación lógica por defecto)
  deleteProducto(id: number): Observable<any> {
    return this.deleteProductoLogico(id);
  }
}