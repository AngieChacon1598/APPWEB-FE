import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CartItem {
  menuId: number;
  name: string;
  description: string;
  price: number;
  imagenUrl?: string;
  quantity: number;
  subtotal: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems: CartItem[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  public cart$: Observable<CartItem[]> = this.cartSubject.asObservable();

  constructor() {
    // Cargar carrito desde localStorage al iniciar
    this.loadCartFromStorage();
  }

  /**
   * Agrega un producto al carrito
   */
  addItem(product: any, quantity: number = 1): void {
    const existingItem = this.cartItems.find(item => item.menuId === product.menuId);

    if (existingItem) {
      // Si el producto ya existe, aumentar la cantidad
      existingItem.quantity += quantity;
      existingItem.subtotal = existingItem.price * existingItem.quantity;
    } else {
      // Si es un producto nuevo, agregarlo
      const newItem: CartItem = {
        menuId: product.menuId,
        name: product.name,
        description: product.description || '',
        price: product.price,
        imagenUrl: product.imagenUrl || product.imageUrl,
        quantity: quantity,
        subtotal: product.price * quantity
      };
      this.cartItems.push(newItem);
    }

    this.updateCart();
  }

  /**
   * Elimina un producto del carrito
   */
  removeItem(menuId: number): void {
    this.cartItems = this.cartItems.filter(item => item.menuId !== menuId);
    this.updateCart();
  }

  /**
   * Actualiza la cantidad de un producto en el carrito
   */
  updateQuantity(menuId: number, quantity: number): void {
    const item = this.cartItems.find(item => item.menuId === menuId);
    if (item) {
      if (quantity <= 0) {
        this.removeItem(menuId);
      } else {
        item.quantity = quantity;
        item.subtotal = item.price * quantity;
        this.updateCart();
      }
    }
  }

  /**
   * Limpia todo el carrito
   */
  clearCart(): void {
    this.cartItems = [];
    this.updateCart();
  }

  /**
   * Obtiene todos los items del carrito
   */
  getItems(): CartItem[] {
    return [...this.cartItems];
  }

  /**
   * Obtiene el número total de productos en el carrito
   */
  getTotalItems(): number {
    return this.cartItems.reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * Calcula el subtotal del carrito
   */
  getSubtotal(): number {
    return this.cartItems.reduce((total, item) => total + item.subtotal, 0);
  }

  /**
   * Calcula el IGV (18%)
   */
  getIGV(): number {
    return this.getSubtotal() * 0.18;
  }

  /**
   * Calcula el total con IGV
   */
  getTotal(): number {
    return this.getSubtotal() + this.getIGV();
  }

  /**
   * Actualiza el carrito y guarda en localStorage
   */
  private updateCart(): void {
    this.cartSubject.next([...this.cartItems]);
    this.saveCartToStorage();
  }

  /**
   * Guarda el carrito en localStorage
   */
  private saveCartToStorage(): void {
    try {
      localStorage.setItem('cart', JSON.stringify(this.cartItems));
    } catch (error) {
      console.error('Error guardando carrito en localStorage:', error);
    }
  }

  /**
   * Carga el carrito desde localStorage
   */
  private loadCartFromStorage(): void {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        this.cartItems = JSON.parse(savedCart);
        this.updateCart();
      }
    } catch (error) {
      console.error('Error cargando carrito desde localStorage:', error);
      this.cartItems = [];
    }
  }
}

