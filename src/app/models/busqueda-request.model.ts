export interface BusquedaRequest {
  cuenta_codigo: string;          // "U654321"
  tipo_usuario: string;           // "ENLACE" | "ADMIN" | etc.

  nombres: string | null;
  primer_apellido: string | null;
  segundo_apellido: string | null;
  curp: string | null;
  rfc: string | null;

  folio: string | null;
  tipo_tramite: string | null;
  estatus: string | null;

  // Formato ISO (YYYY-MM-DD)
  fecha_desde: string | null;     // "2025-10-01"
  fecha_hasta: string | null;     // "2025-10-31"

  dependencia: string | null;
  corporacion: string | null;

  busca: string | null;

  limit: number;                  // 50
  offset: number;                 // 0
}
