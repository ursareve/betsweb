import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SurebetRepository, Surebet } from '../repositories/surebet.repository';

@Injectable()
export class SurebetService {
  constructor(private repository: SurebetRepository) {}

  getSurebets(): Observable<Surebet[]> {
    return this.repository.getSurebets();
  }

  getSurebetById(id: number): Observable<Surebet> {
    return this.repository.getSurebetById(id);
  }
}
