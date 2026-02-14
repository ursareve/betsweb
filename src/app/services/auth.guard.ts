import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

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
    return this.authService.user$.pipe(
      take(1),
      map(user => {
        if (user) {
          return true;
        } else {
          localStorage.removeItem('isLoggedIn');
          this.snackBar.open('Debes iniciar sesión para acceder', 'OK', { duration: 3000 });
          this.router.navigate(['/login']);
          return false;
        }
      })
    );
  }
}