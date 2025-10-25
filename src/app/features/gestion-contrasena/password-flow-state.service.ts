import { Injectable } from '@angular/core';

export interface Paso1Payload {
  currentPassword: string;
}
export interface Paso2Payload {
  codigo: string;
  nueva: string;
}

@Injectable({ providedIn: 'root' })
export class PasswordFlowStateService {

  private _paso1?: Paso1Payload;
  private _paso2?: Paso2Payload;
  private _done = false;

  // === Getters como propiedades (para usar flow.paso1 / flow.paso2 / flow.done) ===
  get paso1(): Paso1Payload | undefined { return this._paso1; }
  get paso2(): Paso2Payload | undefined { return this._paso2; }
  get done(): boolean { return this._done; }

  // === Setters / mutadores ===
  setPaso1(v: Paso1Payload) {
    this._paso1 = v;
    this._done = false;            // al reiniciar el flujo, aún no está finalizado
  }

  setPaso2(v: Paso2Payload) {
    this._paso2 = v;
    this._done = true;             // al registrar el paso 2, damos por completado el flujo
  }

  setDone(v = true) { this._done = v; }

  clear() {
    this._paso1 = undefined;
    this._paso2 = undefined;
    this._done = false;
  }

  // === Métodos "legacy" (compatibilidad con tu código actual) ===
  getPaso1(): Paso1Payload | undefined { return this._paso1; }
  getPaso2(): Paso2Payload | undefined { return this._paso2; }
  isDone(): boolean { return this._done; }
}
