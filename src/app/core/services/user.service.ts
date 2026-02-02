import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User, CreateUserData, UpdateUserData } from '../../models/user.model';
import { UserRepository } from '../repositories/user.repository';
import { StorageService } from './storage.service';
import { AuthService } from '../../services/auth.service';

@Injectable()
export class UserService {
  constructor(
    private repository: UserRepository,
    private storageService: StorageService,
    private authService: AuthService
  ) {}

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
