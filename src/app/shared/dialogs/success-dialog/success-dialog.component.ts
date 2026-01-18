import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface SuccessDialogData {
  title?: string;
  message: string;
  icon?: string;
}

@Component({
  selector: 'app-success-dialog',
  templateUrl: './success-dialog.component.html',
  styleUrls: ['./success-dialog.component.scss']
})
export class SuccessDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<SuccessDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SuccessDialogData
  ) {
    if (!data.title) data.title = 'Success!';
    if (!data.icon) data.icon = 'check_circle';
  }

  close(): void {
    this.dialogRef.close();
  }
}
