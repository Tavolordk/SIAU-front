// src/app/models/cedulas-institucion-request.model.ts
export interface CedulasInstitucionRequest {
  cuenta_codigo: string;   // "U765432"
  tipo_usuario: string;    // "SUPERVISOR", etc.
  limit: number;           // 50
  offset: number;          // 0
}
