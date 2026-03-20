import { Injectable, inject } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  signOut,
  user,
  User,
} from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Observable, from, map, switchMap, of } from 'rxjs';
import { UserProfile } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  user$ = user(this.auth);

  userProfile$: Observable<UserProfile | null> = this.user$.pipe(
    switchMap((u) => {
      if (!u) return of(null);
      return from(getDoc(doc(this.firestore, `users/${u.uid}`))).pipe(
        map((snap) => (snap.exists() ? (snap.data() as UserProfile) : null))
      );
    })
  );

  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }
}
