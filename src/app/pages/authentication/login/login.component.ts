import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { fadeInUpAnimation } from '../../../../@fury/animations/fade-in-up.animation';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { SweetAlertService } from '../../../services/sweet-alert.service';

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
              private authService: AuthService,
              private notificationService: NotificationService,
              private alert: SweetAlertService
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
        
        // Verificar estado del usuario
        const user = this.authService.getCurrentUser();
        if (user) {
          const userData = await this.authService.getUserData(user.uid);
          
          // Verificar si el usuario está activo
          if (!userData?.active) {
            await this.authService.signOut();
            this.loading = false;
            this.alert.error('Usuario inactivo', 'Tu cuenta ha sido deshabilitada. Contacta al administrador.');
            return;
          }
          
          // Verificar si la fecha de activación ha expirado
          if (userData?.activeUntil) {
            let activeUntilDate: Date;
            
            // Si es un Timestamp de Firestore
            if ((userData.activeUntil as any).seconds) {
              activeUntilDate = new Date((userData.activeUntil as any).seconds * 1000);
            } else {
              activeUntilDate = userData.activeUntil instanceof Date 
                ? userData.activeUntil 
                : new Date(userData.activeUntil);
            }
            
            if (activeUntilDate < new Date()) {
              await this.authService.signOut();
              this.loading = false;
              this.alert.error('Cuenta expirada', 'Tu cuenta ha expirado. Contacta al administrador para renovar tu acceso.');
              return;
            }
          }
        }
        
        // Guardar isLoggedIn siempre, email solo si marca recordarme
        localStorage.setItem('isLoggedIn', 'true');
        
        if (this.rememberMe) {
          localStorage.setItem(this.REMEMBER_EMAIL_KEY, email);
        } else {
          localStorage.removeItem(this.REMEMBER_EMAIL_KEY);
        }
        
        await this.router.navigate(['/bets/surebets']);
        
        this.alert.success('¡Bienvenido!', 'Inicio de sesión exitoso');
        
        // FCM deshabilitado temporalmente - Solo se usa push del servidor backend
        // Esperar un momento para que Firebase Auth se inicialice completamente
        // setTimeout(() => {
        //   this.notificationService.requestPermissionAndSaveToken().catch(err => {
        //     console.log('Notificaciones no disponibles:', err.message);
        //   });
        // }, 1000);
      } catch (error: any) {
        this.loading = false;
        
        // Traducir errores de Firebase a mensajes entendibles
        let errorMessage = 'Error desconocido';
        
        if (error.code === 'auth/invalid-credential') {
          errorMessage = 'Correo o contraseña incorrectos';
        } else if (error.code === 'auth/user-not-found') {
          errorMessage = 'Usuario no encontrado';
        } else if (error.code === 'auth/wrong-password') {
          errorMessage = 'Contraseña incorrecta';
        } else if (error.code === 'auth/too-many-requests') {
          errorMessage = 'Demasiados intentos fallidos. Intenta más tarde';
        } else if (error.code === 'auth/user-disabled') {
          errorMessage = 'Esta cuenta ha sido deshabilitada';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.alert.error('Error de inicio de sesión', errorMessage);
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
