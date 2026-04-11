import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '@angular/fire/auth';
import { 
  Firestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where
} from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';
import { User, CreateUserData, UpdateUserData } from '../../models/user.model';
import { UserRepository } from './user.repository';

@Injectable()
export class UserFirebaseRepository extends UserRepository {
  private usersCollection = 'users';

  constructor(private auth: Auth, private firestore: Firestore) {
    super();
  }

  async createUser(userData: CreateUserData): Promise<User> {
    const currentUser = this.auth.currentUser;
    
    const userCredential = await createUserWithEmailAndPassword(
      this.auth, 
      userData.email, 
      userData.password
    );

    const user: User = {
      uid: userCredential.user.uid,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      document: userData.document,
      gender: userData.gender,
      role: userData.role,
      active: userData.active ?? true,
      avatarUrl: userData.avatarUrl,
      createdAt: new Date()
    };

    const userDocRef = doc(this.firestore, `${this.usersCollection}/${user.uid}`);
    await setDoc(userDocRef, user);

    if (currentUser) {
      await this.auth.updateCurrentUser(currentUser);
    }

    return user;
  }

  async getUser(uid: string): Promise<User | null> {
    const userDocRef = doc(this.firestore, `${this.usersCollection}/${uid}`);
    const userDoc = await getDoc(userDocRef);
    return userDoc.exists() ? userDoc.data() as User : null;
  }

  getAllUsers(): Observable<User[]> {
    const usersRef = collection(this.firestore, this.usersCollection);
    return from(getDocs(usersRef)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      } as User)))
    );
  }

  getUsersByRole(role: string): Observable<User[]> {
    const usersRef = collection(this.firestore, this.usersCollection);
    const q = query(usersRef, where('role', '==', role));
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      } as User)))
    );
  }

  async updateUser(uid: string, userData: UpdateUserData): Promise<void> {
    const userDocRef = doc(this.firestore, `${this.usersCollection}/${uid}`);
    await updateDoc(userDocRef, { ...userData, updatedAt: new Date() });
  }

  async deleteUser(uid: string): Promise<void> {
    const userDocRef = doc(this.firestore, `${this.usersCollection}/${uid}`);
    await deleteDoc(userDocRef);
  }

  async toggleUserStatus(uid: string, active: boolean): Promise<void> {
    await this.updateUser(uid, { active });
  }
}
