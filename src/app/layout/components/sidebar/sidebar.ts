import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { LoadingComponent } from '../../../shared/components/loading/loading';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, LoadingComponent],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar implements OnInit, OnDestroy {
  currentUser: any = null;
  cartItemCount: number = 0;
  private cartSubscription?: Subscription;
  private authSubscription?: Subscription;

  constructor(
    private readonly authService: AuthService,
    private readonly cartService: CartService,
    private readonly router: Router
  ) { }

  ngOnInit(): void {
    // Suscribirse a cambios en el usuario actual
    this.authSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Suscribirse a cambios en el carrito
    this.cartSubscription = this.cartService.cart$.subscribe(items => {
      this.cartItemCount = this.cartService.getTotalItems();
    });
  }

  ngOnDestroy(): void {
    this.cartSubscription?.unsubscribe();
    this.authSubscription?.unsubscribe();
  }

  /**
   * Ir al formulario de ventas con el carrito
   */
  goToCart(): void {
    this.router.navigate(['/salesticket/form']);
  }

  /**
   * Helpers para control por roles en la UI
   */
  isAdmin(): boolean {
    return !!this.currentUser && (this.currentUser.role === 'ADMIN' || localStorage.getItem('user_role') === 'ADMIN');
  }

  isEmpleado(): boolean {
    return !!this.currentUser && (this.currentUser.role === 'EMPLEADO' || localStorage.getItem('user_role') === 'EMPLEADO');
  }

  isCliente(): boolean {
    return !!this.currentUser && (this.currentUser.role === 'CLIENTE' || localStorage.getItem('user_role') === 'CLIENTE');
  }

  hasRole(roles: string[]): boolean {
    // Preferir el observable/currentUser, fallback a localStorage
    if (this.currentUser?.role) {
      return roles.includes(this.currentUser.role);
    }
    const stored = localStorage.getItem('user_role');
    return stored ? roles.includes(stored) : false;
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Obtener nombre del usuario
   */
  getUserName(): string {
    return this.currentUser?.username || 'Usuario';
  }

  /**
   * Obtener el label del menú según el rol del usuario
   */
  getMenuLabel(): string {
    if (this.isAdmin()) {
      return 'Nuestra Carta';
    } else if (this.isCliente()) {
      return 'Ver Carta';
    } else {
      return 'Menus';
    }
  }
}
