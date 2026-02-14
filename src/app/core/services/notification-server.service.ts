import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { ChatService } from './chat.service';

export interface ServerNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  timestamp: number;
}

export interface OnlineUsersData {
  count: number;
  users: string[];
}

@Injectable({
  providedIn: 'root'
})
export class NotificationServerService {
  private notificationSubject = new Subject<ServerNotification>();
  private onlineUsersSubject = new Subject<OnlineUsersData>();
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = environment.notificationServer.reconnectAttempts;
  private reconnectDelay = environment.notificationServer.reconnectDelay;
  private isManualDisconnect = false;
  private onlineUsersInterval: any = null;

  constructor(private authService: AuthService, private chatService: ChatService) {}

  get notifications$(): Observable<ServerNotification> {
    return this.notificationSubject.asObservable();
  }

  get onlineUsers$(): Observable<OnlineUsersData> {
    return this.onlineUsersSubject.asObservable();
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
            const registerMessage = { 
              type: 'register', 
              user: { 
                localId: userData.uid, 
                role: userData.role.toUpperCase() 
              } 
            };
            console.log('📤 Enviando registro al servidor push:', registerMessage);
            this.send(registerMessage);
            console.log('📝 Usuario registrado en el servidor');
            
            // Solicitar usuarios online inmediatamente
            this.requestOnlineUsers();
            
            // Solicitar usuarios online cada minuto
            this.startOnlineUsersPolling();
          }
        });
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📬 Notificación recibida:', data);
          
          // Si es un mensaje de error del servidor
          if (data.error) {
            const notification: ServerNotification = {
              id: Date.now().toString(),
              type: 'error',
              title: 'Error',
              message: data.error,
              data: data,
              timestamp: Date.now()
            };
            this.notificationSubject.next(notification);
            return;
          }
          
          // Si es respuesta de usuarios online
          if (data.type === 'online_users') {
            const userIds = data.content || [];
            console.log('👥 Usuarios online recibidos:', {
              count: userIds.length,
              users: userIds
            });
            this.onlineUsersSubject.next({
              count: userIds.length,
              users: userIds
            });
            return;
          }
          
          // Si es mensaje de chat
          if (data.type === 'chat_message') {
            console.log('💬 Mensaje de chat recibido:', data);
            const currentUser = this.authService.getCurrentUser();
            if (currentUser && data.from) {
              this.chatService.addMessage(data.from, currentUser.uid, data.content, false);
            }
            // Aún emitir como notificación para que otros componentes puedan reaccionar
            const notification: ServerNotification = {
              id: data.id || Date.now().toString(),
              type: data.type,
              title: 'Nuevo mensaje',
              message: data.content || '',
              data: data,
              timestamp: data.timestamp || Date.now()
            };
            this.notificationSubject.next(notification);
            return;
          }
          
          // Crear notificación con estructura estándar
          const notification: ServerNotification = {
            id: data.id || Date.now().toString(),
            type: data.type || 'info',
            title: data.title || 'Notificación',
            message: data.message || '',
            data: data,
            timestamp: data.timestamp || Date.now()
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
    this.stopOnlineUsersPolling();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  requestOnlineUsers(): void {
    console.log('📤 Solicitando usuarios online al servidor push...');
    this.send({ type: 'online_users' });
  }

  private startOnlineUsersPolling(): void {
    this.stopOnlineUsersPolling();
    this.onlineUsersInterval = setInterval(() => {
      this.requestOnlineUsers();
    }, 60000); // 1 minuto
  }

  private stopOnlineUsersPolling(): void {
    if (this.onlineUsersInterval) {
      clearInterval(this.onlineUsersInterval);
      this.onlineUsersInterval = null;
    }
  }
}
