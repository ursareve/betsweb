import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import sortBy from 'lodash-es/sortBy';
import * as moment from 'moment';
import { ScrollbarComponent } from '../../../@fury/shared/scrollbar/scrollbar.component';
import { surebetDemoData } from './surebet.demo';
import { MediaObserver } from '@angular/flex-layout';
import { map, takeUntil } from 'rxjs/operators';
import { componentDestroyed } from '../../../@fury/shared/component-destroyed';
import { SurebetService } from '../../core/services/surebet.service';
import { getSportIcon } from '../../core/constants/sport-icons';
import { getBookmakerIcon } from '../../core/constants/bookmakers';
import { MatDialog } from '@angular/material/dialog';
import { CalculatorComponent } from './calculator/calculator.component';
import { FilterComponent } from './filter/filter.component';
import { Surebet, SurebetBet, SurebetFilter } from '../../core/repositories/surebet.repository';

@Component({
  selector: 'fury-surebet',
  templateUrl: './surebet.component.html',
  styleUrls: ['./surebet.component.scss']
})
export class SurebetComponent implements OnInit, OnDestroy {

  drawerOpen = true;
  drawerMode = 'side';
  replyCtrl: UntypedFormControl;

  surebets: any[];
  activeSurebet: any;

  private _gap = 16;
  gap = `${this._gap}px`;
  refreshIntervalMinutes = 1;
  countdown = 60;
  isAutoRefreshActive = true;
  private refreshInterval: any;
  private countdownInterval: any;
  private newBetIds = new Set<string>();

  events = [];
  bets: Surebet = []
  searchText = '';
  isLoading = true;
  minProfit = 0;
  maxProfit = 99;
  selectedBookmakers: number[] = [];
  selectedSports: number[] = [];

  @ViewChild('messagesScroll', { read: ScrollbarComponent, static: true }) messagesScroll: ScrollbarComponent;

  constructor(private cd: ChangeDetectorRef,
              private mediaObserver: MediaObserver,
              private surebetService: SurebetService,
              private dialog: MatDialog) {
  }

  col(colAmount: number) {
    return `1 1 calc(${100 / colAmount}% - ${this._gap - (this._gap / colAmount)}px)`;
  }

  triggerFlash() {
    const container = document.querySelector('.events-container');
    if (container) {
      container.classList.add('flash-animation');
      setTimeout(() => {
        container.classList.remove('flash-animation');
      }, 500);
    }
  }

  ngOnInit() {
    this.replyCtrl = new UntypedFormControl();

    this.surebets = sortBy(surebetDemoData, 'lastMessageTime').reverse();
    this.activeSurebet = this.surebets[0];

    this.loadSurebets();
    this.startAutoRefresh();

    this.mediaObserver.asObservable().pipe(
      map(() => this.mediaObserver.isActive('lt-md')),
      takeUntil(componentDestroyed(this))
    ).subscribe(isLowerThanMedium => isLowerThanMedium ? this.hideDrawer() : this.showDrawer());
  }

  showDrawer() {
    this.drawerOpen = true;
    this.drawerMode = 'side';
  }

  hideDrawer() {
    this.drawerOpen = false;
    this.drawerMode = 'over';
  }

  setActiveSurebet(surebet) {
    this.activeSurebet = surebet;

    if (this.drawerMode === 'over') {
      this.drawerOpen = false;
    }
  }

  send() {
    if (this.replyCtrl.value) {
      this.surebets[0].messages.push({
        message: this.replyCtrl.value,
        when: moment(),
        who: 'me'
      });

      this.replyCtrl.reset();
      this.cd.markForCheck();
      setTimeout(() => {
        this.messagesScroll.scrollbarRef.getScrollElement().scrollTo(0, this.messagesScroll.scrollbarRef.getScrollElement().scrollHeight);
      }, 10);
    }
  }

  clearMessages(activeSurebet) {
    activeSurebet.messages.length = 0;
  }

  getSportIcon(sportId: number): string {
    return getSportIcon(sportId);
  }

  getBookmakerIcon(bookmakerId: number): string {
    return getBookmakerIcon(bookmakerId);
  }

  formatDate(timestamp: number): string {
    return moment.unix(timestamp).format('DD/MM/YYYY');
  }

  formatTime(timestamp: number): string {
    return moment.unix(timestamp).format('HH:mm');
  }

  openCalculator(bet: any): void {
    const betCopy = JSON.parse(JSON.stringify(bet));
    
    if (betCopy.bookmaker_1.koef > betCopy.bookmaker_2.koef) {
      betCopy.over = betCopy.bookmaker_1;
      betCopy.under = betCopy.bookmaker_2;
    } else {
      betCopy.over = betCopy.bookmaker_2;
      betCopy.under = betCopy.bookmaker_1;
    }
    
    this.dialog.open(CalculatorComponent, {
      width: '1100px',
      maxWidth: '95vw',
      panelClass: 'calculator-dialog',
      backdropClass: 'calculator-backdrop',
      data: betCopy
    });
  }

  openFilter(): void {
    const dialogRef = this.dialog.open(FilterComponent, {
      width: '1100px',
      maxWidth: '95vw',
      panelClass: 'filter-dialog',
      backdropClass: 'filter-backdrop',
      data: {
        selectedBookmakers: this.selectedBookmakers,
        selectedSports: this.selectedSports
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.selectedBookmakers = result.bookmakers;
        this.selectedSports = result.sports;
        this.loadSurebets();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  private loadSurebets(): void {
    const filter: SurebetFilter = {
      bookmakers: this.selectedBookmakers.join(','),
      sports: this.selectedSports.join(','),
      min_margin: this.minProfit,
      max_margin: this.maxProfit
    };

    this.surebetService.getSurebetsFiltered(filter).subscribe(
      surebets => {
        console.log('Surebets recibidos:', surebets);
        console.log('Filtros:', filter);
        // Reemplazar margin con número aleatorio
        // surebets.forEach(bet => {
        //   bet.margin = this.getRandomNumber(bet.margin);
        // });
        this.updateBets(surebets);
        this.isLoading = false;
      },
      error => {
        console.error('Error al obtener surebets:', error);
        this.isLoading = false;
      }
    );
  }

  private updateBets(newBets: Surebet): void {
    const newBetsMap = new Map(newBets.map(bet => [bet.id, bet]));
    const currentBetsMap = new Map(this.bets.map(bet => [bet.id, bet]));
    let hasChanges = false;

    // Verificar si hay bets a eliminar
    const betsToRemove = this.bets.filter(bet => !newBetsMap.has(bet.id));
    if (betsToRemove.length > 0) {
      hasChanges = true;
      console.log('Bets eliminados:', betsToRemove.length);
    }

    // Eliminar bets que ya no existen
    this.bets = this.bets.filter(bet => newBetsMap.has(bet.id));

    // Agregar nuevos o actualizar existentes
    newBets.forEach(newBet => {
      const existingBet = currentBetsMap.get(newBet.id);
      
      if (!existingBet) {
        // Nuevo bet, agregarlo
        this.bets.push(newBet);
        hasChanges = true;
        this.newBetIds.add(newBet.id);
        setTimeout(() => this.newBetIds.delete(newBet.id), 2000);
        // console.log('Nuevo bet agregado:', newBet.id);
      } else {
        // Verificar si cambió koef o margin
        const koefChanged = 
          existingBet.bookmaker_1.koef !== newBet.bookmaker_1.koef ||
          existingBet.bookmaker_2.koef !== newBet.bookmaker_2.koef;
        const marginChanged = existingBet.margin !== newBet.margin;

        if (koefChanged || marginChanged) {
          // Actualizar el bet existente
          const index = this.bets.findIndex(b => b.id === newBet.id);
          if (index !== -1) {
            this.bets[index] = newBet;
            hasChanges = true;
            console.log('Bet actualizado:', newBet.id, { koefChanged, marginChanged });
          }
        }
      }
    });

    // Disparar animación si hubo cambios
    if (hasChanges) {
      this.triggerFlash();
    }
  }

  isNewBet(betId: string): boolean {
    return this.newBetIds.has(betId);
  }

  getShieldImage(margin: number): string {
    if (margin <= 1) return '/assets/img/bets/shield_gray.png';
    if (margin <= 5) return '/assets/img/bets/shield_blue.png';
    if (margin <= 10) return '/assets/img/bets/shield_green.png';
    if (margin <= 20) return '/assets/img/bets/shield_gold.png';
    return '/assets/img/bets/shield_red.png';
  }

  getShieldImageTemp(margin: number): string {
    if (margin <= 1) return '/assets/img/bets/shield_gray.png';
    if (margin <= 50) return '/assets/img/bets/shield_blue.png';
    if (margin <= 10) return '/assets/img/bets/shield_green.png';
    if (margin <= 20) return '/assets/img/bets/shield_gold.png';
    return '/assets/img/bets/shield_red.png';
  }

  getRandomNumber(margin: number): number {
    return Math.floor(Math.random() * 99) + 1;
  }

  onProfitRangeChange(event: any) {
    this.minProfit = Number(event.target.value);
    this.cd.detectChanges();
  }

  onMaxProfitRangeChange(event: any) {
    this.maxProfit = Number(event.target.value);
    this.cd.detectChanges();
  }

  get filteredBets() {
    if (!this.searchText && this.minProfit === 0 && this.maxProfit === 99) return this.bets;
    const search = this.searchText.toLowerCase();
    return this.bets.filter(bet => {
      const matchesSearch = !this.searchText || 
        bet.event.name.toLowerCase().includes(search) ||
        bet.event.league.toLowerCase().includes(search);
      const matchesProfit = bet.margin >= this.minProfit && bet.margin <= this.maxProfit;
      return matchesSearch && matchesProfit;
    });
  }

  private startAutoRefresh(): void {
    this.countdown = this.refreshIntervalMinutes * 60;
    
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.countdown = this.refreshIntervalMinutes * 60;
      }
    }, 1000);

    this.refreshInterval = setInterval(() => {
      this.loadSurebets();
    }, this.refreshIntervalMinutes * 60 * 1000);
  }

  refreshNow(): void {
    if (!this.isAutoRefreshActive) return;
    clearInterval(this.refreshInterval);
    clearInterval(this.countdownInterval);
    this.loadSurebets();
    this.startAutoRefresh();
  }

  toggleAutoRefresh(): void {
    this.isAutoRefreshActive = !this.isAutoRefreshActive;
    
    if (this.isAutoRefreshActive) {
      this.startAutoRefresh();
    } else {
      clearInterval(this.refreshInterval);
      clearInterval(this.countdownInterval);
      this.countdown = 0;
    }
  }
}
