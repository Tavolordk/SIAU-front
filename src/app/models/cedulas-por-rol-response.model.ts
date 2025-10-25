export interface CedulasPorRolItem {
  id: number;
  folio: string;
  tipo_solicitud: string;
  fecha: string;                  // 'YYYY-MM-DD'
  estatus: string;                // p.ej. 'Sin estatus' | 'Enviada' | ...
  total_filtrado: number;
}

export interface CedulasPorRolResponse {
  total: number;
  items: CedulasPorRolItem[];
}
