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
  rememberMe = false;

  inputType = 'password';
  visible = false;

  private readonly REMEMBER_EMAIL_KEY = 'rememberEmail';

  constructor(private router: Router,
              private fb: UntypedFormBuilder,
              private cd: ChangeDetectorRef,
              private snackbar: MatSnackBar,
              private authService: AuthService,
              private notificationService: NotificationService
  ) {
  }

  ngOnInit() {
    // Inicializar el formulario primero
    const savedEmail = localStorage.getItem(this.REMEMBER_EMAIL_KEY);
    
    this.form = this.fb.group({
      email: [savedEmail || '', Validators.required],
      password: ['', Validators.required]
    });

    // Si hay email guardado, marcar el toggle
    if (savedEmail) {
      this.rememberMe = true;
    }
    
    // Verificar si ya está logueado
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
      this.router.navigate(['/bets/surebets']);
    }
  }

  async send() {
    if (this.form.valid) {
      this.loading = true;
      try {
        const { email, password } = this.form.value;
        
        await this.authService.signIn(email, password);
        
        // Guardar o eliminar email e isLoggedIn según el toggle
        if (this.rememberMe) {
          localStorage.setItem(this.REMEMBER_EMAIL_KEY, email);
          localStorage.setItem('isLoggedIn', 'true');
        } else {
          localStorage.removeItem(this.REMEMBER_EMAIL_KEY);
          localStorage.removeItem('isLoggedIn');
        }
        
        await this.router.navigate(['/bets/surebets']);
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
