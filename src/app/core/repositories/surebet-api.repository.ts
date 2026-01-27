import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SurebetRepository, Surebet, SurebetBet } from './surebet.repository';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';

@Injectable()
export class SurebetApiRepository extends SurebetRepository {
  // private apiUrl = `${environment.apiUrl}/arbs`;
  private apiUrl = `${environment.apiUrl}/${environment.version}/arbs/current`;

  constructor(private http: HttpClient) {
    super();
  }

  getSurebets(): Observable<Surebet> {
    const params = new HttpParams().set('access_key', environment.apiAccessKey);
    return this.http.get<{ bets: Surebet }>(this.apiUrl, { params }).pipe(
      map(response => response.bets)
    );
  }

  getSurebetById(id: string): Observable<SurebetBet> {
    const params = new HttpParams().set('access_key', environment.apiAccessKey);
    return this.http.get<SurebetBet>(`${this.apiUrl}/${id}`, { params });
  }
}
