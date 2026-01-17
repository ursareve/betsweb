import { Observable } from 'rxjs';
import { User } from '../models/user.model';

export abstract class UserRepository {
  abstract getAll(): Observable<User[]>;
  abstract getById(id: string): Observable<User | null>;
  abstract getByField(field: string, value: any): Observable<User[]>;
  abstract create(user: User): Promise<void>;
  abstract update(id: string, user: Partial<User>): Promise<void>;
  abstract delete(id: string): Promise<void>;
}