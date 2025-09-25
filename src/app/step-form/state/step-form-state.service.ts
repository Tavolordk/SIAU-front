import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CatPerfilDto } from '../../services/catalogos.service';

/* ==== Tipos por paso (ajústalos a tus forms si hace falta) ==== */
export interface Step1State {
  rfc?: string | null; nombre?: string | null; nombre2?: string | null;
  apellidoPaterno?: string | null; apellidoMaterno?: string | null;
  curp?: string | null; cuip?: string | null;
  telefono?: string | null; correo?: string | null;
  tipoUsuario?: number;
  cuentaUsuario?: string | null; password?: string | null;
  numeroOficio?: string | null; folio?: string | null;
}
export interface Step2State {
  cargo?: string | null; funciones?: string | null; funciones2?: string | null;
  entidad?: number | null; municipio?: number | null; area?: number | null;
  entidad2?: number | null; municipio2?: number | null; corporacion2?: number | null;
  chkModifica?: boolean; chkAmplia?: boolean; chkReactiva?: boolean; chkCambioAdscripcion?: boolean;
  perfiles?: CatPerfilDto[];         // lista que persistes en el form (control 'perfiles')

}
/** ¡Ojo! File no se puede persistir en localStorage; ver nota abajo. */
export interface Step3State {
  perfiles?: string[];
  docs?: Array<{
    fechaDocumento: string | undefined; file: File; tipoDocumentoId: number; storageRuta?: string; storageProveedor?: string
  }>;
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

export interface Step4State {
  correoContacto?: string | null; celularContacto?: string | null;
  telOficinaContacto?: string | null; extensionOficina?: string | null;
  medioValidacion?: string | null;
}
export type Step5State = any;

export interface StepData {
  step1: Step1State | null;
  step2: Step2State | null;
  step3: Step3State | null;
  step4: Step4State | null;
  step5: Step5State | null;
}
// añade un tipo y una clave ‘otpCtx’
export interface OtpCtx {
  canal: 'correo' | 'telegram' | 'sms';
  contacto: string;
  proposito: 'signup' | 'change_contact' | 'login' | '2fa';
  lastCode?: string | null;        // <- nuevo
  lastIssuedAt?: string | null;    // <- opcional
}// ... ya tienes métodos save/patch; solo úsalo como en el Step4.

const LS_KEY = 'siau.wizard.stepdata';

@Injectable({ providedIn: 'root' })
export class StepFormStateService {
  private _step1: any | undefined;
  private _step2: Step2State | undefined;
  private _step3: any | undefined;
  private _step4: any | undefined;
  private _step5: any | undefined;
  private _state = new BehaviorSubject<StepData>(this.loadFromLS());
  state$ = this._state.asObservable();
  // dentro de la clase StepFormStateService (arriba de los métodos)
  private _otpCtx: OtpCtx | null = null;   // canal/contacto/propósito
  private _otpSim: string | null = null;   // código simulado para QA

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
  get step1() { return this._step1; }
  set step1(v) { this._step1 = v; }            // ❌ NO llames save() aquí

  get step2() { return this._step2; }
  set step2(v) { this._step2 = v ?? undefined; } // idem

  get step3() { return this._step3; }
  set step3(v) { this._step3 = v; }

  get step4() { return this._step4; }
  set step4(v) { this._step4 = v; }

  get step5() { return this._step5; }
  set step5(v) { this._step5 = v; }

  /** Guarda clave/valor sin tocar setters (evita recursión) */
  save(key: 'step1' | 'step2' | 'step3' | 'step4' | 'step5' | 'otpCtx', value: any, persist = false) {
    switch (key) {
      case 'step1':
        this._step1 = value;
        break;
      case 'step2':
        // merge/patchea, no reemplaces (para no borrar entidad/municipio/area, etc.)
        this._step2 = { ...(this._step2 ?? {}), ...(value ?? {}) };
        break;
      case 'step3':
        this._step3 = value; break;
      case 'step4':
        this._step4 = value; break;
      case 'step5':
        this._step5 = value; break;
      case 'otpCtx': this._otpCtx = value as OtpCtx; break;
    }

    if (persist) {
      const toPersist =
        key === 'step1' ? this._step1 :
          key === 'step2' ? this._step2 :
            key === 'step3' ? this._step3 :
              key === 'step4' ? this._step4 :
                key === 'step5' ? this._step5 :
                  this._otpCtx;                                         // 👈 nuevo
      try { localStorage.setItem(key, JSON.stringify(toPersist)); } catch { }
    }
  }

  /** Atajo explícito para step2 */
  patchStep2(patch: Partial<Step2State>, persist = false) {
    this._step2 = { ...(this._step2 ?? {}), ...(patch ?? {}) };
    if (persist) {
      try { localStorage.setItem('step2', JSON.stringify(this._step2)); } catch { }
    }
  }

  get(key: 'step1' | 'step2' | 'step3' | 'step4' | 'step5' | 'otpCtx') {
    switch (key) {
      case 'step1': return this._step1;
      case 'step2': return this._step2;
      case 'step3': return this._step3;
      case 'step4': return this._step4;
      case 'step5': return this._step5;
      case 'otpCtx': return this._otpCtx;
    }
  }
  clearAll(alsoStorage: boolean = true) {
    this._step1 = this._step2 = this._step3 = this._step4 = this._step5 = undefined;
    this._otpCtx = null;
    this._otpSim = null;                  // 👈 nuevo

    if (alsoStorage) {
      try {
        ['step1', 'step2', 'step3', 'step4', 'step5', 'otpCtx', 'otpSim']  // 👈 agrega otpSim
          .forEach(k => localStorage.removeItem(k));
      } catch { }
    }
  }

  private readLS<T>(k: string): T | undefined {
    try { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) as T : undefined; }
    catch { return undefined; }
  }
  // ===== OTP context =====
  setOtpCtx(v: OtpCtx) {
    this._otpCtx = v;
    try { localStorage.setItem('otpCtx', JSON.stringify(v)); } catch { }
  }
  getOtpCtx(): OtpCtx | null {
    if (this._otpCtx) return this._otpCtx;
    try {
      const raw = localStorage.getItem('otpCtx');
      if (raw) this._otpCtx = JSON.parse(raw) as OtpCtx;
    } catch { }
    return this._otpCtx;
  }

  // ===== OTP simulado =====
  setOtpSim(code: string | null) {
    this._otpSim = code;
    try {
      if (!code) localStorage.removeItem('otpSim');
      else localStorage.setItem('otpSim', code);
    } catch { }
  }
  getOtpSim(): string | null {
    if (this._otpSim !== null) return this._otpSim;
    try { this._otpSim = localStorage.getItem('otpSim'); } catch { }
    return this._otpSim;
  }
// Dentro de StepFormStateService

// Guarda el último OTP emitido en el ctx y lo persiste en localStorage
setLastOtp(code: string | null) {
  const ctx = this.getOtpCtx() ?? ({} as OtpCtx); // lee el ctx desde LS si hace falta
  const updated: OtpCtx = {
    ...ctx,
    lastCode: code,
    lastIssuedAt: new Date().toISOString()
  } as OtpCtx;

  this.setOtpCtx(updated); // <-- en lugar de this.set(...)
}

// Devuelve el último OTP guardado
getLastOtp(): string | null {
  return this.getOtpCtx()?.lastCode ?? null; // <-- en lugar de this.get('otpCtx')
}

}
