// services/notification.service.ts
import { Injectable } from '@angular/core';
import { Messaging, getToken, onMessage } from '@angular/fire/messaging';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {

  constructor(
    private messaging: Messaging,
    private auth: Auth,
    private firestore: Firestore
  ) {}

  async requestPermissionAndSaveToken(): Promise<void> {
    try {
      console.log('🔍 Diagnóstico FCM:');
      console.log('1. Usuario actual:', this.auth.currentUser?.email);
      
      const user = this.auth.currentUser;
      if (!user) {
        console.log('❌ No hay usuario autenticado');
        return;
      }

      console.log('2. Estado actual de permisos:', Notification.permission);
      
      // Si ya fue denegado, no intentar de nuevo
      if (Notification.permission === 'denied') {
        console.log('⚠️ Permisos de notificación denegados previamente');
        console.log('💡 Para habilitar: Configuración del navegador > Permisos > Notificaciones');
        return;
      }

      console.log('3. Solicitando permiso de notificaciones...');
      const permission = await Notification.requestPermission();
      console.log('4. Permiso:', permission);
      
      if (permission !== 'granted') {
        console.log('❌ Permiso denegado');
        return;
      }

      console.log('5. Intentando obtener token FCM...');
      console.log('   - vapidKey:', environment.firebaseConfig.vapidKey.substring(0, 20) + '...');
      console.log('   - projectId:', environment.firebaseConfig.projectId);
      console.log('   - messagingSenderId:', environment.firebaseConfig.messagingSenderId);
      
      const token = await getToken(this.messaging, {
        vapidKey: environment.firebaseConfig.vapidKey
      });

      if (!token) {
        console.log('❌ No se pudo obtener token');
        return;
      }

      console.log('✅ Token FCM obtenido:', token.substring(0, 30) + '...');
      
      const userRef = doc(this.firestore, `users/${user.uid}`);
      await updateDoc(userRef, { fcmToken: token });
      
      console.log('✅ Token guardado en Firestore');
    } catch (error: any) {
      console.error('❌ Error al configurar notificaciones:', error);
      console.error('   Código:', error.code);
      console.error('   Mensaje:', error.message);
    }
  }

  listenForegroundMessages() {
    try {
      onMessage(this.messaging, payload => {
        console.log('Mensaje recibido:', payload);
        if (payload.notification?.title) {
          new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: '/assets/icons/icon-72x72.png'
          });
        }
      });
    } catch (error) {
      console.error('Error al escuchar mensajes:', error);
    }
  }
}
