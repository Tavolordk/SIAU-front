export interface CedulasInstitucionItem {
  id: number;
  folio: string;
  tipo_solicitud: string;
  fecha: string;                  // 'YYYY-MM-DD'
  estatus: string;
  total_filtrado: number;
}

export interface CedulasInstitucionResponse {
  total: number;
  items: CedulasInstitucionItem[];
}
