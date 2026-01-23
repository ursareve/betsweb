import { Observable } from 'rxjs';

export interface Surebet {
  id: number;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  profit: number;
  bookmakers: Bookmaker[];
}

export interface Bookmaker {
  name: string;
  logo: string;
  betType: string;
  odd: number;
}

export abstract class SurebetRepository {
  abstract getSurebets(): Observable<Surebet[]>;
  abstract getSurebetById(id: number): Observable<Surebet>;
}
