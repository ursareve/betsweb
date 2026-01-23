import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SurebetRepository, Surebet } from './surebet.repository';
import { environment } from '../../../environments/environment';

@Injectable()
export class SurebetApiRepository extends SurebetRepository {
  private apiUrl = `${environment.apiUrl}/current`;

  constructor(private http: HttpClient) {
    super();
  }

  getSurebets(): Observable<Surebet[]> {
    const params = new HttpParams().set('access_key', environment.apiAccessKey);
    return this.http.get<Surebet[]>(this.apiUrl, { params });
  }

  getSurebetById(id: number): Observable<Surebet> {
    const params = new HttpParams().set('access_key', environment.apiAccessKey);
    return this.http.get<Surebet>(`${this.apiUrl}/${id}`, { params });
  }
}
