import { Component, HostBinding, HostListener, Input, OnDestroy, OnInit, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SidenavItem } from './sidenav-item/sidenav-item.interface';
import { SidenavService } from './sidenav.service';
import { ThemeService } from '../../../@fury/services/theme.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../core/services/user.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'fury-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss']
})
export class SidenavComponent implements OnInit, OnDestroy {

  sidenavUserVisible$ = this.themeService.config$.pipe(map(config => config.sidenavUserVisible));
  currentUser: User | null = null;

  @Input()
  @HostBinding('class.collapsed')
  collapsed: boolean;

  @Input()
  @HostBinding('class.expanded')
  expanded: boolean;

  @Output() openConfig = new EventEmitter();

  items$: Observable<SidenavItem[]>;

  constructor(private router: Router,
              private sidenavService: SidenavService,
              private themeService: ThemeService,
              private authService: AuthService,
              private userService: UserService) {
  }

  ngOnInit() {
    this.items$ = this.sidenavService.items$.pipe(
      map((items: SidenavItem[]) => this.sidenavService.sortRecursive(items, 'position'))
    );
    this.authService.user$.subscribe(firebaseUser => {
      if (firebaseUser) {
        this.loadCurrentUser(firebaseUser.uid);
      }
    });
  }

  async loadCurrentUser(uid: string) {
    try {
      this.currentUser = await this.userService.getUser(uid);
    } catch (error) {
      console.error('Error al cargar usuario en sidenav:', error);
    }
  }

  getAvatarUrl(): string {
    if (this.currentUser?.avatarUrl) {
      return this.currentUser.avatarUrl;
    }
    return this.currentUser 
      ? `https://ui-avatars.com/api/?name=${this.currentUser.firstName}+${this.currentUser.lastName}&background=random`
      : 'assets/img/avatars/noavatar.png';
  }

  toggleCollapsed() {
    this.sidenavService.toggleCollapsed();
  }

  @HostListener('mouseenter')
  @HostListener('touchenter')
  onMouseEnter() {
    this.sidenavService.setExpanded(true);
  }

  @HostListener('mouseleave')
  @HostListener('touchleave')
  onMouseLeave() {
    this.sidenavService.setExpanded(false);
  }

  ngOnDestroy() {
  }

  async logout() {
    try {
      await this.authService.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  isSuperAdmin(): boolean {
    return this.currentUser?.role === 'superadmin';
  }

  onOpenConfig() {
    this.openConfig.emit();
  }
}
