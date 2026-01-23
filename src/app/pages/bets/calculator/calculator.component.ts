import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { getBookmakerIcon } from '../../../core/constants/bookmakers';

@Component({
  selector: 'fury-calculator',
  templateUrl: './calculator.component.html',
  styleUrls: ['./calculator.component.scss']
})
export class CalculatorComponent {
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

  constructor(
    public dialogRef: MatDialogRef<CalculatorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.calculateOptimalStakes();
    this.baseAmount = parseFloat(this.totalStake) || 200000;
    this.winwin = this.calculateAlwaysWin(this.baseAmount);
    this.maxOver = this.calculateMaxOver(this.baseAmount);
    this.maxUnder = this.calculateMaxUnder(this.baseAmount);
    console.log(this.winwin, this.maxOver, this.maxUnder);

  }

  getBookmakerIcon(bookmakerId: number): string {
    return getBookmakerIcon(bookmakerId);
  }

  calculateAlwaysWin(baseAmount: number): any {
    const totalValue = this.data.over.koef + this.data.under.koef;
    if (totalValue === 0) return null;

    let over = (baseAmount * this.data.under.koef) / totalValue;
    let under = baseAmount - over;

    over = Math.round(over);
    under = baseAmount - over;

    return this.createBetResult('Gana Gana', over, under, baseAmount);
  }

  calculateMaxOver(baseAmount: number): any {
    if (this.data.under.koef === 0) return null;

    let under = baseAmount / this.data.under.koef;
    let over = baseAmount - under;

    return this.createBetResult('Max Over', over, under, baseAmount);
  }

  calculateMaxUnder(baseAmount: number): any {
    if (this.data.over.koef === 0) return null;

    let over = baseAmount / this.data.over.koef;
    let under = baseAmount - over;

    return this.createBetResult('Max Under', over, under, baseAmount);
  }

  createBetResult(name: string, over: number, under: number, baseAmount: number): any {
    const winOver = parseFloat((over * this.data.over.koef).toFixed(1));
    const winUnder = parseFloat((under * this.data.under.koef).toFixed(1));
    const profitOver = parseFloat((winOver - baseAmount).toFixed(1));
    const profitUnder = parseFloat((winUnder - baseAmount).toFixed(1));

    over = Math.round(over);
    under = baseAmount - over;

    return {
      name,
      over,
      under,
      winOver,
      winUnder,
      profitOver,
      profitUnder
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
}
