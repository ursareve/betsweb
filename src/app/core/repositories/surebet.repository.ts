import { Observable } from 'rxjs';

export interface SurebetBet {
  id: string;
  margin: number;
  bet: {
    market: string;
    param: number;
    period: string;
  };
  bookmaker_1: {
    id: number;
    koef: number;
    line: string;
    link?: string;
    name: string;
  };
  bookmaker_2: {
    id: number;
    koef: number;
    line: string;
    link?: string;
    name: string;
  };
  event: {
    away: string;
    home: string;
    id: number;
    league: string;
    name: string;
    sport: string;
    sport_id: number;
    started_at: number;
  };
}

export type Surebet = SurebetBet[];

export interface SurebetFilter {
  bookmakers: string;
  sports: string;
  min_margin: number;
  max_margin: number;
}

export abstract class SurebetRepository {
  abstract getSurebets(): Observable<Surebet>;
  abstract getSurebetById(id: string): Observable<SurebetBet>;
  abstract getSurebetsFiltered(filter: SurebetFilter): Observable<Surebet>;
}
