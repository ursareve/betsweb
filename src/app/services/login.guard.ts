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
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (isLoggedIn) {
      this.router.navigate(['/dashboard']);
      return of(false);
    }
    this.router.navigate(['/login']);
    return of(false);
  }
}