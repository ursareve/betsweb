import { Injectable } from '@angular/core';
import { UserRepository } from '../../domain/repositories/user.repository';
import { User } from '../../domain/models/user.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private userRepository: UserRepository) {}

  getUsers(): Observable<User[]> {
    return this.userRepository.getAll();
  }

  getUserById(id: string): Observable<User | null> {
    return this.userRepository.getById(id);
  }

  getUsersByRole(role: string): Observable<User[]> {
    return this.userRepository.getByField('role', role);
  }

  createUser(user: User): Promise<void> {
    return this.userRepository.create(user);
  }

  updateUser(id: string, user: Partial<User>): Promise<void> {
    return this.userRepository.update(id, user);
  }

  deleteUser(id: string): Promise<void> {
    return this.userRepository.delete(id);
  }

  async resetUserSessions(uid: string): Promise<void> {
    return this.userRepository.update(uid, {
      activeSessionsCount: 0,
      hasActiveSession: false
    });
  }
}
