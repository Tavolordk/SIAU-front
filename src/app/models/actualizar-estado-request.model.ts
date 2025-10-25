// src/app/models/actualizar-estado-request.model.ts

export type EstadoCedula = 'Validada' | 'Rechazada' | 'Borrador' | string;

export interface ActualizarEstadoItem {
  id: number;
  nuevoDato: EstadoCedula; // respeta el nombre EXACTO del JSON
}

export interface ActualizarEstadoRequest {
  cedula: ActualizarEstadoItem[];
}
