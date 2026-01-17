import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {
  
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    // Permitir acceso inmediato, verificar después
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      setTimeout(() => this.router.navigate(['/dashboard']), 0);
    }
    return of(true);
  }
}