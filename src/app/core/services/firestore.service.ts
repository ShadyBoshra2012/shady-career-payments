import { Injectable, inject } from '@angular/core';
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
  orderBy,
  Timestamp,
  writeBatch,
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private firestore = inject(Firestore);

  getCollection<T>(path: string, orderField = 'createdAt'): Observable<T[]> {
    const ref = collection(this.firestore, path);
    const q = query(ref, orderBy(orderField, 'desc'));
    return collectionData(q, { idField: 'id' }).pipe(
      map((docs) => docs.map((d) => this.convertTimestamps(d)) as T[])
    );
  }

  getCollectionAsc<T>(path: string, orderField = 'date'): Observable<T[]> {
    const ref = collection(this.firestore, path);
    const q = query(ref, orderBy(orderField, 'asc'));
    return collectionData(q, { idField: 'id' }).pipe(
      map((docs) => docs.map((d) => this.convertTimestamps(d)) as T[])
    );
  }

  getDocument<T>(path: string): Observable<T> {
    const ref = doc(this.firestore, path);
    return docData(ref, { idField: 'id' }).pipe(
      map((d) => this.convertTimestamps((d || {}) as Record<string, unknown>) as T)
    );
  }

  async addDocument(path: string, data: Record<string, unknown>): Promise<string> {
    const ref = collection(this.firestore, path);
    const cleaned = this.convertDatesToTimestamps(data);
    const docRef = await addDoc(ref, cleaned);
    return docRef.id;
  }

  async updateDocument(path: string, data: Record<string, unknown>): Promise<void> {
    const ref = doc(this.firestore, path);
    const cleaned = this.convertDatesToTimestamps(data);
    await updateDoc(ref, cleaned);
  }

  async deleteDocument(path: string): Promise<void> {
    const ref = doc(this.firestore, path);
    await deleteDoc(ref);
  }

  async batchWrite(operations: { path: string; data: Record<string, unknown> }[]): Promise<void> {
    const batch = writeBatch(this.firestore);
    for (const op of operations) {
      const ref = doc(collection(this.firestore, op.path));
      batch.set(ref, this.convertDatesToTimestamps(op.data));
    }
    await batch.commit();
  }

  private convertTimestamps(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val instanceof Timestamp) {
        result[key] = val.toDate();
      } else if (val && typeof val === 'object' && !Array.isArray(val)) {
        result[key] = this.convertTimestamps(val as Record<string, unknown>);
      } else if (Array.isArray(val)) {
        result[key] = val.map((item) =>
          item && typeof item === 'object' && !(item instanceof Timestamp)
            ? this.convertTimestamps(item as Record<string, unknown>)
            : item instanceof Timestamp
              ? item.toDate()
              : item
        );
      } else {
        result[key] = val;
      }
    }
    return result;
  }

  private convertDatesToTimestamps(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (typeof val === 'undefined') {
        continue;
      }
      if (val instanceof Date) {
        result[key] = Timestamp.fromDate(val);
      } else if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Timestamp)) {
        result[key] = this.convertDatesToTimestamps(val as Record<string, unknown>);
      } else if (Array.isArray(val)) {
        result[key] = val
          .map((item) => {
            if (typeof item === 'undefined') {
              return undefined;
            }
            if (item instanceof Date) {
              return Timestamp.fromDate(item);
            }
            if (item && typeof item === 'object') {
              return this.convertDatesToTimestamps(item as Record<string, unknown>);
            }
            return item;
          })
          .filter((item) => typeof item !== 'undefined');
      } else {
        result[key] = val;
      }
    }
    return result;
  }
}
