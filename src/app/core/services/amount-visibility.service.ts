import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AmountVisibilityService {
  private readonly STORAGE_KEY = 'hideAmounts';
  private _hidden$ = new BehaviorSubject<boolean>(this.loadState());

  hidden$ = this._hidden$.asObservable();

  get hidden(): boolean {
    return this._hidden$.value;
  }

  toggle() {
    const next = !this._hidden$.value;
    this._hidden$.next(next);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(next));
  }

  private loadState(): boolean {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || 'false');
    } catch {
      return false;
    }
  }

  mask(value: number | string): string {
    return '•••';
  }
}
