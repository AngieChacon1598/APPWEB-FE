import { Injectable } from '@angular/core';
import {
  ValidationError,
  BusinessError,
  AuthenticationError,
  NotFoundError
} from '../errors';

/**
 * Ejemplo de servicio que usa las clases de error personalizadas
 *
 * Este archivo es solo una guía de implementación.
 * Cópialo y adáptalo a tus servicios específicos.
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlingExampleService {

  constructor() { }

  /**
   * Ejemplo 1: Validar datos y lanzar ValidationError
   */
  validateUserData(user: any): void {
    if (!user.username || user.username.trim() === '') {
      throw new ValidationError(
        'El nombre de usuario es requerido',
        'EMPTY_USERNAME'
      );
    }

    if (!user.email || !this.isValidEmail(user.email)) {
      throw new ValidationError(
        'El correo electrónico es inválido',
        'INVALID_EMAIL'
      );
    }

    if (!user.password || user.password.length < 6) {
      throw new ValidationError(
        'La contraseña debe tener al menos 6 caracteres',
        'WEAK_PASSWORD'
      );
    }
  }

  /**
   * Ejemplo 2: Error de negocio
   */
  processOrder(order: any): void {
    // Validación de negocio
    if (order.items.length === 0) {
      throw new BusinessError(
        'El pedido debe contener al menos un producto',
        'EMPTY_ORDER'
      );
    }

    // Validación de stock
    const insufficientStock = order.items.some((item: any) => !item.inStock);
    if (insufficientStock) {
      throw new BusinessError(
        'Algunos productos no están disponibles en stock',
        'INSUFFICIENT_STOCK'
      );
    }

    // Validación de disponibilidad
    if (!this.isDeliveryAvailable(order.address)) {
      throw new BusinessError(
        'No es posible entregar en la zona indicada',
        'DELIVERY_UNAVAILABLE'
      );
    }
  }

  /**
   * Ejemplo 3: Error de autenticación
   */
  verifyCredentials(username: string, password: string): void {
    if (!username || !password) {
      throw new AuthenticationError(
        'Usuario y contraseña son requeridos',
        'MISSING_CREDENTIALS'
      );
    }

    // Simular verificación fallida
    const isValid = this.authenticateUser(username, password);
    if (!isValid) {
      throw new AuthenticationError(
        'Las credenciales proporcionadas son inválidas',
        'INVALID_CREDENTIALS'
      );
    }
  }

  /**
   * Ejemplo 4: Error de recurso no encontrado
   */
  getProduct(productId: string): any {
    // Simular búsqueda
    const product = this.findProductById(productId);
    if (!product) {
      throw new NotFoundError(
        `El producto con ID ${productId} no existe`,
        'PRODUCT_NOT_FOUND'
      );
    }
    return product;
  }

  // Métodos auxiliares (simulados)
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isDeliveryAvailable(address: string): boolean {
    // Lógica de verificación
    return address.trim().length > 0;
  }

  private authenticateUser(username: string, password: string): boolean {
    // Lógica de autenticación
    return true;
  }

  private findProductById(productId: string): any {
    // Lógica de búsqueda
    return null;
  }
}

/**
 * EJEMPLOS DE USO EN COMPONENTES
 *
 * import { Component } from '@angular/core';
 * import { ErrorHandlingExampleService } from '../services/error-handling-example.service';
 *
 * @Component({...})
 * export class MyComponent {
 *   constructor(private exampleService: ErrorHandlingExampleService) {}
 *
 *   createUser(userData: any) {
 *     try {
 *       // Validar datos - si falla, lanza ValidationError
 *       this.exampleService.validateUserData(userData);
 *
 *       // Procesar pedido - si falla, lanza BusinessError
 *       // this.exampleService.processOrder(order);
 *
 *       // Verificar credenciales - si falla, lanza AuthenticationError
 *       // this.exampleService.verifyCredentials(user, pass);
 *
 *     } catch (error) {
 *       // El error será capturado por el GlobalErrorHandler del interceptor
 *       // automáticamente y se mostrará la alerta al usuario
 *       throw error;
 *     }
 *   }
 * }
 */
