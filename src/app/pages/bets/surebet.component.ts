import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import sortBy from 'lodash-es/sortBy';
import * as moment from 'moment';
import { ScrollbarComponent } from '../../../@fury/shared/scrollbar/scrollbar.component';
import { surebetDemoData } from './surebet.demo';
import { MediaObserver } from '@angular/flex-layout';
import { map, takeUntil } from 'rxjs/operators';
import { componentDestroyed } from '../../../@fury/shared/component-destroyed';

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

  events = [
    {
      id: 1,
      sport: 'Football',
      league: 'Premier League',
      homeTeam: 'Manchester United',
      awayTeam: 'Liverpool',
      date: '2024-01-25',
      time: '15:00',
      profit: 5.2,
      bookmakers: [
        {
          name: 'Bet365',
          logo: 'assets/img/avatars/1.jpg',
          betType: 'Over 2.5',
          odd: 2.10
        },
        {
          name: 'Betfair',
          logo: 'assets/img/avatars/2.jpg',
          betType: 'Under 2.5',
          odd: 1.95
        }
      ]
    },
    {
      id: 2,
      sport: 'Basketball',
      league: 'NBA',
      homeTeam: 'Lakers',
      awayTeam: 'Warriors',
      date: '2024-01-25',
      time: '20:30',
      profit: 3.8,
      bookmakers: [
        {
          name: '1xBet',
          logo: 'assets/img/avatars/3.jpg',
          betType: 'Home Win',
          odd: 1.85
        },
        {
          name: 'William Hill',
          logo: 'assets/img/avatars/4.jpg',
          betType: 'Away Win',
          odd: 2.05
        }
      ]
    },
    {
      id: 3,
      sport: 'Tennis',
      league: 'Australian Open',
      homeTeam: 'Djokovic',
      awayTeam: 'Nadal',
      date: '2024-01-26',
      time: '10:00',
      profit: 4.5,
      bookmakers: [
        {
          name: 'Betway',
          logo: 'assets/img/avatars/5.jpg',
          betType: 'Player 1',
          odd: 1.65
        },
        {
          name: 'Unibet',
          logo: 'assets/img/avatars/6.jpg',
          betType: 'Player 2',
          odd: 2.30
        }
      ]
    },
    {
      id: 4,
      sport: 'Football',
      league: 'La Liga',
      homeTeam: 'Real Madrid',
      awayTeam: 'Barcelona',
      date: '2024-01-26',
      time: '18:00',
      profit: 6.1,
      bookmakers: [
        {
          name: 'Bwin',
          logo: 'assets/img/avatars/7.jpg',
          betType: 'TU(3.5) for Team2 - Corners',
          odd: 2.25
        },
        {
          name: 'Pinnacle',
          logo: 'assets/img/avatars/8.jpg',
          betType: 'TO(3.5) for Team2 - Corners',
          odd: 3.10
        }
      ]
    }
  ];

  @ViewChild('messagesScroll', { read: ScrollbarComponent, static: true }) messagesScroll: ScrollbarComponent;

  constructor(private cd: ChangeDetectorRef,
              private mediaObserver: MediaObserver) {
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

  ngOnDestroy(): void {}
}
