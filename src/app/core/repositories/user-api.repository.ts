import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, CreateUserData, UpdateUserData } from '../../models/user.model';
import { UserRepository } from './user.repository';
import { environment } from '../../../environments/environment';

@Injectable()
export class UserApiRepository extends UserRepository {
  private apiUrl = `${environment.apiUrl}/${environment.version}/users`;

  constructor(private http: HttpClient) {
    super();
  }

  async createUser(userData: CreateUserData): Promise<User> {
    const params = new HttpParams().set('access_key', environment.apiAccessKey);
    return this.http.post<User>(this.apiUrl, userData, { params }).toPromise();
  }

  async getUser(uid: string): Promise<User | null> {
    const params = new HttpParams().set('access_key', environment.apiAccessKey);
    return this.http.get<User>(`${this.apiUrl}/${uid}`, { params }).toPromise();
  }

  getAllUsers(): Observable<User[]> {
    const params = new HttpParams().set('access_key', environment.apiAccessKey);
    return this.http.get<User[]>(this.apiUrl, { params });
  }

  getUsersByRole(role: string): Observable<User[]> {
    const params = new HttpParams()
      .set('access_key', environment.apiAccessKey)
      .set('role', role);
    return this.http.get<User[]>(this.apiUrl, { params });
  }

  async updateUser(uid: string, userData: UpdateUserData): Promise<void> {
    const params = new HttpParams().set('access_key', environment.apiAccessKey);
    await this.http.put<void>(`${this.apiUrl}/${uid}`, userData, { params }).toPromise();
  }

  async deleteUser(uid: string): Promise<void> {
    const params = new HttpParams().set('access_key', environment.apiAccessKey);
    await this.http.delete<void>(`${this.apiUrl}/${uid}`, { params }).toPromise();
  }

  async toggleUserStatus(uid: string, active: boolean): Promise<void> {
    await this.updateUser(uid, { active });
  }
}
