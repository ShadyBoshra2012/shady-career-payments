import { Injectable, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  user,
  updateProfile,
  User,
} from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
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

  async register(email: string, password: string, displayName: string): Promise<void> {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    await updateProfile(cred.user, { displayName });
    const profile: UserProfile = {
      uid: cred.user.uid,
      email,
      displayName,
      role: 'admin',
      createdAt: new Date(),
    };
    await setDoc(doc(this.firestore, `users/${cred.user.uid}`), profile);
  }

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
