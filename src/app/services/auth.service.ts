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
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<FirebaseUser | null> = user(this.auth);

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

  async resetPassword(email: string): Promise<void> {
    return await sendPasswordResetEmail(this.auth, email);
  }
}