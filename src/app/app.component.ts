import { Component, Inject, Renderer2, OnDestroy } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { SidenavService } from './layout/sidenav/sidenav.service';
import { ThemeService } from '../@fury/services/theme.service';
import { ActivatedRoute, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Platform } from '@angular/cdk/platform';
import { SplashScreenService } from '../@fury/services/splash-screen.service';
import { NotificationService } from './services/notification.service';
import { AuthService } from './services/auth.service';
import { NotificationServerService } from './core/services/notification-server.service';
import { SweetAlertService } from './services/sweet-alert.service';
import { Subscription } from 'rxjs';
import { PushNotificationModalComponent } from './shared/components/push-notification-modal/push-notification-modal.component';
import { UserService } from './core/services/user.service';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'betsweb-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnDestroy {
  private notificationSubscription: Subscription | null = null;
  private tokenValidationInterval: any = null;

  constructor(private sidenavService: SidenavService,
              private iconRegistry: MatIconRegistry,
              private renderer: Renderer2,
              private themeService: ThemeService,
              @Inject(DOCUMENT) private document: Document,
              private platform: Platform,
              private route: ActivatedRoute,
              private splashScreenService: SplashScreenService,
              private notificationService: NotificationService,
              private router: Router,
              private authService: AuthService,
              private notificationServer: NotificationServerService,
              private alert: SweetAlertService,
              private dialog: MatDialog,
              private userService: UserService) {
    this.authService.user$.subscribe(async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await this.authService.getUserData(firebaseUser.uid);
        const isSuperadmin = userDoc?.role === 'superadmin';
        this.sidenavService.updateItemVisibility('/users', isSuperadmin);
      }
    });
    this.route.queryParamMap.pipe(
      filter(queryParamMap => queryParamMap.has('style'))
    ).subscribe(queryParamMap => this.themeService.setStyle(queryParamMap.get('style')));

    this.iconRegistry.setDefaultFontSetClass('material-icons-outlined');
    this.themeService.theme$.subscribe(theme => {
      if (theme[0]) {
        this.renderer.removeClass(this.document.body, theme[0]);
      }

      this.renderer.addClass(this.document.body, theme[1]);
    });

    if (this.platform.BLINK) {
      this.renderer.addClass(this.document.body, 'is-blink');
    }

    this.sidenavService.addItems([
      {
        name: 'APPS',
        position: 5,
        type: 'subheading',
        customClass: 'first-subheading',
        visible: true
      },
      {
        name: 'Dashboard',
        routeOrFunction: '/dashboard',
        icon: 'dashboard',
        position: 10,
        pathMatchExact: false,
        visible: true
      },
      {
        name: 'All-In-One Table',
        routeOrFunction: '/tables/all-in-one-table',
        icon: 'assignment',
        badge: '22',
        position: 15,
        visible: false
      },
      {
        name: 'Calendar',
        routeOrFunction: '/apps/calendar',
        icon: 'date_range',
        position: 20,
        visible: false
      },
      {
        name: 'Inbox',
        routeOrFunction: '/apps/inbox',
        icon: 'inbox',
        position: 25,
        visible: false
      },
      {
        name: 'Chat',
        routeOrFunction: '/apps/chat',
        icon: 'chat',
        position: 30,
        badge: '14',
        visible: false
      },
      {
        name: 'Surebets',
        routeOrFunction: '/bets/surebets',
        icon: 'trending_up',
        position: 31,
        visible: true
      },
      {
        name: 'USER INTERFACE',
        type: 'subheading',
        position: 35,
        visible: true
      },
      {
        name: 'Usuarios',
        routeOrFunction: '/users',
        icon: 'lock',
        position: 36,
        visible: false
      },
      {
        name: 'Components',
        routeOrFunction: '/components',
        icon: 'layers',
        position: 40,
        visible: false
      },
      {
        name: 'Forms',
        icon: 'description',
        position: 45,
        visible: false,
        subItems: [
          {
            name: 'Form Elements',
            routeOrFunction: '/forms/form-elements',
            position: 10,
            visible: false
          },
          {
            name: 'Form Wizard',
            routeOrFunction: '/forms/form-wizard',
            position: 15,
            visible: false
          }
        ]
      },
      {
        name: 'Drag & Drop',
        routeOrFunction: '/drag-and-drop',
        icon: 'mouse',
        position: 55,
        visible: false
      },
      {
        name: 'WYSIWYG Editor',
        routeOrFunction: '/editor',
        icon: 'format_shapes',
        position: 60,
        visible: false
      },
      {
        name: 'PAGES',
        type: 'subheading',
        position: 65,
        visible: false
      },
      {
        name: 'Authentication',
        icon: 'lock',
        position: 66,
        visible: false,
        subItems: [
          {
            name: 'Login Page',
            routeOrFunction: '/login',
            position: 5,
            visible: false
          },
          {
            name: 'Register Page',
            routeOrFunction: '/register',
            position: 10,
            visible: false
          },
          {
            name: 'Forgot Password',
            routeOrFunction: '/forgot-password',
            position: 15,
            visible: false
          }
        ]
      },
      {
        name: 'Page Layouts',
        icon: 'view_compact',
        position: 67,
        visible: false,
        subItems: [
          {
            name: 'Simple',
            routeOrFunction: '/page-layouts/simple',
            position: 5,
            visible: false
          },
          {
            name: 'Simple Tabbed',
            routeOrFunction: '/page-layouts/simple-tabbed',
            position: 5,
            visible: false
          },
          {
            name: 'Card',
            routeOrFunction: '/page-layouts/card',
            position: 10,
            visible: false
          },
          {
            name: 'Card Tabbed',
            routeOrFunction: '/page-layouts/card-tabbed',
            position: 15,
            visible: false
          },
        ],
        badge: '4'
      },
      {
        name: 'Coming Soon',
        routeOrFunction: '/coming-soon',
        icon: 'watch_later',
        position: 68,
        visible: false
      },
      {
        name: 'Blank',
        routeOrFunction: '/blank',
        icon: 'picture_in_picture',
        position: 69,
        visible: false
      },
      {
        name: 'Material Icons',
        routeOrFunction: '/icons',
        icon: 'grade',
        position: 75,
        visible: false
      },
      {
        name: 'Multi-Level Menu',
        icon: 'menu',
        position: 85,
        visible: false,
        subItems: [
          {
            name: 'Level 1',
            visible: false,
            subItems: [
              {
                name: 'Level 2',
                visible: false,
                subItems: [
                  {
                    name: 'Level 3',
                    visible: false,
                    subItems: [
                      {
                        name: 'Level 4',
                        visible: false,
                        subItems: [
                          {
                            name: 'Level 5',
                            routeOrFunction: '/level1/level2/level3/level4/level5',
                            visible: false
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]);
  }

  ngOnInit() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'false';
    
    if (isLoggedIn) {
      this.router.navigate(['/bets/surebets']);
    } else {
      this.router.navigate(['/login']);
    }
    
    // Detectar cierre de navegador/pestaña para hacer logout automático
    this.setupBeforeUnloadHandler();
    
    // FCM deshabilitado temporalmente - Solo se usa push del servidor backend
    // Firebase notifications (mantener para uso futuro)
    // this.notificationService.listenForegroundMessages();
    
    // Conectar al servidor de notificaciones del backend (WebSocket)
    this.authService.user$.subscribe(user => {
      if (user) {
        this.notificationServer.connect();
        this.setupNotificationListener();
        this.startTokenValidation();
        
        // Cargar usuarios una vez al iniciar
        this.userService.loadUsers().subscribe();
      } else {
        this.notificationServer.disconnect();
        this.stopTokenValidation();
      }
    });
  }

  private setupNotificationListener(): void {
    this.notificationSubscription = this.notificationServer.notifications$.subscribe(
      notification => {
        console.log('Notificación recibida en app:', notification);
        
        // Handler para diferentes tipos de notificaciones
        switch (notification.type) {
          case 'general_announcement':
            // Anuncio general para todos los usuarios
            if (notification.data?.subject && notification.data?.content) {
              this.dialog.open(PushNotificationModalComponent, {
                data: {
                  subject: notification.data.subject,
                  content: notification.data.content,
                  type: notification.type
                },
                panelClass: 'push-notification-dialog',
                disableClose: false,
                hasBackdrop: true,
                backdropClass: 'push-notification-backdrop'
              });
            }
            break;

          case 'user_message':
            // Mensaje específico para un usuario
            if (notification.message || notification.data?.message) {
              const messageData = notification.message || notification.data.message;
              this.dialog.open(PushNotificationModalComponent, {
                data: {
                  subject: messageData.subject || 'Mensaje Personal',
                  content: messageData.content || notification.message,
                  type: notification.type
                },
                panelClass: 'push-notification-dialog',
                disableClose: false,
                hasBackdrop: true,
                backdropClass: 'push-notification-backdrop'
              });
            }
            break;

          case 'success':
            this.alert.toast('success', notification.message);
            break;

          case 'error':
            this.alert.toast('error', notification.message);
            break;

          case 'warning':
            this.alert.toast('warning', notification.message);
            break;

          case 'info':
            // Modal para notificaciones informativas
            if (notification.data?.subject && notification.data?.content) {
              this.dialog.open(PushNotificationModalComponent, {
                data: {
                  subject: notification.data.subject,
                  content: notification.data.content,
                  type: notification.type
                },
                panelClass: 'push-notification-dialog',
                disableClose: false,
                hasBackdrop: true,
                backdropClass: 'push-notification-backdrop'
              });
            } else {
              this.alert.toast('info', notification.message);
            }
            break;

          case 'chat_message':
            // Los mensajes de chat se manejan en el ChatService
            // No mostrar notificación aquí
            break;

          default:
            // Notificación del navegador para tipos desconocidos
            if (Notification.permission === 'granted') {
              new Notification(notification.title, {
                body: notification.message || JSON.stringify(notification.data),
                icon: '/assets/icons/icon-72x72.png'
              });
            }
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.notificationSubscription?.unsubscribe();
    this.notificationServer.disconnect();
    this.stopTokenValidation();
    this.removeBeforeUnloadHandler();
  }

  private setupBeforeUnloadHandler(): void {
    // Detectar cierre de navegador/pestaña
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
  }

  private removeBeforeUnloadHandler(): void {
    window.removeEventListener('beforeunload', this.handleBeforeUnload.bind(this));
  }

  private handleBeforeUnload(event: BeforeUnloadEvent): void {
    // Hacer logout síncrono al cerrar navegador
    const user = this.authService.getCurrentUser();
    if (user) {
      // Usar sendBeacon para enviar datos de forma confiable al cerrar
      navigator.sendBeacon(
        '/api/logout',  // Endpoint que debe manejar el decremento
        JSON.stringify({ uid: user.uid })
      );
    }
  }

  private startTokenValidation(): void {
    // Verificar token cada 15 minutos
    this.tokenValidationInterval = setInterval(async () => {
      try {
        const user = this.authService.getCurrentUser();
        if (user) {
          // Forzar refresco del token para verificar si sigue siendo válido
          await user.getIdToken(true);
        }
      } catch (error) {
        console.log('Token inválido, cerrando sesión...');
        await this.authService.signOut();
        this.router.navigate(['/login']);
        this.alert.toast('warning', 'Tu sesión ha sido cerrada');
      }
    }, 15 * 60 * 1000); // 15 minutos
  }

  private stopTokenValidation(): void {
    if (this.tokenValidationInterval) {
      clearInterval(this.tokenValidationInterval);
      this.tokenValidationInterval = null;
    }
  }
}
