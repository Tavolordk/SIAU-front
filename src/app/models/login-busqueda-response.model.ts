export interface LoginBusquedaItem {
  id: number;
  folio: string;
  fecha: string;                  // 'YYYY-MM-DD'
  nombres: string;
  primer_apellido: string;
  segundo_apellido: string;       // puede venir vacío ""
  tipo_solicitud: string;
  tipo_institucion: string;
  entidad: string;
  municipio: string;
  institucion: string;
  dependencia: string;
  corporacion: string;            // puede venir vacío ""
  estatus: string;
  total_filtrado: number;
}

export interface LoginBusquedaResponse {
  total: number;
  items: LoginBusquedaItem[];
}
