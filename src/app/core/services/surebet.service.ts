import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SurebetRepository, Surebet, SurebetBet } from '../repositories/surebet.repository';

@Injectable()
export class SurebetService {
  constructor(private repository: SurebetRepository) {}

  getSurebets(): Observable<Surebet> {
    return this.repository.getSurebets();
  }

  getSurebetById(id: string): Observable<SurebetBet> {
    return this.repository.getSurebetById(id);
  }
}
