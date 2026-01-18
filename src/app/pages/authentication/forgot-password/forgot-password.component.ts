import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { fadeInUpAnimation } from '../../../../@fury/animations/fade-in-up.animation';
import { SuccessDialogComponent } from '../../../shared/dialogs/success-dialog/success-dialog.component';

@Component({
  selector: 'fury-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  animations: [fadeInUpAnimation]
})
export class ForgotPasswordComponent implements OnInit {

  form = this.fb.group({
    email: [null, Validators.required]
  });

  constructor(
    private router: Router,
    private fb: UntypedFormBuilder,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
  }

  send() {
    if (this.form.valid) {
      // Aquí iría la lógica para enviar el correo
      // Por ahora solo mostramos el dialog
      
      this.dialog.open(SuccessDialogComponent, {
        data: {
          title: 'Email Sent!',
          message: 'We have sent a password recovery link to your email address. Please check your inbox.',
          icon: 'mark_email_read'
        },
        width: '400px'
      }).afterClosed().subscribe(() => {
        this.router.navigate(['/login']);
      });
    }
  }
}
