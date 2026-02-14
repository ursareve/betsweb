import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { shareReplay, tap, map, startWith } from 'rxjs/operators';
import { User, CreateUserData, UpdateUserData } from '../../models/user.model';
import { UserRepository } from '../repositories/user.repository';
import { StorageService } from './storage.service';
import { AuthService } from '../../services/auth.service';
import { NotificationServerService } from './notification-server.service';

export interface UserWithOnlineStatus extends User {
  online: boolean;
}

@Injectable()
export class UserService {
  private usersSubject = new BehaviorSubject<User[]>([]);
  private usersCache$: Observable<User[]> | null = null;
  public users$: Observable<UserWithOnlineStatus[]>;

  constructor(
    private repository: UserRepository,
    private storageService: StorageService,
    private authService: AuthService,
    private notificationServer: NotificationServerService
  ) {
    // Combinar usuarios con estado online
    this.users$ = combineLatest([
      this.usersSubject.asObservable(),
      this.notificationServer.onlineUsers$.pipe(startWith({ count: 0, users: [] }))
    ]).pipe(
      map(([users, onlineData]) => {
        // Solo emitir si hay usuarios cargados
        if (users.length === 0) return [];
        
        const onlineUserIds = onlineData.users;
        return users.map(user => ({
          ...user,
          online: onlineUserIds.includes(user.uid)
        }));
      })
    );
  }

  loadUsers(): Observable<UserWithOnlineStatus[]> {
    if (!this.usersCache$) {
      this.usersCache$ = this.repository.getAllUsers().pipe(
        tap(users => this.usersSubject.next(users)),
        shareReplay(1)
      );
    }
    return this.usersCache$.pipe(
      map(users => users.map(user => ({ ...user, online: false })))
    );
  }

  refreshUsers(): Observable<UserWithOnlineStatus[]> {
    this.usersCache$ = null;
    return this.loadUsers();
  }

  createUser(userData: CreateUserData): Promise<User> {
    return this.repository.createUser(userData);
  }

  getUser(uid: string): Promise<User | null> {
    return this.repository.getUser(uid);
  }

  getAllUsers(): Observable<User[]> {
    return this.repository.getAllUsers();
  }

  getUsersByRole(role: string): Observable<User[]> {
    return this.repository.getUsersByRole(role);
  }

  updateUser(uid: string, userData: UpdateUserData): Promise<void> {
    return this.repository.updateUser(uid, userData);
  }

  deleteUser(uid: string): Promise<void> {
    return this.repository.deleteUser(uid);
  }

  toggleUserStatus(uid: string, active: boolean): Promise<void> {
    return this.repository.toggleUserStatus(uid, active);
  }

  uploadAvatar(file: File, uid: string): Promise<string> {
    return this.storageService.uploadUserAvatar(file, uid);
  }

  deleteAvatar(uid: string): Promise<void> {
    return this.storageService.deleteUserAvatar(uid);
  }

  resetPassword(email: string): Promise<void> {
    return this.authService.resetPassword(email);
  }

  resetUserSessions(uid: string): Promise<void> {
    return this.repository.updateUser(uid, {
      activeSessionsCount: 0,
      hasActiveSession: false
    });
  }

  forceLogoutUser(uid: string): Promise<void> {
    return this.authService.forceLogoutUser(uid);
  }
}
