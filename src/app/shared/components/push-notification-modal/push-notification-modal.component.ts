import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface PushNotificationData {
  subject: string;
  content: string;
  type?: string;
}

@Component({
  selector: 'app-push-notification-modal',
  templateUrl: './push-notification-modal.component.html',
  styleUrls: ['./push-notification-modal.component.scss']
})
export class PushNotificationModalComponent {
  constructor(
    public dialogRef: MatDialogRef<PushNotificationModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PushNotificationData
  ) {}

  onBetNow(): void {
    this.dialogRef.close('bet');
  }

  onDismiss(): void {
    this.dialogRef.close('dismiss');
  }
}
