import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface StepData {
  step1: any | null;
  step2: any | null;
  step3: any | null;
  step4: any | null;
  step5: any | null;
}

const LS_KEY = 'siau.wizard.stepdata';

@Injectable({ providedIn: 'root' })
export class StepFormStateService {
  private _state = new BehaviorSubject<StepData>(this.loadFromLS());
  state$ = this._state.asObservable();

  private loadFromLS(): StepData {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '') as StepData; } catch { /* ignore */ }
    return { step1: null, step2: null, step3: null, step4: null, step5: null };
  }
  private saveToLS(s: StepData) { localStorage.setItem(LS_KEY, JSON.stringify(s)); }

  save<K extends keyof StepData>(key: K, value: StepData[K], persist = true) {
    const next = { ...this._state.value, [key]: value };
    this._state.next(next);
    if (persist) this.saveToLS(next);
  }

  get<K extends keyof StepData>(key: K) { return this._state.value[key]; }
  getAll(): StepData { return this._state.value; }
  clear() {
    const empty: StepData = { step1: null, step2: null, step3: null, step4: null, step5: null };
    this._state.next(empty);
    localStorage.removeItem(LS_KEY);
  }
}
