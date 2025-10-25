export interface AdminBusquedaFullItem {
  id: number;
  folio: string;
  tipo_solicitud: string;
  fecha: string;                  // 'YYYY-MM-DD'
  estatus: string;

  cuenta_codigo: string;
  nombres: string;
  primer_apellido: string;
  segundo_apellido: string;       // puede venir ""

  tipo_institucion: string;
  entidad: string;
  municipio: string;
  institucion: string;
  dependencia: string;            // puede venir ""
  corporacion: string;            // puede venir ""
  area: string;                   // puede venir ""

  total_filtrado: number;
}

export interface AdminBusquedaFullResponse {
  total: number;
  items: AdminBusquedaFullItem[];
}
