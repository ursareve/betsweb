import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { User } from '../../../../models/user.model';

@Component({
  selector: 'fury-profile-update',
  templateUrl: './profile-update.component.html',
  styleUrls: ['./profile-update.component.scss']
})
export class ProfileUpdateComponent implements OnInit {

  user: User;
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { user: User },
    private dialogRef: MatDialogRef<ProfileUpdateComponent>
  ) {
    this.user = data.user;
  }

  ngOnInit() {
    this.previewUrl = this.user.avatarUrl || null;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  save() {
    this.dialogRef.close(this.selectedFile);
  }

  close() {
    this.dialogRef.close();
  }
}
