import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { getBookmakerIcon } from '../../../core/constants/bookmakers';
import * as moment from 'moment';

@Component({
  selector: 'fury-calculator',
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.scss']
})
export class CalculatorComponent {
  Math = Math;
  stake1: string = '465.12';
  stake2: string = '537.64';
  totalStake: string = '200000';
  potentialWin1: string = '1000.00';
  potentialWin2: string = '1000.00';
  taxAdjusted1: string = '950.00';
  taxAdjusted2: string = '1000.00';
  pureProfit1: string = '94.00';
  pureProfit2: string = '94.00';
  baseAmount = 0;
  winwin = {} as any;
  maxOver = {} as any;
  maxUnder = {} as any;
  originalWinwin = {} as any;
  originalMaxOver = {} as any;
  originalMaxUnder = {} as any;
  roundingStep = 2500;

  constructor(
    public dialogRef: MatDialogRef<CalculatorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.baseAmount = parseFloat(this.totalStake) || 200000;
    this.winwin = this.calculateAlwaysWin(this.baseAmount);
    this.maxOver = this.calculateMaxOver(this.baseAmount);
    this.maxUnder = this.calculateMaxUnder(this.baseAmount);
    this.originalWinwin = { ...this.winwin };
    this.originalMaxOver = { ...this.maxOver };
    this.originalMaxUnder = { ...this.maxUnder };
  }

  getBookmakerIcon(bookmakerId: number): string {
    return getBookmakerIcon(bookmakerId);
  }

  calculateAlwaysWin(baseAmount: number): any {
    const koef1 = this.data.bookmaker_1.koef;
    const koef2 = this.data.bookmaker_2.koef;
    
    // Fórmula correcta de surebet: distribuir inversamente proporcional a las cuotas
    const impliedProb1 = 1 / koef1;
    const impliedProb2 = 1 / koef2;
    const totalImplied = impliedProb1 + impliedProb2;
    
    if (totalImplied === 0) return null;

    let stake1 = (baseAmount * impliedProb1) / totalImplied;
    let stake2 = (baseAmount * impliedProb2) / totalImplied;

    stake1 = Math.round(stake1);
    stake2 = baseAmount - stake1;

    return this.createBetResult('Gana Gana', stake1, stake2, baseAmount);
  }

  calculateMaxOver(baseAmount: number): any {
    const koef1 = this.data.bookmaker_1.koef;
    const koef2 = this.data.bookmaker_2.koef;
    
    if (koef2 === 0) return null;

    // Max Over: maximizar ganancia si gana bookmaker_1
    // stake2 = baseAmount / koef2 (para recuperar inversión si gana bookmaker_2)
    let stake2 = baseAmount / koef2;
    let stake1 = baseAmount - stake2;

    stake2 = Math.round(stake2);
    stake1 = baseAmount - stake2;

    return this.createBetResult('Max Over', stake1, stake2, baseAmount);
  }

  calculateMaxUnder(baseAmount: number): any {
    const koef1 = this.data.bookmaker_1.koef;
    const koef2 = this.data.bookmaker_2.koef;
    
    if (koef1 === 0) return null;

    // Max Under: maximizar ganancia si gana bookmaker_2
    // stake1 = baseAmount / koef1 (para recuperar inversión si gana bookmaker_1)
    let stake1 = baseAmount / koef1;
    let stake2 = baseAmount - stake1;

    stake1 = Math.round(stake1);
    stake2 = baseAmount - stake1;

    return this.createBetResult('Max Under', stake1, stake2, baseAmount);
  }

  createBetResult(name: string, stake1: number, stake2: number, baseAmount: number): any {
    const koef1 = this.data.bookmaker_1.koef;
    const koef2 = this.data.bookmaker_2.koef;
    
    const winStake1 = parseFloat((stake1 * koef1).toFixed(1));
    const winStake2 = parseFloat((stake2 * koef2).toFixed(1));
    const profitStake1 = parseFloat((winStake1 - baseAmount).toFixed(1));
    const profitStake2 = parseFloat((winStake2 - baseAmount).toFixed(1));

    return {
      name,
      over: Math.round(stake1),
      under: Math.round(stake2),
      winOver: winStake1,
      winUnder: winStake2,
      profitOver: profitStake1,
      profitUnder: profitStake2
    };
  }

  calculateOptimalStakes(): void {
    const total = parseFloat(this.totalStake) || 1000;
    const odds1 = this.data.bookmaker_1.koef;
    const odds2 = this.data.bookmaker_2.koef;
    
    const stake1 = total / (1 + (odds1 / odds2));
    const stake2 = total - stake1;
    
    this.stake1 = stake1.toFixed(2);
    this.stake2 = stake2.toFixed(2);
    this.calculate();
    
    // Recalcular los valores de las tarjetas
    this.winwin = this.calculateAlwaysWin(total);
    this.maxOver = this.calculateMaxOver(total);
    this.maxUnder = this.calculateMaxUnder(total);
    this.originalWinwin = { ...this.winwin };
    this.originalMaxOver = { ...this.maxOver };
    this.originalMaxUnder = { ...this.maxUnder };
  }

  calculate(): void {
    const s1 = parseFloat(this.stake1) || 0;
    const s2 = parseFloat(this.stake2) || 0;
    const odds1 = this.data.bookmaker_1.koef;
    const odds2 = this.data.bookmaker_2.koef;
    
    const win1 = s1 * odds1;
    const win2 = s2 * odds2;
    
    this.potentialWin1 = win1.toFixed(2);
    this.potentialWin2 = win2.toFixed(2);
    
    const tax1 = win1 * 0.95;
    const tax2 = win2;
    
    this.taxAdjusted1 = tax1.toFixed(2);
    this.taxAdjusted2 = tax2.toFixed(2);
    
    const profit1 = tax1 - (s1 + s2);
    const profit2 = tax2 - (s1 + s2);
    
    this.pureProfit1 = profit1.toFixed(2);
    this.pureProfit2 = profit2.toFixed(2);
  }

  close(): void {
    this.dialogRef.close();
  }

  roundToNearestThousand(value: number): number {
    return Math.round(value / this.roundingStep) * this.roundingStep;
  }

  calculateRoundedOptimalStakes(): void {
    const baseAmount = parseFloat(this.totalStake) || 200000;
    const koef1 = this.data.bookmaker_1.koef;
    const koef2 = this.data.bookmaker_2.koef;

    this.winwin = this.findBestRounding(this.calculateAlwaysWin(baseAmount).over, baseAmount, koef1, koef2, 'min', 'Gana Gana');
    this.maxOver = this.findBestRounding(this.calculateMaxOver(baseAmount).under, baseAmount, koef1, koef2, 'profit1', 'Max Over', true);
    this.maxUnder = this.findBestRounding(this.calculateMaxUnder(baseAmount).over, baseAmount, koef1, koef2, 'profit2', 'Max Under');
  }

  private findBestRounding(optimal: number, baseAmount: number, koef1: number, koef2: number, mode: 'min' | 'profit1' | 'profit2', name: string, isStake2 = false): any {
    const candidates = [Math.floor, Math.ceil, Math.round].map(fn => fn(optimal / this.roundingStep) * this.roundingStep);
    let best = optimal;
    let bestValue = -Infinity;

    for (const candidate of candidates) {
      if (candidate <= 0 || candidate >= baseAmount) continue;
      
      const [stake1, stake2] = isStake2 ? [baseAmount - candidate, candidate] : [candidate, baseAmount - candidate];
      const [profit1, profit2] = [(stake1 * koef1) - baseAmount, (stake2 * koef2) - baseAmount];
      
      const value = mode === 'min' ? Math.min(profit1, profit2) : mode === 'profit1' ? profit1 : profit2;
      
      if ((mode === 'min' || (profit1 >= 0 && profit2 >= 0)) && value > bestValue) {
        bestValue = value;
        best = candidate;
      }
    }

    if (bestValue === -Infinity) {
      for (const candidate of candidates) {
        if (candidate <= 0 || candidate >= baseAmount) continue;
        const [stake1, stake2] = isStake2 ? [baseAmount - candidate, candidate] : [candidate, baseAmount - candidate];
        const minProfit = Math.min((stake1 * koef1) - baseAmount, (stake2 * koef2) - baseAmount);
        if (minProfit > bestValue) {
          bestValue = minProfit;
          best = candidate;
        }
      }
    }

    const [finalStake1, finalStake2] = isStake2 ? [baseAmount - best, best] : [best, baseAmount - best];
    return this.createBetResult(name, finalStake1, finalStake2, baseAmount);
  }

  resetToOriginal(): void {
    this.winwin = { ...this.originalWinwin };
    this.maxOver = { ...this.originalMaxOver };
    this.maxUnder = { ...this.originalMaxUnder };
  }

  goToBookmaker1(): void {
    if (this.data.bookmaker_1?.link) {
      window.open(this.data.bookmaker_1.link, '_blank');
    }
  }

  goToBookmaker2(): void {
    if (this.data.bookmaker_2?.link) {
      window.open(this.data.bookmaker_2.link, '_blank');
    }
  }

  formatDate(timestamp: number): string {
    return moment.unix(timestamp).format('DD/MM/YYYY');
  }

  formatTime(timestamp: number): string {
    return moment.unix(timestamp).format('HH:mm');
  }
}
