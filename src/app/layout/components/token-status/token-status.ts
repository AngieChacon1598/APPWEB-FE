import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-token-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './token-status.html',
  styleUrl: './token-status.scss'
})
export class TokenStatusComponent implements OnInit, OnDestroy {
  timeRemaining = 0;
  isRefreshing = false;
  isAuthenticated = false;
  userId: number | null = null;
  userName: string = '';

  private timerSubscription?: Subscription;
  private authSubscription?: Subscription;
  private currentUserSubscription?: Subscription;

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    // Suscribirse a cambios de autenticación
    this.authSubscription = this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
      if (isAuth) {
        this.startTimer();
      } else {
        this.stopTimer();
      }
    });

    // Suscribirse al usuario actual para obtener id/nombre
    this.currentUserSubscription = this.authService.currentUser$.subscribe(user => {
      this.userId = user?.id ?? null;
      this.userName = user?.username ?? '';
      // Si no hay id en currentUser, intentar leer idUser desde localStorage
      if (this.userId === null) {
        const stored = this.authService.getIdUser();
        if (stored) {
          const parsed = parseInt(stored, 10);
          this.userId = isNaN(parsed) ? null : parsed;
        }
      }
    });

    // Actualizar estado inicial
    this.updateStatus();
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.authSubscription?.unsubscribe();
    this.currentUserSubscription?.unsubscribe();
  }

  private startTimer(): void {
    this.stopTimer();

    // Actualizar cada segundo
    this.timerSubscription = interval(1000).subscribe(() => {
      this.updateStatus();
    });
  }

  private stopTimer(): void {
    this.timerSubscription?.unsubscribe();
  }

  private updateStatus(): void {
    if (this.isAuthenticated) {
      this.timeRemaining = this.authService.getTokenTimeRemaining();
      this.isRefreshing = this.authService.isRefreshingToken;
    } else {
      this.timeRemaining = 0;
      this.isRefreshing = false;
    }
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getStatusColor(): string {
    if (this.timeRemaining > 20) return 'green';
    if (this.timeRemaining > 10) return 'orange';
    return 'red';
  }

  getStatusText(): string {
    if (this.isRefreshing) return 'Renovando...';
    if (this.timeRemaining <= 0) return 'Expirado';
    return this.formatTime(this.timeRemaining);
  }
}
