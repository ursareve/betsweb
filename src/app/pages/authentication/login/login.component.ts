import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { fadeInUpAnimation } from '../../../../@fury/animations/fade-in-up.animation';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'fury-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  animations: [fadeInUpAnimation]
})
export class LoginComponent implements OnInit {

  form: UntypedFormGroup;
  loading = false;

  inputType = 'password';
  visible = false;

  constructor(private router: Router,
              private fb: UntypedFormBuilder,
              private cd: ChangeDetectorRef,
              private snackbar: MatSnackBar,
              private authService: AuthService,
              private notificationService: NotificationService
  ) {
  }

  ngOnInit() {
    this.form = this.fb.group({
      email: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  async send() {
    if (this.form.valid) {
      this.loading = true;
      try {
        const { email, password } = this.form.value;
        await this.authService.signIn(email, password);
        await this.router.navigate(['/dashboard']);
        this.snackbar.open('Login successful!', 'OK', { duration: 3000 });
        
        // Esperar un momento para que Firebase Auth se inicialice completamente
        setTimeout(() => {
          this.notificationService.requestPermissionAndSaveToken().catch(err => {
            console.log('Notificaciones no disponibles:', err.message);
          });
        }, 1000);
      } catch (error: any) {
        this.loading = false;
        this.snackbar.open('Login failed: ' + error.message, 'OK', { duration: 5000 });
      }
    }
  }

  toggleVisibility() {
    if (this.visible) {
      this.inputType = 'password';
      this.visible = false;
      this.cd.markForCheck();
    } else {
      this.inputType = 'text';
      this.visible = true;
      this.cd.markForCheck();
    }
  }
}
