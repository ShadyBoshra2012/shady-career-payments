import { Injectable, inject } from '@angular/core';
import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from '@angular/fire/storage';
import { v4 as uuidv4 } from 'uuid';
import { PaymentAttachment } from '../models';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private storage = inject(Storage);

  async uploadFile(file: File, folder: string): Promise<PaymentAttachment> {
    const id = uuidv4();
    const ext = file.name.split('.').pop();
    const path = `${folder}/${id}.${ext}`;
    const storageRef = ref(this.storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return {
      id,
      url,
      name: file.name,
      type: file.type,
      uploadedAt: new Date(),
    };
  }

  async deleteFile(attachment: PaymentAttachment, folder: string): Promise<void> {
    const ext = attachment.name.split('.').pop();
    const path = `${folder}/${attachment.id}.${ext}`;
    const storageRef = ref(this.storage, path);
    try {
      await deleteObject(storageRef);
    } catch {
      // File may already be deleted
    }
  }
}
