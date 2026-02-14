import { Injectable } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  user,
  User as FirebaseUser
} from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc, runTransaction, onSnapshot, serverTimestamp } from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<FirebaseUser | null> = user(this.auth);
  private sessionId: string | null = null;
  private heartbeatInterval: any = null;

  constructor(private auth: Auth, private firestore: Firestore, private functions: Functions) {}

  async signIn(email: string, password: string) {
    const result = await signInWithEmailAndPassword(this.auth, email, password);
    await this.createUserDocumentIfNotExists(result.user);
    
    const uid = result.user.uid;
    const userRef = doc(this.firestore, `users/${uid}`);
    this.sessionId = this.generateSessionId();

    try {
      await runTransaction(this.firestore, async tx => {
        const snap = await tx.get(userRef);
        const data = snap.data() || {};
        
        // Superadmin no tiene límite de sesiones
        const isSuperadmin = data['role'] === 'superadmin';

        if (!isSuperadmin) {
          const active = data['activeSessionsCount'] || 0;
          const max = data['maxSessions'] || 1;

          if (active >= max) {
            throw new Error('MAX_SESSIONS');
          }
        }

        tx.set(
          userRef,
          { 
            activeSessionsCount: (data['activeSessionsCount'] || 0) + 1,
            hasActiveSession: true,
            lastHeartbeat: serverTimestamp(),
            [`sessions.${this.sessionId}`]: {
              createdAt: serverTimestamp(),
              lastHeartbeat: serverTimestamp(),
              role: data['role'] || 'guest'
            }
          },
          { merge: true }
        );
      });
      
      // Iniciar heartbeat para mantener la sesión activa
      this.startHeartbeat(uid);
    } catch (e: any) {
      await signOut(this.auth);
      if (e.message === 'MAX_SESSIONS') {
        throw new Error('Límite de sesiones alcanzado');
      }
      throw e;
    }
    
    return result;
  }

  async signUp(email: string, password: string) {
    const result = await createUserWithEmailAndPassword(this.auth, email, password);
    await this.createUserDocumentIfNotExists(result.user);
    return result;
  }

  async signOut() {
    this.stopHeartbeat();
    
    const uid = this.auth.currentUser?.uid;
    if (uid && this.sessionId) {
      const userRef = doc(this.firestore, `users/${uid}`);
      
      // Usar transacción para garantizar atomicidad
      await runTransaction(this.firestore, async tx => {
        const snap = await tx.get(userRef);
        const active = snap.data()?.['activeSessionsCount'] || 0;
        const newCount = Math.max(active - 1, 0);
        
        tx.set(
          userRef,
          { 
            activeSessionsCount: newCount,
            hasActiveSession: newCount > 0,
            [`sessions.${this.sessionId}`]: null  // Eliminar esta sesión
          },
          { merge: true }
        );
      });
    }
    
    this.sessionId = null;
    localStorage.removeItem('isLoggedIn');
    return await signOut(this.auth);
  }

  getCurrentUser() {
    return this.auth.currentUser;
  }

  async getUserData(uid: string): Promise<User | null> {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    const userDoc = await getDoc(userDocRef);
    return userDoc.exists() ? userDoc.data() as User : null;
  }

  private async createUserDocumentIfNotExists(user: FirebaseUser) {
    const userDocRef = doc(this.firestore, `users/${user.uid}`);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        firstName: user.displayName || 'Usuario',
        lastName: '',
        email: user.email,
        document: '',
        gender: 'masculino',
        role: 'guest',
        active: true,
        createdAt: new Date(),
        maxSessions: 1,
        activeSessionsCount: 0,
        hasActiveSession: false
      });
    }
  }

  async saveFCMToken(token: string) {
    const user = this.getCurrentUser();
    if (user) {
      const userDocRef = doc(this.firestore, `users/${user.uid}`);
      await setDoc(userDocRef, { fcmToken: token }, { merge: true });
    }
  }

  async resetPassword(email: string): Promise<void> {
    return await sendPasswordResetEmail(this.auth, email);
  }

  async resetUserSessions(uid: string): Promise<void> {
    const userRef = doc(this.firestore, `users/${uid}`);
    
    // Usar transacción para garantizar consistencia
    await runTransaction(this.firestore, async tx => {
      tx.set(
        userRef,
        { 
          activeSessionsCount: 0,
          hasActiveSession: false
        },
        { merge: true }
      );
    });
  }

  async forceLogoutUser(uid: string): Promise<void> {
    const callable = httpsCallable(this.functions, 'forceLogoutUser');
    const result = await callable({ uid });
    return result.data as any;
  }

  private generateSessionId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startHeartbeat(uid: string): void {
    // Detener heartbeat anterior si existe
    this.stopHeartbeat();
    
    // Enviar heartbeat cada 30 segundos
    this.heartbeatInterval = setInterval(async () => {
      if (this.sessionId) {
        const userRef = doc(this.firestore, `users/${uid}`);
        try {
          await setDoc(
            userRef,
            {
              lastHeartbeat: serverTimestamp(),
              [`sessions.${this.sessionId}.lastHeartbeat`]: serverTimestamp()
            },
            { merge: true }
          );
        } catch (error) {
          console.error('Error enviando heartbeat:', error);
        }
      }
    }, 30000); // 30 segundos
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Método para limpiar sesiones inactivas (llamar desde Cloud Function o admin)
  async cleanupInactiveSessions(uid: string, timeoutMinutes: number = 5): Promise<void> {
    const userRef = doc(this.firestore, `users/${uid}`);
    const snap = await getDoc(userRef);
    const data = snap.data();
    
    if (!data || !data['sessions']) return;
    
    // Superadmin no tiene limpieza automática de sesiones
    const isSuperadmin = data['role'] === 'superadmin';
    if (isSuperadmin) return;
    
    const sessions = data['sessions'];
    const now = Date.now();
    const timeoutMs = timeoutMinutes * 60 * 1000;
    let inactiveCount = 0;
    
    const updates: any = {};
    
    for (const [sessionId, sessionData] of Object.entries(sessions)) {
      const lastHeartbeat = (sessionData as any)?.lastHeartbeat;
      if (lastHeartbeat) {
        const lastHeartbeatTime = lastHeartbeat.seconds ? lastHeartbeat.seconds * 1000 : lastHeartbeat;
        if (now - lastHeartbeatTime > timeoutMs) {
          updates[`sessions.${sessionId}`] = null;
          inactiveCount++;
        }
      }
    }
    
    if (inactiveCount > 0) {
      await runTransaction(this.firestore, async tx => {
        const snap = await tx.get(userRef);
        const active = snap.data()?.['activeSessionsCount'] || 0;
        const newCount = Math.max(active - inactiveCount, 0);
        
        tx.set(
          userRef,
          {
            ...updates,
            activeSessionsCount: newCount,
            hasActiveSession: newCount > 0
          },
          { merge: true }
        );
      });
    }
  }
}