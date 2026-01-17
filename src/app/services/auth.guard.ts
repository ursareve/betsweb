import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private authService: AuthService, 
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  canActivate(): Observable<boolean> {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      return of(true);
    } else {
      this.snackBar.open('Debes iniciar sesión para acceder', 'OK', { duration: 3000 });
      this.router.navigate(['/login']);
      return of(false);
    }
  }
}