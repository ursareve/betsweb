import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { UserService } from '../core/services/user.service';

@Injectable({
  providedIn: 'root'
})
export class SuperadminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    const firebaseUser = this.authService.getCurrentUser();
    if (!firebaseUser) {
      this.router.navigate(['/login']);
      return false;
    }

    const user = await this.userService.getUser(firebaseUser.uid);
    if (user?.role === 'superadmin') {
      return true;
    }

    this.router.navigate(['/']);
    return false;
  }
}
