import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

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
export class NotificationSSEService {
  private notificationSubject = new Subject<ServerNotification>();
  private eventSource: EventSource | null = null;

  constructor() {}

  get notifications$(): Observable<ServerNotification> {
    return this.notificationSubject.asObservable();
  }

  connect(serverUrl: string, token?: string): void {
    if (this.eventSource) {
      console.log('Ya existe una conexión SSE activa');
      return;
    }

    try {
      const url = token ? `${serverUrl}?token=${token}` : serverUrl;
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        console.log('✅ Conectado al servidor SSE');
      };

      this.eventSource.onmessage = (event) => {
        try {
          const notification: ServerNotification = JSON.parse(event.data);
          console.log('📬 Notificación SSE recibida:', notification);
          this.notificationSubject.next(notification);
        } catch (error) {
          console.error('Error al parsear notificación SSE:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('❌ Error en SSE:', error);
        this.disconnect();
      };
    } catch (error) {
      console.error('Error al conectar SSE:', error);
    }
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.log('🔌 Conexión SSE cerrada');
    }
  }

  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}
