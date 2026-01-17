import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { UserRepository } from '../../domain/repositories/user.repository';
import { User } from '../../domain/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class FirebaseUserRepository implements UserRepository {

  private collectionName = 'users';

  constructor(private firestore: Firestore) {}

  getAll(): Observable<User[]> {
    const ref = collection(this.firestore, this.collectionName);
    return collectionData(ref, { idField: 'id' }) as Observable<User[]>;
  }

  getById(id: string): Observable<User | null> {
    const ref = doc(this.firestore, `${this.collectionName}/${id}`);
    return docData(ref, { idField: 'id' }) as Observable<User>;
  }

  getByField(field: string, value: any): Observable<User[]> {
    const ref = collection(this.firestore, this.collectionName);
    const q = query(ref, where(field, '==', value));
    return collectionData(q, { idField: 'id' }) as Observable<User[]>;
  }

  async create(user: User): Promise<void> {
    const ref = collection(this.firestore, this.collectionName);
    await addDoc(ref, user);
  }

  async update(id: string, user: Partial<User>): Promise<void> {
    const ref = doc(this.firestore, `${this.collectionName}/${id}`);
    await updateDoc(ref, { ...user });
  }

  async delete(id: string): Promise<void> {
    const ref = doc(this.firestore, `${this.collectionName}/${id}`);
    await deleteDoc(ref);
  }
}
