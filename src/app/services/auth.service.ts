import { Injectable } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  user,
  User
} from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<User | null> = user(this.auth);

  constructor(private auth: Auth, private firestore: Firestore) {}

  async signIn(email: string, password: string) {
    const result = await signInWithEmailAndPassword(this.auth, email, password);
    await this.createUserDocumentIfNotExists(result.user);
    return result;
  }

  async signUp(email: string, password: string) {
    const result = await createUserWithEmailAndPassword(this.auth, email, password);
    await this.createUserDocumentIfNotExists(result.user);
    return result;
  }

  async signOut() {
    return await signOut(this.auth);
  }

  getCurrentUser() {
    return this.auth.currentUser;
  }

  private async createUserDocumentIfNotExists(user: User) {
    const userDocRef = doc(this.firestore, `users/${user.uid}`);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        name: user.displayName || 'Usuario',
        email: user.email,
        role: 'user',
        active: true,
        createdAt: new Date()
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
}