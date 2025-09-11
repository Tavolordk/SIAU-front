import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CatPerfilDto } from '../../services/catalogos.service';

/* ==== Tipos por paso (ajústalos a tus forms si hace falta) ==== */
export interface Step1State {
  rfc?: string|null; nombre?: string|null; nombre2?: string|null;
  apellidoPaterno?: string|null; apellidoMaterno?: string|null;
  curp?: string|null; cuip?: string|null;
  telefono?: string|null; correo?: string|null;
  tipoUsuario?: number;
  cuentaUsuario?: string|null; password?: string|null;
  numeroOficio?: string|null; folio?: string|null;
}
export interface Step2State {
  cargo?: string|null; funciones?: string|null; funciones2?: string|null;
  entidad?: number; municipio?: number; area?: number;
  entidad2?: number; municipio2?: number; corporacion2?: number;
  chkModifica?: boolean; chkAmplia?: boolean; chkReactiva?: boolean; chkCambioAdscripcion?: boolean;
    perfiles?: CatPerfilDto[];         // lista que persistes en el form (control 'perfiles')

}
/** ¡Ojo! File no se puede persistir en localStorage; ver nota abajo. */
export interface Step3State {
  perfiles?: string[];
  docs?: Array<{ file: File; tipoDocumentoId: number; storageRuta?: string; storageProveedor?: string }>;
}
// src/app/step-form/state/step-form-state.service.ts
export interface DocMeta {
  idTemp: number;
  tipoDocumentoId: number;
  nombreOriginal: string;
  extension: string;
  mimeType: string;
  tamanoBytes: number;
  storageProveedor: string;   // 'LOCAL' | 'S3' | ...
  storageRuta: string;        // '/uploads/...' o 's3://...'
  checksumSha256: string;
  fechaDocumento?: string;    // opcional, para UI
  urlPublica?: string;        // opcional, para botón Ver
}
export interface StepData {
  step1: Step1State|null;
  step2: Step2State|null;
  step3: Step3State|null;   // 👈 asegura que exista
  step4: Step4State|null;
  step5: any|null;
}

export interface Step4State {
  correoContacto?: string|null; celularContacto?: string|null;
  telOficinaContacto?: string|null; extensionOficina?: string|null;
  medioValidacion?: string|null;
}
export type Step5State = any;

export interface StepData {
  step1: Step1State | null;
  step2: Step2State | null;
  step3: Step3State | null;
  step4: Step4State | null;
  step5: Step5State | null;
}

const LS_KEY = 'siau.wizard.stepdata';

@Injectable({ providedIn: 'root' })
export class StepFormStateService {
  private _state = new BehaviorSubject<StepData>(this.loadFromLS());
  state$ = this._state.asObservable();

  /* ----- storage helpers (ignora File al serializar) ----- */
  private serializeForLS(s: StepData) {
    return JSON.stringify(s, (_k, v) => (v instanceof File ? undefined : v));
  }
  private saveToLS(s: StepData) { localStorage.setItem(LS_KEY, this.serializeForLS(s)); }
  private loadFromLS(): StepData {
    const empty: StepData = { step1: null, step2: null, step3: null, step4: null, step5: null };
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return empty;
      const parsed = JSON.parse(raw) as Partial<StepData>;
      return { ...empty, ...parsed };
    } catch { return empty; }
  }

  /* ----- API genérica que ya tenías ----- */
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

  /* ----- Accessors cómodos (lo nuevo) ----- */
  get step1() { return this._state.value.step1 as Step1State | null; }
  set step1(v: Step1State | null) { this.save('step1', v); }

  get step2() { return this._state.value.step2 as Step2State | null; }
  set step2(v: Step2State | null) { this.save('step2', v); }

  get step3() { return this._state.value.step3 as Step3State | null; }
  /** No persistimos step3 por contener File (no serializable) */
  set step3(v: Step3State | null) { this.save('step3', v, /*persist*/ false); }

  get step4() { return this._state.value.step4 as Step4State | null; }
  set step4(v: Step4State | null) { this.save('step4', v); }

  get step5() { return this._state.value.step5 as Step5State | null; }
  set step5(v: Step5State | null) { this.save('step5', v); }
}
