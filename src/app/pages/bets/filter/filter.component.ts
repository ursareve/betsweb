import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BOOKMAKERS } from '../../../core/constants/bookmakers';
import { SPORT_ICONS } from '../../../core/constants/sport-icons';

@Component({
  selector: 'fury-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss']
})
export class FilterComponent implements OnInit {
  bookmakers: any[] = [];
  sports: any[] = [];
  selectedBookmakers: Set<number> = new Set();
  selectedSports: Set<number> = new Set();
  bookmakerSearch = '';
  sportSearch = '';

  constructor(
    private dialogRef: MatDialogRef<FilterComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    this.bookmakers = Object.values(BOOKMAKERS);
    this.sports = Object.entries(SPORT_ICONS).map(([id, data]) => ({
      id: Number(id),
      ...data
    }));

    if (this.data?.selectedBookmakers) {
      this.data.selectedBookmakers.forEach((id: number) => this.selectedBookmakers.add(id));
    }
    if (this.data?.selectedSports) {
      this.data.selectedSports.forEach((id: number) => this.selectedSports.add(id));
    }
  }

  get filteredBookmakers() {
    if (!this.bookmakerSearch) return this.bookmakers;
    return this.bookmakers.filter(b => 
      b.name.toLowerCase().includes(this.bookmakerSearch.toLowerCase())
    );
  }

  get filteredSports() {
    if (!this.sportSearch) return this.sports;
    return this.sports.filter(s => 
      s.name.toLowerCase().includes(this.sportSearch.toLowerCase())
    );
  }

  get selectedBookmakersList() {
    return this.bookmakers.filter(b => this.selectedBookmakers.has(b.id));
  }

  get selectedSportsList() {
    return this.sports.filter(s => this.selectedSports.has(s.id));
  }

  toggleBookmaker(id: number) {
    if (this.selectedBookmakers.has(id)) {
      this.selectedBookmakers.delete(id);
    } else {
      this.selectedBookmakers.add(id);
    }
  }

  toggleSport(id: number) {
    if (this.selectedSports.has(id)) {
      this.selectedSports.delete(id);
    } else {
      this.selectedSports.add(id);
    }
  }

  selectAllBookmakers() {
    this.bookmakers.forEach(b => this.selectedBookmakers.add(b.id));
  }

  clearAllBookmakers() {
    this.selectedBookmakers.clear();
  }

  selectAllSports() {
    this.sports.forEach(s => this.selectedSports.add(s.id));
  }

  clearAllSports() {
    this.selectedSports.clear();
  }

  isBookmakerSelected(id: number): boolean {
    return this.selectedBookmakers.has(id);
  }

  isSportSelected(id: number): boolean {
    return this.selectedSports.has(id);
  }

  apply() {
    const payload = {
      bookmakers: Array.from(this.selectedBookmakers),
      sports: Array.from(this.selectedSports)
    };
    console.log(payload);
    this.dialogRef.close(payload);
  }

  close() {
    this.dialogRef.close();
  }
}
