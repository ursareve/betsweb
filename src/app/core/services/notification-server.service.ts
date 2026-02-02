import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

export interface ServerNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationServerService {
  private notificationSubject = new Subject<ServerNotification>();
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = environment.notificationServer.reconnectAttempts;
  private reconnectDelay = environment.notificationServer.reconnectDelay;
  private isManualDisconnect = false;

  constructor(private authService: AuthService) {}

  get notifications$(): Observable<ServerNotification> {
    return this.notificationSubject.asObservable();
  }

  connect(): void {
    if (!environment.notificationServer.enabled) {
      console.log('⚠️ Servidor de notificaciones deshabilitado');
      return;
    }

    if (this.socket?.readyState === WebSocket.OPEN) {
      console.log('Ya existe una conexión activa');
      return;
    }

    const user = this.authService.getCurrentUser();
    if (!user) {
      console.log('⚠️ No hay usuario autenticado');
      return;
    }

    try {
      const url = environment.notificationServer.url;
      console.log('🔌 Conectando a:', url);
      
      this.socket = new WebSocket(url);
      this.isManualDisconnect = false;

      this.socket.onopen = () => {
        console.log('✅ Conectado al servidor de notificaciones');
        this.reconnectAttempts = 0;
        
        // Registrar usuario en el servidor
        this.authService.getUserData(user.uid).then(userData => {
          if (userData) {
            this.send({ 
              type: 'register', 
              user: { 
                localId: userData.uid, 
                role: userData.role.toUpperCase() 
              } 
            });
            console.log('📝 Usuario registrado en el servidor');
          }
        });
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📬 Notificación recibida:', data);
          
          // Crear notificación con estructura estándar
          const notification: ServerNotification = {
            id: Date.now().toString(),
            type: data.type || 'info',
            title: data.title || 'Notificación',
            message: data.message || '',
            data: data,
            timestamp: Date.now()
          };
          
          this.notificationSubject.next(notification);
        } catch (error) {
          console.error('Error al parsear notificación:', error);
        }
      };

      this.socket.onerror = (error) => {
        console.error('❌ Error en WebSocket:', error);
      };

      this.socket.onclose = () => {
        console.log('🔌 Conexión cerrada');
        if (!this.isManualDisconnect) {
          this.attemptReconnect();
        }
      };
    } catch (error) {
      console.error('Error al conectar:', error);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Reintentando conexión (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay);
    } else {
      console.error('❌ Máximo de reintentos alcanzado');
    }
  }

  send(message: any): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket no está conectado');
    }
  }

  disconnect(): void {
    this.isManualDisconnect = true;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}
