import { Injectable } from '@angular/core';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  constructor(private storage: Storage) {}

  async uploadUserAvatar(file: File, uid: string): Promise<string> {
    try {
      const timestamp = Date.now();
      const fileName = `${uid}_${timestamp}.${file.name.split('.').pop()}`;
      const filePath = `users/avatars/${fileName}`;
      const storageRef = ref(this.storage, filePath);
      
      console.log('Subiendo archivo a:', filePath);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      console.log('URL obtenida:', url);
      return url;
    } catch (error) {
      console.error('Error detallado en upload:', error);
      throw error;
    }
  }

  async deleteUserAvatar(uid: string): Promise<void> {
    const filePath = `users/avatars/${uid}`;
    const storageRef = ref(this.storage, filePath);
    try {
      await deleteObject(storageRef);
    } catch (error) {
      console.log('No se pudo eliminar la imagen anterior');
    }
  }
}
