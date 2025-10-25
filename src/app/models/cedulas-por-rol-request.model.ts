// src/app/models/cedulas-por-rol-request.model.ts
export interface CedulasPorRolRequest {
  cuenta_codigo: string;        // "U876543"
  tipo_usuario: string;         // "ADMINISTRADOR" | ...

  busca: string | null;
  estatus: string | null;
  tipo_tramite: string | null;
  fecha_desde: string | null;   // ISO YYYY-MM-DD o null
  fecha_hasta: string | null;   // ISO YYYY-MM-DD o null

  limit: number;                // 50
  offset: number;               // 0
}
