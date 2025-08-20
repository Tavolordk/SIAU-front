import { Injectable } from '@angular/core';
import { ExcelUsuarioRow } from '../models/excel.model';

@Injectable({
  providedIn: 'root'
})
export class CargaUsuarioStoreService {
  private corregidos = new Set<number>();
  private _datosCargados: ExcelUsuarioRow[] = [];

  /** Guardar los datos cargados del Excel */
  setDatosCargados(data: ExcelUsuarioRow[]): void {
    this._datosCargados = data;
  }

  /** Obtener los datos cargados del Excel */
  getDatosCargados(): ExcelUsuarioRow[] {
    return this._datosCargados;
  }

  /** Obtener todos los índices corregidos */
  getTodos(): number[] {
    return Array.from(this.corregidos);
  }

  /** Limpiar la memoria (datos cargados y correcciones) */
  limpiar(): void {
    this.corregidos.clear();
    this._datosCargados = [];
  }

  marcarCorregido(indice: number | string): void {
  const idx = typeof indice === 'string' ? parseInt(indice, 10) : indice;
  if (isNaN(idx)) return;
  this.corregidos.add(idx);
  if (this._datosCargados[idx]) {
    this._datosCargados[idx].editado = true;
  }
}

estaCorregido(indice: number | string): boolean {
  const idx = typeof indice === 'string' ? parseInt(indice, 10) : indice;
  if (isNaN(idx)) return false;
  return this.corregidos.has(idx);
}
removeRow(row: ExcelUsuarioRow) {
  const datos = this.getDatosCargados().filter(r => r !== row);
  this.setDatosCargados(datos);
}
}
