import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../@fury/shared/material-components.module';
import { ForgotPasswordRoutingModule } from './forgot-password-routing.module';
import { ForgotPasswordComponent } from './forgot-password.component';
import { SuccessDialogComponent } from '../../../shared/dialogs/success-dialog/success-dialog.component';

@NgModule({
  imports: [
    CommonModule,
    ForgotPasswordRoutingModule,
    MaterialModule,
    ReactiveFormsModule
  ],
  declarations: [ForgotPasswordComponent, SuccessDialogComponent]
})
export class ForgotPasswordModule {
}
