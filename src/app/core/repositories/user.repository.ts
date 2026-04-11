import { Observable } from 'rxjs';
import { User, CreateUserData, UpdateUserData } from '../../models/user.model';

export abstract class UserRepository {
  abstract createUser(userData: CreateUserData): Promise<User>;
  abstract getUser(uid: string): Promise<User | null>;
  abstract getAllUsers(): Observable<User[]>;
  abstract getUsersByRole(role: string): Observable<User[]>;
  abstract updateUser(uid: string, userData: UpdateUserData): Promise<void>;
  abstract deleteUser(uid: string): Promise<void>;
  abstract toggleUserStatus(uid: string, active: boolean): Promise<void>;
}
