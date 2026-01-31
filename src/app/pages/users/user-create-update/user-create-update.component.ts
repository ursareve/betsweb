import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { User, UserRole, Gender } from '../../../models/user.model';
import { StorageService } from '../../../core/services/storage.service';

@Component({
  selector: 'fury-user-create-update',
  templateUrl: './user-create-update.component.html',
  styleUrls: ['./user-create-update.component.scss']
})
export class UserCreateUpdateComponent implements OnInit {

  form: UntypedFormGroup;
  mode: 'create' | 'update' = 'create';
  roles: UserRole[] = ['superadmin', 'admin', 'member', 'viewer', 'guest'];
  genders: Gender[] = ['masculino', 'femenino'];
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  constructor(@Inject(MAT_DIALOG_DATA) public defaults: any,
              private dialogRef: MatDialogRef<UserCreateUpdateComponent>,
              private fb: UntypedFormBuilder) {
  }

  ngOnInit() {
    if (this.defaults) {
      this.mode = 'update';
    } else {
      this.defaults = {} as User;
    }

    // Convertir activeUntil de Timestamp a Date si es necesario
    let activeUntilValue = null;
    if (this.defaults.activeUntil) {
      if ((this.defaults.activeUntil as any).seconds) {
        activeUntilValue = new Date((this.defaults.activeUntil as any).seconds * 1000);
      } else {
        activeUntilValue = this.defaults.activeUntil;
      }
    }

    this.form = this.fb.group({
      uid: [this.defaults.uid || ''],
      firstName: [this.defaults.firstName || '', Validators.required],
      lastName: [this.defaults.lastName || '', Validators.required],
      email: [this.defaults.email || '', [Validators.required, Validators.email]],
      password: [this.mode === 'create' ? '' : null, this.mode === 'create' ? Validators.required : null],
      document: [this.defaults.document || '', Validators.required],
      gender: [this.defaults.gender || 'masculino', Validators.required],
      role: [this.defaults.role || 'guest', Validators.required],
      active: [this.defaults.active ?? true],
      activeUntil: [activeUntilValue],
      avatarUrl: [this.defaults.avatarUrl || '']
    });

    if (this.mode === 'update') {
      this.form.get('email').disable();
      this.previewUrl = this.defaults.avatarUrl;
    }
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
    if (this.form.valid) {
      const user = this.form.getRawValue();
      this.dialogRef.close({ ...user, avatarFile: this.selectedFile });
    }
  }

  isCreateMode() {
    return this.mode === 'create';
  }

  isUpdateMode() {
    return this.mode === 'update';
  }
}
