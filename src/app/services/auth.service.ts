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
import { Firestore, doc, setDoc, getDoc, runTransaction } from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<FirebaseUser | null> = user(this.auth);

  constructor(private auth: Auth, private firestore: Firestore, private functions: Functions) {}

  async signIn(email: string, password: string) {
    const result = await signInWithEmailAndPassword(this.auth, email, password);
    await this.createUserDocumentIfNotExists(result.user);
    
    const uid = result.user.uid;
    const userRef = doc(this.firestore, `users/${uid}`);

    try {
      await runTransaction(this.firestore, async tx => {
        const snap = await tx.get(userRef);
        const data = snap.data() || {};

        const active = data['activeSessionsCount'] || 0;
        const max = data['maxSessions'] || 1;

        if (active >= max) {
          throw new Error('MAX_SESSIONS');
        }

        tx.set(
          userRef,
          { 
            activeSessionsCount: active + 1,
            hasActiveSession: true 
          },
          { merge: true }
        );
      });
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
    const uid = this.auth.currentUser?.uid;
    if (uid) {
      const userRef = doc(this.firestore, `users/${uid}`);
      const snap = await getDoc(userRef);
      const active = snap.data()?.['activeSessionsCount'] || 1;

      await setDoc(
        userRef,
        { 
          activeSessionsCount: Math.max(active - 1, 0),
          hasActiveSession: false
        },
        { merge: true }
      );
    }
    
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
    await setDoc(
      userRef,
      { 
        activeSessionsCount: 0,
        hasActiveSession: false
      },
      { merge: true }
    );
  }

  async forceLogoutUser(uid: string): Promise<void> {
    const callable = httpsCallable(this.functions, 'forceLogoutUser');
    const result = await callable({ uid });
    return result.data as any;
  }
}